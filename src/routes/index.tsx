import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  Flame,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  QrCode,
  Receipt,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Table2,
  TrendingUp,
  User,
  UserPlus,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { useState, useId } from "react";
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
import { useAuth } from "@/state";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      cadastrar: typeof search.cadastrar === "string" ? search.cadastrar : undefined,
      plano: typeof search.plano === "string" ? search.plano : undefined,
    };
  },
  head: () => ({
    meta: [
      {
        title: "KeepServ — Sistema Operacional de Gestão para Bares, Restaurantes e Cafeterias",
      },
      {
        name: "description",
        content:
          "Zere comandas de papel, acelere o atendimento no salão, controle a cozinha em tempo real e organize o caixa e financeiro do seu restaurante com o KeepServ.",
      },
      {
        property: "og:title",
        content: "KeepServ — Acelere o Salão e Multiplique os Lucros do seu Restaurante",
      },
      {
        property: "og:description",
        content:
          "Cardápio com QR Code, Terminal Garçom, KDS para Cozinha, Controle de Mesas, Caixa/PDV e Gestão Financeira Completa. Teste 14 dias grátis!",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomeLandingPage,
});

function WelcomeLandingPage() {
  const { session, createLoja, loginWithCredentials, logout } = useAuth();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();

  // Modal de Cadastro
  const [isRegisterOpen, setIsRegisterOpen] = useState(() => searchParams.cadastrar === "true");
  const [selectedPlan, setSelectedPlan] = useState<"start" | "pro" | "enterprise">(() => {
    if (searchParams.plano === "start" || searchParams.plano === "enterprise") {
      return searchParams.plano;
    }
    return "pro";
  });

  // Campos do Cadastro da Loja
  const [nomeLoja, setNomeLoja] = useState("");
  const [codigoLoja, setCodigoLoja] = useState("");
  const [cidade, setCidade] = useState("");
  const [telefone, setTelefone] = useState("");

  // Campos do Gestor
  const [nomeGestor, setNomeGestor] = useState("");
  const [usuarioGestor, setUsuarioGestor] = useState("");
  const [emailGestor, setEmailGestor] = useState("");
  const [senhaGestor, setSenhaGestor] = useState("");
  const [confirmSenhaGestor, setConfirmSenhaGestor] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Apresentação
  const [billingCycle, setBillingCycle] = useState<"mensal" | "anual">("anual");
  const [activeTabPreview, setActiveTabPreview] = useState<"salao" | "garcom" | "kds" | "caixa">(
    "salao",
  );
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Auto-gera sugestão de código da loja com base no nome
  const handleNomeLojaChange = (val: string) => {
    setNomeLoja(val);
    if (!codigoLoja || codigoLoja === formatStoreCode(nomeLoja)) {
      setCodigoLoja(formatStoreCode(val));
    }
  };

  const formatStoreCode = (str: string) => {
    const clean = str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 10);
    return clean ? `${clean}01` : "";
  };

  const handleOpenRegister = (plan: "start" | "pro" | "enterprise" = "pro") => {
    setSelectedPlan(plan);
    setRegisterError(null);
    setIsRegisterOpen(true);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!nomeLoja.trim()) {
      setRegisterError("Informe o nome do seu estabelecimento.");
      return;
    }

    const cleanCode = codigoLoja.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      setRegisterError("O código da loja deve possuir pelo menos 3 caracteres.");
      return;
    }

    if (!nomeGestor.trim()) {
      setRegisterError("Informe o nome completo do gestor.");
      return;
    }

    const cleanUser = usuarioGestor.trim().toLowerCase();
    if (!cleanUser || cleanUser.length < 3) {
      setRegisterError("O nome de usuário deve ter no mínimo 3 caracteres.");
      return;
    }

    if (!emailGestor.trim() || !emailGestor.includes("@")) {
      setRegisterError("Informe um e-mail válido para sua conta de gestor.");
      return;
    }

    if (!senhaGestor || senhaGestor.length < 4) {
      setRegisterError("A senha deve ter no mínimo 4 caracteres.");
      return;
    }

    if (senhaGestor !== confirmSenhaGestor) {
      setRegisterError("As senhas informadas não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = createLoja(
        {
          nome_fantasia: nomeLoja.trim(),
          codigo_loja: cleanCode,
          cidade: cidade.trim() || undefined,
          telefone: telefone.trim() || undefined,
          status: "ativo",
        },
        {
          nome: nomeGestor.trim(),
          usuario: cleanUser,
          senha: senhaGestor.trim(),
          email: emailGestor.trim().toLowerCase(),
          phone: telefone.trim() || undefined,
        },
      );

      if (!res.success) {
        setRegisterError(res.message || "Erro ao criar o estabelecimento.");
        setIsSubmitting(false);
        return;
      }

      toast.success(
        `🎉 Parabéns! Loja "${nomeLoja}" e conta de gestor criadas com sucesso! Entrando no sistema...`,
      );

      // Efetua login automático imediatamente
      const loginRes = loginWithCredentials(cleanUser, senhaGestor.trim(), cleanCode);

      setIsSubmitting(false);
      setIsRegisterOpen(false);

      if (loginRes.success) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/login" });
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : "Erro inesperado ao cadastrar.";
      setRegisterError(msg);
      toast.error(msg);
    }
  };

  const getDashboardDestination = () => {
    if (!session) return "/login";
    if (session.nivel === "dev") return "/dev/lojas";
    if (session.role === "gestor") return "/dashboard";
    if (session.role === "caixa") return "/caixa";
    return "/pedidos";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ========================================================= */}
      {/* BANNER DE SESSÃO ATIVA (SE JÁ ESTIVER LOGADO)             */}
      {/* ========================================================= */}
      {session && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Você já está conectado como <strong>{session.name}</strong> (
                {session.loja?.nome_fantasia || "KeepServ"})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs gap-1.5 shadow-2xs font-semibold"
                onClick={() => navigate({ to: getDashboardDestination() })}
              >
                <LayoutDashboard className="size-3.5" />
                Ir para o Painel do Sistema
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
                onClick={() => logout()}
              >
                <LogOut className="size-3.5" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CABEÇALHO / NAVBAR COMERCIAL                              */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Marca */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="bg-brand-gradient flex size-11 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-105">
              <ChefHat className="size-6 text-primary-foreground" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold tracking-tight text-foreground leading-none">
                Keep<span className="text-primary">Serv</span>
              </span>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase mt-0.5">
                Sistema Operacional para Bares & Restaurantes
              </span>
            </div>
          </Link>

          {/* Links de Navegação Desktop */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#recursos" className="hover:text-foreground transition-colors">
              Módulos
            </a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <a href="#planos" className="hover:text-foreground transition-colors">
              Planos & Preços
            </a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">
              Depoimentos
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          {/* Ações: Login e Cadastro */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/login" })}
              className="gap-1.5 text-xs sm:text-sm font-semibold h-9 px-2.5 sm:px-3.5 border-border hover:bg-muted shadow-2xs"
            >
              <User className="size-3.5 sm:size-4 text-primary" />
              <span>Login</span>
              <span className="hidden md:inline text-muted-foreground font-normal">
                | Já sou cliente
              </span>
            </Button>

            <Button
              size="sm"
              onClick={() => handleOpenRegister("pro")}
              className="gap-1.5 text-xs sm:text-sm font-semibold h-9 px-3 sm:px-4 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <UserPlus className="size-3.5 sm:size-4" />
              <span>Cadastrar</span>
              <span className="hidden sm:inline">Restaurante</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* HERO SECTION COMERCIAL DE ALTO IMPACTO                    */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-border/60">
        {/* Glow de fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge de Destaque */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-6 shadow-2xs">
            <Sparkles className="size-3.5 text-amber-500 fill-amber-500 animate-pulse" />
            <span>Plataforma Completa de Gestão para Bares, Restaurantes e Cafeterias</span>
          </div>

          {/* Headline Principal */}
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.12]">
            Zere comandas perdidas, acelere o salão e{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-600 to-amber-500 bg-clip-text text-transparent">
              multiplique o lucro
            </span>{" "}
            do seu restaurante.
          </h1>

          {/* Subheadline Comercial */}
          <p className="mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            O <strong>KeepServ</strong> integra garçons, cozinha, caixa e financeiro em uma única
            plataforma em tempo real. Deixe o papel e as planilhas soltas no passado e tenha
            visibilidade 360° do seu estabelecimento.
          </p>

          {/* CTAs Duplos */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Button
              size="lg"
              onClick={() => handleOpenRegister("pro")}
              className="w-full sm:w-auto h-12 px-6 font-semibold text-base shadow-md bg-primary hover:bg-primary/95 text-primary-foreground gap-2.5"
            >
              <Zap className="size-5 text-amber-300 fill-amber-300" />
              Cadastre seu Restaurante Grátis
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ to: "/login" })}
              className="w-full sm:w-auto h-12 px-6 font-semibold text-base border-border hover:bg-muted shadow-2xs gap-2"
            >
              <User className="size-4 text-primary" />
              Acessar Minha Loja (Login)
            </Button>
          </div>

          {/* Selos de Confiança */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              14 dias de teste grátis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Sem taxa de adesão ou fidelidade
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Funciona em celular, tablet e PC
            </span>
          </div>

          {/* ======================================================= */}
          {/* SIMULADOR INTERATIVO / PREVIEW DO SISTEMA               */}
          {/* ======================================================= */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card/80 p-2 sm:p-4 shadow-xl backdrop-blur-sm text-left">
            {/* Header da Janela Virtual */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-rose-500/80" />
                <span className="size-3 rounded-full bg-amber-500/80" />
                <span className="size-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-muted-foreground hidden sm:inline">
                  keepserv.app/demo-salao
                </span>
              </div>

              {/* Seletor de Telas do Preview */}
              <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-0.5">
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs font-medium min-w-max">
                  <button
                    type="button"
                    onClick={() => setActiveTabPreview("salao")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTabPreview === "salao"
                        ? "bg-background text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🍽️ Salão & Mesas
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabPreview("garcom")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTabPreview === "garcom"
                        ? "bg-background text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    📱 Terminal Garçom
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabPreview("kds")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTabPreview === "kds"
                        ? "bg-background text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    🍳 KDS Cozinha
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabPreview("caixa")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTabPreview === "caixa"
                        ? "bg-background text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    💳 Caixa & PDV
                  </button>
                </div>
              </div>
            </div>

            {/* Conteúdo Dinâmico do Preview */}
            <div className="p-3 sm:p-5">
              {activeTabPreview === "salao" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Mapa Interativo de Mesas em Tempo Real
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Visão rápida de ocupação, tempo em mesa e comandas ativas no salão.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-emerald-500" /> Livre (6)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-amber-500" /> Ocupada (4)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-rose-500" /> Fechamento (2)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">Mesa 01</span>
                        <Badge className="bg-amber-500 text-white text-[10px]">Ocupada</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Garçom: Marcos</p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-bold text-foreground">R$ 148,90</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">Mesa 02</span>
                        <Badge variant="outline" className="text-emerald-600 text-[10px]">
                          Livre
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Capacidade: 4 lugares</p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="text-emerald-600 font-medium">Pronta</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">Mesa 03</span>
                        <Badge className="bg-rose-500 text-white text-[10px]">Pede Conta</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Garçom: Ana Paula</p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold text-rose-600">R$ 285,40</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">Mesa 04</span>
                        <Badge className="bg-amber-500 text-white text-[10px]">Ocupada</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Garçom: Lucas</p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-bold text-foreground">R$ 94,00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTabPreview === "garcom" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Terminal do Garçom — Pedido Rápido na Palma da Mão
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        O garçom adiciona itens com observações e envia direto para a impressora ou
                        KDS.
                      </p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      Mesa 05 • Comanda #1042
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span>2x Burger Smash Duplo</span>
                        <span>R$ 78,00</span>
                      </div>
                      <p className="text-[11px] text-amber-600 font-medium">
                        Obs: 1 sem cebola, ponto bem passado
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span>1x Batata Rústica c/ Cheddar</span>
                        <span>R$ 34,90</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Porção grande</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span>2x Suco Natural de Laranja</span>
                        <span>R$ 24,00</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Com gelo e sem açúcar</p>
                    </div>
                  </div>

                  <div className="flex justify-end items-center gap-3 pt-2">
                    <span className="text-xs text-muted-foreground">
                      Total da Comanda: R$ 136,90
                    </span>
                    <Button size="sm" className="h-8 text-xs font-semibold gap-1.5">
                      <Zap className="size-3.5" />
                      Enviar para a Cozinha
                    </Button>
                  </div>
                </div>
              )}

              {activeTabPreview === "kds" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        KDS Cozinha — Fila de Produção por Tempo de Preparo
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Cronômetros de SLA, alertas visuais de atraso e notificações automáticas.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="size-3 text-emerald-500" /> Tempo médio: 14 min
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border-2 border-emerald-500/50 bg-emerald-500/5 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs">Mesa 02 • Pedido #841</span>
                        <Badge className="bg-emerald-600 text-white text-[10px]">04 min</Badge>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p>• 1x Filé Mignon ao Poivre</p>
                        <p>• 1x Risoto de Cogumelos</p>
                      </div>
                      <Button size="sm" variant="outline" className="w-full text-xs h-7">
                        Avançar para Pronto
                      </Button>
                    </div>

                    <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/5 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs">Mesa 07 • Pedido #839</span>
                        <Badge className="bg-amber-600 text-white text-[10px]">12 min</Badge>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p>• 2x Picanha na Chapa 600g</p>
                        <p className="text-amber-600 font-semibold">Obs: Ponto menos</p>
                      </div>
                      <Button size="sm" variant="outline" className="w-full text-xs h-7">
                        Avançar para Pronto
                      </Button>
                    </div>

                    <div className="rounded-xl border-2 border-primary/50 bg-primary/5 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs">Mesa 04 • Pedido #836</span>
                        <Badge className="bg-primary text-primary-foreground text-[10px]">
                          Pronto!
                        </Badge>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p>• 1x Salmão Grelhado c/ Legumes</p>
                        <p className="text-emerald-600 font-semibold">
                          Aguardando retirada do garçom
                        </p>
                      </div>
                      <Button size="sm" className="w-full text-xs h-7 bg-primary">
                        Notificar Garçom
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTabPreview === "caixa" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Caixa & PDV — Fechamento Descomplicado
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Divisão de contas, cálculo de troco, Pix com QR Code e comprovante impresso.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      Caixa Operacional #01
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-3">
                      <div className="flex justify-between text-xs pb-2 border-b border-border">
                        <span className="font-semibold">Comanda Mesa 08</span>
                        <span className="font-mono text-muted-foreground">4 pessoas</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Consumo Total:</span>
                          <span className="font-bold">R$ 320,00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxa de Serviço (10%):</span>
                          <span>R$ 32,00</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-primary pt-1 border-t border-border">
                          <span>Total Geral:</span>
                          <span>R$ 352,00</span>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-2 text-xs flex justify-between font-semibold text-primary">
                          <span>Divisão por pessoa (4):</span>
                          <span>R$ 88,00 cada</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2.5 flex flex-col justify-between">
                      <span className="text-xs font-semibold">Formas de Pagamento Aceitas:</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 font-medium">
                          <QrCode className="size-4 text-emerald-600" />
                          <span>Pix Instantâneo</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 font-medium">
                          <CreditCard className="size-4 text-indigo-600" />
                          <span>Cartão Débito/Crédito</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 font-medium">
                          <DollarSign className="size-4 text-amber-600" />
                          <span>Dinheiro</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 font-medium">
                          <Receipt className="size-4 text-purple-600" />
                          <span>Comprovante Térmico</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full text-xs font-semibold h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Concluir e Liberar Mesa
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* NÚMEROS E INDICADORES DE TRAÇÃO (PROVA SOCIAL)            */}
      {/* ========================================================= */}
      <section className="border-b border-border/70 bg-muted/30 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
                +450
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Restaurantes, bares e pubs atendidos
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-primary">-38%</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                No tempo de espera dos pratos e bebidas
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">0%</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Comandas perdidas ou esquecidas
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-emerald-600">
                99.9%
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Uptime e precisão em fechamento de caixa
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SEÇÃO: MÓDULOS COMPLETOS DO SISTEMA                       */}
      {/* ========================================================= */}
      <section id="recursos" className="py-20 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge
              variant="outline"
              className="mb-3 text-xs font-semibold border-primary/30 text-primary"
            >
              Módulos Integrados
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Tudo o que seu restaurante precisa para rodar sem atrito
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Cada setor da sua loja tem uma visão personalizada com acesso seguro baseado em papéis
              (RBAC) para garçom, cozinha, caixa e gestor.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Operação do Salão */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                  <Table2 className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Operação do Salão & Mesas</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Gerenciador interativo com mapa de mesas em cores dinâmicas. Acompanhe mesas
                  ocupadas, transferências, junção de comandas e solicitações de fechamento na hora.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-primary" /> Visualização por status em tempo real
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-primary" /> Alocação de garçons por mesa
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-primary" /> Transferência rápida sem reabertura
                </li>
              </ul>
            </div>

            {/* Card 2: Terminal do Garçom */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-5">
                  <UtensilsCrossed className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Terminal Ágil do Garçom</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Sem blocos de papel ou idas e vindas até a cozinha. O garçom lança pedidos pelo
                  próprio celular, adiciona complementos e é alertado quando o prato fica pronto.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-amber-600" /> Observações e modificadores no
                  pedido
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-amber-600" /> Notificação visual de prato pronto
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-amber-600" /> Acesso otimizado para telas mobile
                </li>
              </ul>
            </div>

            {/* Card 3: KDS Cozinha */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 mb-5">
                  <Flame className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">KDS — Cozinha em Tempo Real</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Quadro de produção em Kanban com alerta de tempo (SLA). Elimina perda de papel,
                  organiza fila por ordem de chegada e reduz erros de preparação.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-rose-600" /> Cronômetro com cor por tempo de
                  espera
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-rose-600" /> Separação por praças de produção
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-rose-600" /> Atualização em 1 clique para o salão
                </li>
              </ul>
            </div>

            {/* Card 4: Caixa & Pagamentos */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-5">
                  <CreditCard className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Caixa, Balcão & PDV Fiscal</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Recebimento e fechamento veloz com múltiplos métodos: Pix, Débito, Crédito e
                  Dinheiro. Divisão automática da conta por pessoas ou itens.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-600" /> Divisão exata por cliente
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-600" /> Emissão e impressão de recibo
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-600" /> Fechamento de turno e sangria
                </li>
              </ul>
            </div>

            {/* Card 5: Cardápio Digital QR Code */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 mb-5">
                  <QrCode className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Cardápio Digital c/ QR Code</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Geração automática de QR Code exclusivo por mesa. O cliente acessa pelo próprio
                  celular sem precisar baixar nenhum app, com fotos em alta resolução.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-indigo-600" /> Atualização de preços sem
                  reimpressão
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-indigo-600" /> Fotos atrativas e descrição de
                  pratos
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-indigo-600" /> Link direto e QR Code para
                  impressão
                </li>
              </ul>
            </div>

            {/* Card 6: Financeiro & CRM */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 mb-5">
                  <TrendingUp className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Financeiro, Estoque & CRM</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Fluxo de caixa, contas a pagar com alertas de vencimento, livro caixa, controle de
                  insumos no estoque e histórico de clientes e aniversariantes.
                </p>
              </div>
              <ul className="mt-6 pt-4 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-purple-600" /> Relatórios de faturamento e ticket
                  médio
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-purple-600" /> Alerta de estoque baixo de insumos
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-purple-600" /> Gestão de contas a pagar com
                  conciliação
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* COMO FUNCIONA / PASSO A PASSO                             */}
      {/* ========================================================= */}
      <section id="como-funciona" className="py-20 bg-muted/20 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="mb-3 text-xs font-semibold">
              Simplicidade de Implantação
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Seu restaurante funcionando em menos de 5 minutos
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Sem taxas de instalação e sem necessidade de comprar computadores caros.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative rounded-2xl border border-border bg-card p-6 space-y-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base">
                1
              </span>
              <h3 className="text-lg font-bold text-foreground">Cadastre seu Estabelecimento</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Crie o nome da sua loja e receba seu <strong>Código de Loja</strong> exclusivo. Crie
                a conta de gestor e tenha acesso instantâneo ao painel.
              </p>
            </div>

            <div className="relative rounded-2xl border border-border bg-card p-6 space-y-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base">
                2
              </span>
              <h3 className="text-lg font-bold text-foreground">Cadastre Cardápio & Mesas</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Adicione suas mesas, categorias e pratos com preços e fotos. Seus garçons já podem
                fazer login informando apenas o código da loja.
              </p>
            </div>

            <div className="relative rounded-2xl border border-border bg-card p-6 space-y-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base">
                3
              </span>
              <h3 className="text-lg font-bold text-foreground">Opere com Sincronia Total</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Garçons atendem na mesa, a cozinha recebe pedidos no KDS, o caixa fecha contas sem
                filas e você monitora o faturamento em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PLANOS & PREÇOS COMERCIAIS                                */}
      {/* ========================================================= */}
      <section id="planos" className="py-20 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge
              variant="outline"
              className="mb-3 text-xs font-semibold border-primary/30 text-primary"
            >
              Planos & Investimento
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Investimento que se paga no primeiro fim de semana
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Sem surpresas, sem taxa por pedido e sem fidelidade. Cancele quando quiser.
            </p>

            {/* Toggle Mensal / Anual */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-muted/50 p-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBillingCycle("mensal")}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  billingCycle === "mensal"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Cobrança Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("anual")}
                className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  billingCycle === "anual"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Cobrança Anual</span>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  Economize 20%
                </span>
              </button>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Plano Start */}
            <div className="rounded-3xl border border-border bg-card p-8 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Plano Start
                </span>
                <h3 className="mt-2 text-2xl font-bold text-foreground">Café & Balcão</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Para cafeterias, bistrôs e operações enxutas de balcão.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    {billingCycle === "anual" ? "R$ 71" : "R$ 89"}
                  </span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>
                {billingCycle === "anual" && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    Cobrado R$ 852 anualmente (2 meses grátis)
                  </p>
                )}

                <ul className="mt-8 space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Até 10 mesas ativas no salão</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Até 2 terminais de garçom simultâneos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Cardápio digital via QR Code</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Caixa com Pix, Cartão e Dinheiro</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Suporte via e-mail e base de conhecimento</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full font-semibold"
                  onClick={() => handleOpenRegister("start")}
                >
                  Começar com o Start
                </Button>
              </div>
            </div>

            {/* Plano Pro (Destaque) */}
            <div className="rounded-3xl border-2 border-primary bg-card p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-xl tracking-wider">
                Mais Escolhido ⭐
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Plano Pro Salão
                </span>
                <h3 className="mt-2 text-2xl font-bold text-foreground">Restaurante & Bar</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  O pacote completo para salão movimentado, garçons e cozinha ágil.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    {billingCycle === "anual" ? "R$ 143" : "R$ 179"}
                  </span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>
                {billingCycle === "anual" && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    Cobrado R$ 1.716 anualmente (economize R$ 432)
                  </p>
                )}

                <ul className="mt-8 space-y-3 text-xs text-foreground font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Mesas ilimitadas no salão</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Terminais de garçom ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>KDS Cozinha em tempo real com Kanban</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Controle de Estoque & Baixa de Insumos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Fluxo de Caixa & Contas a Pagar</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>CRM de Clientes & Aniversariantes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Suporte prioritário via WhatsApp</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Button
                  className="w-full font-semibold shadow-md bg-primary hover:bg-primary/95 text-primary-foreground gap-2"
                  onClick={() => handleOpenRegister("pro")}
                >
                  <Sparkles className="size-4" />
                  Cadastrar com Plano Pro (14 Dias Grátis)
                </Button>
              </div>
            </div>

            {/* Plano Enterprise */}
            <div className="rounded-3xl border border-border bg-card p-8 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Plano Enterprise
                </span>
                <h3 className="mt-2 text-2xl font-bold text-foreground">Redes & Franquias</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Para redes com múltiplas filiais e necessidade de auditoria centralizada.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    {billingCycle === "anual" ? "R$ 239" : "R$ 299"}
                  </span>
                  <span className="text-xs text-muted-foreground">/mês por loja</span>
                </div>
                {billingCycle === "anual" && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    Cobrado R$ 2.868 anualmente por filial
                  </p>
                )}

                <ul className="mt-8 space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Tudo do Plano Pro incluído</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Painel Dev Super Admin Multi-Lojas</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>DRE consolidado entre estabelecimentos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Onboarding guiado e treinamento da equipe</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    <span>Gerente de conta dedicado 24/7</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full font-semibold"
                  onClick={() => handleOpenRegister("enterprise")}
                >
                  Falar com Consultor
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* DEPOIMENTOS DE CLIENTES SATISFEITOS                       */}
      {/* ========================================================= */}
      <section id="depoimentos" className="py-20 bg-muted/30 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="mb-3 text-xs font-semibold">
              Casos Reais
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Quem usa o KeepServ não volta para o papel
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Veja a opinião de gestores e proprietários que transformaram o salão.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed italic">
                “Antes do KeepServ perdíamos cerca de 4 comandas por noite nos sábados movimentados.
                Agora o pedido sai da mesa do garçom e já apita no monitor da cozinha. Zeramos
                atrasos e reclamações.”
              </p>
              <div className="pt-3 border-t border-border/60 flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                  RS
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Rodrigo Santana</p>
                  <p className="text-[11px] text-muted-foreground">
                    Dono do Bar & Espeto Villa, DF
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed italic">
                “O fechamento de conta com divisão rápida por pessoa e Pix direto acabou com aquela
                fila irritante no caixa no final do expediente. O cliente paga e vai embora feliz.”
              </p>
              <div className="pt-3 border-t border-border/60 flex items-center gap-3">
                <div className="size-10 rounded-full bg-indigo-500/20 text-indigo-600 font-bold flex items-center justify-center text-xs">
                  MC
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Mariana Castro</p>
                  <p className="text-[11px] text-muted-foreground">
                    Gerente Geral da Pizzeria Bella
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed italic">
                “A separação de dados por loja me permite gerenciar minhas 3 hamburguerias com uma
                conta só. O controle de contas a pagar e fluxo de caixa me economiza horas de
                planilha.”
              </p>
              <div className="pt-3 border-t border-border/60 flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-500/20 text-emerald-600 font-bold flex items-center justify-center text-xs">
                  FA
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Felipe Almeida</p>
                  <p className="text-[11px] text-muted-foreground">Fundador da Rede Prime Burger</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FAQ COMERCIAL INTERATIVO                                  */}
      {/* ========================================================= */}
      <section id="faq" className="py-20 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="mb-3 text-xs font-semibold">
              Perguntas Frequentes
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Tire suas dúvidas antes de começar
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Tudo o que você precisa saber sobre o KeepServ e a implantação na sua loja.
            </p>
          </div>

          <div className="mt-12 space-y-3">
            {[
              {
                q: "Preciso comprar maquininhas ou computadores caros para usar o KeepServ?",
                a: "Não! O KeepServ é 100% web e roda em qualquer dispositivo conectado à internet: celulares Android/iPhone dos garçons, tablets comuns na cozinha ou no balcão, notebooks ou desktops comuns.",
              },
              {
                q: "Como funciona o teste de 14 dias grátis?",
                a: "Ao cadastrar seu estabelecimento você ganha 14 dias completos com acesso a todos os recursos da plataforma, sem precisar cadastrar cartão de crédito. Se gostar, escolhe o plano que melhor atende sua operação.",
              },
              {
                q: "Como meus garçons e cozinheiros fazem login no sistema?",
                a: "Muito simples: você cria a conta do colaborador na aba 'Minha Equipe'. Para entrar no turno, o garçom ou cozinheiro digita o Código da sua Loja (ex: KEEPSERV01) e o nome de usuário dele. Ele só vê as telas autorizadas para o cargo dele.",
              },
              {
                q: "Os dados do meu restaurante ficam isolados de outros restaurantes?",
                a: "Sim, absolutamente. O KeepServ adota arquitetura Multi-Tenant com isolamento estrito. Nenhuma outra loja ou usuário de fora tem acesso aos seus pedidos, receitas, colaboradores ou fluxo financeiro.",
              },
              {
                q: "Posso usar impressora térmica para emitir recibo e comandas?",
                a: "Sim. O sistema possui rotinas de impressão compatíveis com impressoras térmicas padrão (80mm e 58mm) e navegadores padrão de mercado.",
              },
              {
                q: "Posso cancelar a qualquer momento?",
                a: "Sim, nossos planos mensais não possuem fidelidade nem multa rescisória. Você tem liberdade total para continuar porque o sistema realmente traz resultados.",
              },
            ].map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`size-4 text-muted-foreground shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* BANNER FINAL DE CONVERSÃO                                 */}
      {/* ========================================================= */}
      <section className="bg-brand-gradient py-16 text-primary-foreground text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <span className="flex size-14 mx-auto items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <ChefHat className="size-8 text-primary-foreground" />
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Pronto para transformar a gestão do seu restaurante?
          </h2>
          <p className="text-base sm:text-lg text-primary-foreground/80 max-w-xl mx-auto leading-relaxed">
            Cadastre seu estabelecimento agora mesmo em menos de 2 minutos. Comece seu teste
            gratuito de 14 dias sem compromisso.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => handleOpenRegister("pro")}
              className="w-full sm:w-auto h-12 px-8 font-bold text-base bg-white text-indigo-900 hover:bg-white/90 shadow-lg"
            >
              Criar Conta Gratuita Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ to: "/login" })}
              className="w-full sm:w-auto h-12 px-8 font-semibold text-base border-white/30 text-white hover:bg-white/10"
            >
              Já tenho cadastro (Entrar)
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* RODAPÉ COMERCIAL                                          */}
      {/* ========================================================= */}
      <footer className="border-t border-border bg-card py-12 text-muted-foreground text-xs pb-24 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border/60">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <span className="bg-brand-gradient flex size-8 items-center justify-center rounded-xl">
                  <ChefHat className="size-4 text-primary-foreground" />
                </span>
                <span className="font-display text-lg font-bold text-foreground">
                  Keep<span className="text-primary">Serv</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed max-w-md">
                Plataforma web integrada para bares e restaurantes. Pedidos em tempo real, controle
                de mesas, cardápio digital QR Code, KDS de cozinha, caixa e financeiro multi-tenant.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                <MapPin className="size-3.5 text-primary" />
                <span>Desenvolvido em Brasília/DF — Brasil</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Navegação
              </p>
              <ul className="space-y-1.5">
                <li>
                  <a href="#recursos" className="hover:text-foreground">
                    Módulos do Sistema
                  </a>
                </li>
                <li>
                  <a href="#como-funciona" className="hover:text-foreground">
                    Como Funciona
                  </a>
                </li>
                <li>
                  <a href="#planos" className="hover:text-foreground">
                    Planos Comerciais
                  </a>
                </li>
                <li>
                  <a href="#depoimentos" className="hover:text-foreground">
                    Depoimentos
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground">
                    Perguntas Frequentes
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Acesso & Suporte
              </p>
              <ul className="space-y-1.5">
                <li>
                  <Link to="/login" className="hover:text-foreground font-medium text-primary">
                    → Acessar Sistema (Login)
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenRegister("pro")}
                    className="hover:text-foreground text-left"
                  >
                    Cadastre seu Restaurante
                  </button>
                </li>
                <li>
                  <span className="text-muted-foreground">Central de Atendimento</span>
                </li>
                <li>
                  <span className="text-muted-foreground">Brasília/DF • Versão 2.5</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p>© {new Date().getFullYear()} KeepServ ® • Todos os direitos reservados.</p>
            <p>Arquitetura Multi-Tenant Segura • Termos & Privacidade</p>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* BARRA FIXA INFERIOR DE CONVERSÃO NO CELULAR (THUMB ZONE)  */}
      {/* ========================================================= */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-2.5 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.12)] flex items-center gap-2 safe-area-pb">
        <Button
          onClick={() => handleOpenRegister("pro")}
          className="flex-1 font-bold text-xs h-11 bg-primary text-primary-foreground shadow-md gap-1.5 justify-center active:scale-98 transition-transform"
        >
          <Zap className="size-4 text-amber-300 fill-amber-300" />
          <span>Cadastrar Grátis</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/login" })}
          className="font-semibold text-xs h-11 px-4 border-border bg-card shadow-2xs gap-1.5 active:scale-98 transition-transform"
        >
          <User className="size-4 text-primary" />
          <span>Login</span>
        </Button>
      </div>

      {/* ========================================================= */}
      {/* MODAL DE CADASTRO COMERCIAL (NOVA LOJA + GESTOR)          */}
      {/* ========================================================= */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-primary">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <Store className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  Cadastrar meu Restaurante
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Comece agora seu teste grátis de 14 dias. Sem cartão de crédito.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {registerError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <strong>Falha no cadastro:</strong> {registerError}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-5 py-2">
            {/* Seletor do Plano Escolhido */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Plano Selecionado para Teste
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan("start")}
                  className={`p-2 rounded-xl text-left border text-xs transition-all ${
                    selectedPlan === "start"
                      ? "border-primary bg-primary/10 font-bold text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <p className="font-semibold text-foreground">Start</p>
                  <p className="text-[10px] text-muted-foreground">R$ 89/mês</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan("pro")}
                  className={`p-2 rounded-xl text-left border text-xs transition-all ${
                    selectedPlan === "pro"
                      ? "border-primary bg-primary/10 font-bold text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <p className="font-semibold text-foreground">Pro (Salão) ⭐</p>
                  <p className="text-[10px] text-muted-foreground">R$ 179/mês</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan("enterprise")}
                  className={`p-2 rounded-xl text-left border text-xs transition-all ${
                    selectedPlan === "enterprise"
                      ? "border-primary bg-primary/10 font-bold text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <p className="font-semibold text-foreground">Enterprise</p>
                  <p className="text-[10px] text-muted-foreground">R$ 299/mês</p>
                </button>
              </div>
            </div>

            {/* SEÇÃO 1: DADOS DO ESTABELECIMENTO */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                1. Dados do Estabelecimento
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="nomeLoja" className="text-xs font-semibold">
                    Nome Fantasia do Restaurante / Bar <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Store className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="nomeLoja"
                      type="text"
                      required
                      placeholder="Ex: Bar do Chefe, Hamburgueria Gourmet"
                      value={nomeLoja}
                      onChange={(e) => handleNomeLojaChange(e.target.value)}
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="codigoLojaReg" className="text-xs font-semibold">
                      Código da Loja <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      usado no login
                    </span>
                  </div>
                  <Input
                    id="codigoLojaReg"
                    type="text"
                    required
                    placeholder="Ex: BARDOCHEFE01"
                    value={codigoLoja}
                    onChange={(e) => setCodigoLoja(e.target.value.toUpperCase())}
                    className="font-mono uppercase text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cidadeReg" className="text-xs font-semibold">
                    Cidade / UF
                  </Label>
                  <Input
                    id="cidadeReg"
                    type="text"
                    placeholder="Ex: Brasília/DF"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="telefoneReg" className="text-xs font-semibold">
                    Telefone / WhatsApp Comercial
                  </Label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="telefoneReg"
                      type="tel"
                      placeholder="Ex: (61) 99876-5432"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: DADOS DO GESTOR DA CONTA */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <User className="size-3.5" />
                2. Conta do Gestor (Administrador)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="nomeGestorReg" className="text-xs font-semibold">
                    Nome Completo do Gestor <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nomeGestorReg"
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo Silva"
                    value={nomeGestor}
                    onChange={(e) => setNomeGestor(e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="usuarioGestorReg" className="text-xs font-semibold">
                    Nome de Usuário (Login) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="usuarioGestorReg"
                    type="text"
                    required
                    placeholder="Ex: carlos.gestor"
                    value={usuarioGestor}
                    onChange={(e) => setUsuarioGestor(e.target.value.toLowerCase())}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emailGestorReg" className="text-xs font-semibold">
                    E-mail Comercial <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="emailGestorReg"
                    type="email"
                    required
                    placeholder="Ex: carlos@bardochefe.com"
                    value={emailGestor}
                    onChange={(e) => setEmailGestor(e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="senhaGestorReg" className="text-xs font-semibold">
                    Senha de Acesso <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="senhaGestorReg"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={4}
                      placeholder="Mínimo 4 caracteres"
                      value={senhaGestor}
                      onChange={(e) => setSenhaGestor(e.target.value)}
                      className="pr-9 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmSenhaGestorReg" className="text-xs font-semibold">
                    Confirmar Senha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmSenhaGestorReg"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={4}
                    placeholder="Repita a senha"
                    value={confirmSenhaGestor}
                    onChange={(e) => setConfirmSenhaGestor(e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 sm:justify-between gap-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsRegisterOpen(false)}
              >
                Cancelar
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsRegisterOpen(false);
                    navigate({ to: "/login" });
                  }}
                >
                  Já tenho cadastro (Login)
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-xs gap-1.5"
                >
                  <Sparkles className="size-4 text-amber-300" />
                  {isSubmitting ? "Criando Estabelecimento..." : "Criar Minha Loja & Começar"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
