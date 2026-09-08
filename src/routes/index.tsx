import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  Store,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKeepServ } from "@/lib/keepserv/store";
import type { UserAccount } from "@/lib/keepserv/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Keep Serv — Gestão Multi-Tenant para Bares e Restaurantes" },
      {
        name: "description",
        content:
          "Keep Serv conecta garçons, cozinha e gestores em tempo real com separação por lojas (Tenants) e controle de acesso RBAC.",
      },
      { property: "og:title", content: "Keep Serv — Gestão Multi-Tenant em tempo real" },
      {
        property: "og:description",
        content:
          "Acesse como Dev, Gestor ou Colaborador e acompanhe pedidos, equipe e cardápio de forma isolada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { loginWithCredentials, allUsers, allLojas, changeUserPassword } = useKeepServ();
  const navigate = useNavigate();

  const [codigoLoja, setCodigoLoja] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados do Modal de Recuperação de Senha
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotCodigoLoja, setForgotCodigoLoja] = useState("");
  const [forgotIdentificador, setForgotIdentificador] = useState("");
  const [forgotStep, setForgotStep] = useState<"input" | "success">("input");
  const [foundUser, setFoundUser] = useState<UserAccount | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showDirectReset, setShowDirectReset] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = loginWithCredentials(usuario, password, codigoLoja);

    if (!res.success) {
      setErrorMessage(res.message || "Erro de autenticação. Verifique os dados digitados.");
      toast.error(res.message || "Acesso não autorizado.");
      return;
    }

    toast.success(`Bem-vindo, ${res.name}! Acesso liberado.`);

    // Redireciona conforme o nível e papel
    if (res.nivel === "dev") {
      navigate({ to: "/dev/lojas" });
    } else if (res.role === "gestor") {
      navigate({ to: "/dashboard" });
    } else if (res.role === "caixa") {
      navigate({ to: "/caixa" });
    } else {
      navigate({ to: "/pedidos" });
    }
  };

  const handleOpenForgot = () => {
    setForgotCodigoLoja(codigoLoja);
    setForgotIdentificador(usuario);
    setForgotStep("input");
    setForgotError(null);
    setFoundUser(null);
    setNewResetPassword("");
    setConfirmResetPassword("");
    setShowDirectReset(false);
    setIsForgotOpen(true);
  };

  const handleForgotSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const cleanCode = forgotCodigoLoja.trim().toUpperCase();
    const cleanId = forgotIdentificador.trim().toLowerCase();

    if (!cleanId) {
      setForgotError("Informe seu nome de usuário ou e-mail cadastrado.");
      return;
    }

    const matchesUser = (u: UserAccount) => {
      const uUser = (u.usuario || "").trim().toLowerCase();
      const uNameAlias = (u.username || "").trim().toLowerCase();
      const uEmail = (u.email || "").trim().toLowerCase();
      return uUser === cleanId || uNameAlias === cleanId || uEmail === cleanId;
    };

    let targetUser: UserAccount | undefined;

    if (cleanCode) {
      const targetLoja = allLojas.find((l) => l.codigo_loja.trim().toUpperCase() === cleanCode);
      if (!targetLoja) {
        setForgotError(`Código de loja "${cleanCode}" não foi encontrado.`);
        return;
      }
      targetUser = allUsers.find((u) => u.loja_id === targetLoja.id && matchesUser(u));
      if (!targetUser) {
        setForgotError(
          `Nenhum usuário cadastrado com "${cleanId}" na loja "${targetLoja.nome_fantasia}".`,
        );
        return;
      }
    } else {
      // Se não informou código de loja, verifica se é o Dev ou se é único
      const devMatch = allUsers.find((u) => u.nivel === "dev" && matchesUser(u));
      if (devMatch) {
        targetUser = devMatch;
      } else {
        const potential = allUsers.filter(matchesUser);
        if (potential.length === 1 && potential[0].nivel === "dev") {
          targetUser = potential[0];
        } else if (potential.length > 0) {
          setForgotError(
            "Para colaboradores e gestores de loja, é obrigatório informar o Código da Loja.",
          );
          return;
        } else {
          setForgotError(
            "Usuário não encontrado. Verifique o usuário ou informe o Código da Loja.",
          );
          return;
        }
      }
    }

    if (!targetUser.email || !targetUser.email.includes("@")) {
      setForgotError(
        "Este usuário não possui um e-mail válido cadastrado no sistema. Contate o administrador.",
      );
      return;
    }

    setFoundUser(targetUser);
    setForgotStep("success");
    toast.success(`Instruções de redefinição enviadas para ${targetUser.email}!`);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser) return;

    if (!newResetPassword.trim() || newResetPassword.length < 4) {
      toast.error("A nova senha deve ter no mínimo 4 caracteres.");
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      toast.error("As senhas digitadas não coincidem.");
      return;
    }

    changeUserPassword(foundUser.id, newResetPassword.trim());
    toast.success("Senha redefinida com sucesso! Você já pode entrar com a nova senha.");

    // Preenche campos no login para conveniência
    setUsuario(foundUser.usuario || foundUser.username || "");
    if (foundUser.loja_id) {
      const loja = allLojas.find((l) => l.id === foundUser.loja_id);
      if (loja) setCodigoLoja(loja.codigo_loja);
    }
    setPassword(newResetPassword);
    setIsForgotOpen(false);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Banner Lateral Esquerdo */}
      <aside className="bg-brand-gradient relative hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
            <ChefHat className="size-6 text-primary-foreground" />
          </span>
          <div>
            <span className="font-display text-2xl font-semibold text-primary-foreground">
              Keep<span className="text-accent">Serv</span>
            </span>
          </div>
        </div>

        <div className="max-w-lg">
          <h1 className="font-display text-5xl leading-[1.05] font-semibold text-primary-foreground">
            A plataforma completa para impulsionar o seu negócio.
          </h1>
          <p className="mt-5 text-lg text-primary-foreground/80">
            Seus dados, cardápio, estoque e equipe organizados em um único lugar, com acesso seguro
            e personalizado para cada setor.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur">
              <ul className="mt-2 space-y-2 text-sm text-primary-foreground/90">
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs font-bold text-accent"></span>
                  <span>
                    {" "}
                    • Agilidade no atendimento, organização no estoque e controle de acesso sob
                    medida para cada colaborador.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs font-bold text-accent"></span>
                  <span> • Controle total sobre vendas, insumos e desempenho operacional..</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs font-bold text-accent"></span>
                  <span>
                    {" "}
                    • Acesso aos dados da sua própria loja e gestão exclusiva da sua equipe.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-xs font-bold text-accent"></span>
                  <span>
                    {" "}
                    • Acesso restrito apenas às operações rotineiras do salão, cozinha ou caixa.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-primary-foreground/60">
          <p>KEEPSERVAPP ®</p>
          <span className="font-mono">Versão 2.5</span>
        </div>
      </aside>

      {/* Formulário de Login */}
      <div className="flex items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-md">
          {/* Cabeçalho Mobile */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="bg-brand-gradient flex size-10 items-center justify-center rounded-xl">
                <ChefHat className="size-5 text-primary-foreground" />
              </span>
              <span className="font-display text-xl font-semibold">
                Keep<span className="text-accent">Serv</span>
              </span>
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Entrar no sistema
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informe seu nome de usuário, senha e código da loja para acessar.
            </p>
          </div>

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold">Falha no Acesso:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Campo: Código da Loja */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="codigoLoja" className="text-xs font-semibold">
                  Código da Loja
                </Label>
                <span className="text-xs text-muted-foreground">
                  <span className="font-mono">Ex: KEEPSERV01</span>
                </span>
              </div>
              <div className="relative">
                <Store className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="codigoLoja"
                  type="text"
                  placeholder="Ex: KEEPSERV01"
                  value={codigoLoja}
                  onChange={(e) => setCodigoLoja(e.target.value.toUpperCase())}
                  className="pl-9 font-mono uppercase"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Campo: Nome de Usuário */}
            <div className="space-y-1.5">
              <Label htmlFor="usuario" className="text-xs font-semibold">
                Nome de Usuário
              </Label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="usuario"
                  type="text"
                  required
                  placeholder="Ex: gestor, dev, garcom"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="pl-9"
                  autoComplete="username"
                  autoCapitalize="none"
                />
              </div>
            </div>

            {/* Campo: Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full font-semibold shadow-xs">
              Entrar no Sistema
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full font-semibold shadow-xs"
              onClick={handleOpenForgot}
            >
              <KeyRound className="mr-2 size-4 text-muted-foreground" />
              Esqueceu a Senha?
            </Button>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              <span className="font-mono">Versão 2.5</span>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Recuperação de Senha com E-mail */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <KeyRound className="size-5 text-indigo-600" />
              <DialogTitle className="text-base font-bold sm:text-lg">
                Recuperação de Senha
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {forgotStep === "input"
                ? "Informe o código da sua loja e seu nome de usuário (ou e-mail cadastrado). As instruções de recuperação serão enviadas para o e-mail registrado durante seu cadastro."
                : "Instruções e link de recuperação gerados com sucesso para o e-mail cadastrado."}
            </DialogDescription>
          </DialogHeader>

          {forgotStep === "input" ? (
            <form onSubmit={handleForgotSearch} className="space-y-4 py-2">
              {forgotError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="forgotCodigo" className="text-xs font-semibold">
                    Código da Loja
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Obrigatório para Gestores e Colaboradores
                  </span>
                </div>
                <div className="relative">
                  <Store className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="forgotCodigo"
                    type="text"
                    placeholder="Ex: KEEPSERV01"
                    value={forgotCodigoLoja}
                    onChange={(e) => setForgotCodigoLoja(e.target.value.toUpperCase())}
                    className="pl-9 font-mono uppercase text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="forgotIdentificador" className="text-xs font-semibold">
                    Nome de Usuário ou E-mail <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">identificação</span>
                </div>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="forgotIdentificador"
                    type="text"
                    required
                    placeholder="Ex: gestor, ana.paula ou e-mail cadastrado"
                    value={forgotIdentificador}
                    onChange={(e) => setForgotIdentificador(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  O login é feito com nome de usuário, mas o link de recuperação é enviado ao e-mail
                  informado no seu cadastro.
                </p>
              </div>

              <DialogFooter className="pt-2 sm:justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsForgotOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  <Send className="size-3.5" />
                  Localizar Conta & Enviar Link
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-950 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Instruções enviadas com sucesso!</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  As instruções para redefinição de senha da conta{" "}
                  <strong>{foundUser?.nome || foundUser?.name}</strong> (@
                  {foundUser?.usuario || foundUser?.username}) foram enviadas para o e-mail
                  cadastrado:
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-background/80 p-2.5 font-mono text-xs border border-emerald-500/30">
                  <Mail className="size-4 text-primary shrink-0" />
                  <span className="truncate font-semibold text-foreground">{foundUser?.email}</span>
                </div>
              </div>

              {/* Opção de Redefinição Imediata */}
              <div className="rounded-xl border border-border/70 bg-muted/40 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-500" />
                    Redefinir Senha Agora
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary"
                    onClick={() => setShowDirectReset(!showDirectReset)}
                  >
                    {showDirectReset ? "Ocultar" : "Informar Nova Senha"}
                  </Button>
                </div>

                {showDirectReset && (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="newPass" className="text-xs font-medium">
                        Nova Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="newPass"
                          type={showResetPassword ? "text" : "password"}
                          placeholder="Mínimo 4 caracteres"
                          value={newResetPassword}
                          onChange={(e) => setNewResetPassword(e.target.value)}
                          className="pl-8 pr-8 text-xs"
                          required
                          minLength={4}
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showResetPassword ? "Ocultar" : "Exibir"}
                        >
                          {showResetPassword ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="confirmPass" className="text-xs font-medium">
                        Confirmar Nova Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="confirmPass"
                          type={showResetPassword ? "text" : "password"}
                          placeholder="Repita a nova senha"
                          value={confirmResetPassword}
                          onChange={(e) => setConfirmResetPassword(e.target.value)}
                          className="pl-8 text-xs"
                          required
                          minLength={4}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      Gravar Nova Senha e Retornar ao Login
                    </Button>
                  </form>
                )}
              </div>

              <DialogFooter className="pt-2 sm:justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForgotStep("input")}
                  className="gap-1.5"
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar
                </Button>
                <Button type="button" size="sm" onClick={() => setIsForgotOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
