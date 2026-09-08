import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ChefHat, Eye, EyeOff, Lock, Store, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKeepServ } from "@/lib/keepserv/store";

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
  const { loginWithCredentials } = useKeepServ();
  const navigate = useNavigate();

  const [codigoLoja, setCodigoLoja] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
              onClick={() => {
                toast.info("Recuperação de Acesso", {
                  description:
                    "Para redefinir sua senha, solicite ao Gestor da sua loja pelo painel 'Minha Equipe' ou contate o suporte técnico.",
                });
              }}
            >
              Esqueceu a Senha?
            </Button>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              <span className="font-mono">Versão 2.5</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
