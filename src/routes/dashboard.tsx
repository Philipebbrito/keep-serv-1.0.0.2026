import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  CheckCheck,
  Clock3,
  Eye,
  Flame,
  LayoutDashboard,
  Printer,
  Sparkles,
  Table2,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wallet,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { AppShell } from "@/components/keepserv/app-shell";
import { BillPrintDialog } from "@/components/keepserv/bill-print-dialog";
import { CashFlowManager } from "@/components/keepserv/cash-flow-manager";
import { MenuManagement } from "@/components/keepserv/menu-management";
import { StockManagement } from "@/components/keepserv/stock-management";
import { OrderDialog } from "@/components/keepserv/order-dialog";
import { PaymentDialog } from "@/components/keepserv/payment-dialog";
import { TeamManagement } from "@/components/keepserv/team-management";
import { WaiterDashboard } from "@/components/keepserv/waiter-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AVG_TIME_BY_STATION,
  ORDERS_BY_HOUR,
  TABLES_TOTAL,
  TOP_PRODUCTS,
} from "@/lib/keepserv/mock-data";
import { useKeepServ } from "@/lib/keepserv/store";
import { orderTotal, STATUS_LABEL, urgencyFor, type Order } from "@/lib/keepserv/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard operacional | Keep Serv" },
      {
        name: "description",
        content:
          "Indicadores do salão e garçom: mesas ocupadas, pedidos prontos, vendas do turno e tempo de atendimento.",
      },
      { property: "og:title", content: "Dashboard operacional | Keep Serv" },
      {
        property: "og:description",
        content: "Acompanhe ocupação, atrasos, vendas e pratos prontos do seu restaurante.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <DashboardPage />
    </AppShell>
  ),
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",
];

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof Table2;
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "late" | "ontime";
}) {
  const toneClass =
    tone === "late"
      ? "border-l-late text-late-foreground"
      : tone === "ontime"
        ? "border-l-ontime text-ontime-foreground"
        : "border-l-primary text-foreground";
  return (
    <div className={`card-elevated border-l-4 p-5 ${toneClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="font-display mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-elevated p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function DashboardPage() {
  const {
    orders,
    now,
    session,
    users,
    products,
    stockItems,
    requestCleanup,
    completeCleanup,
    printBill,
  } = useKeepServ();
  const isWaiter = session?.role === "garcom";
  const [managerView, setManagerView] = useState<"gestor" | "garcom">(
    isWaiter ? "garcom" : "gestor",
  );
  const [gestorTab, setGestorTab] = useState<
    "fluxo_caixa" | "operacao" | "cardapio" | "estoque" | "equipe"
  >(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const tab = p.get("tab");
      if (tab && ["fluxo_caixa", "operacao", "cardapio", "estoque", "equipe"].includes(tab)) {
        return tab as "fluxo_caixa" | "operacao" | "cardapio" | "estoque" | "equipe";
      }
    }
    return "operacao";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePop = () => {
      const p = new URLSearchParams(window.location.search);
      const tab = p.get("tab");
      if (tab && ["fluxo_caixa", "operacao", "cardapio", "estoque", "equipe"].includes(tab)) {
        setGestorTab(tab as "fluxo_caixa" | "operacao" | "cardapio" | "estoque" | "equipe");
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const changeGestorTab = (tab: "fluxo_caixa" | "operacao" | "cardapio" | "estoque" | "equipe") => {
    setGestorTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [payOrder, setPayOrder] = useState<Order | null>(null);

  const lowStockAlertCount = stockItems.filter((s) => s.currentStock <= s.minStock).length;

  // Se o usuário logado for perfil garçom, ou se o gestor selecionou a visão do garçom
  if (isWaiter || managerView === "garcom") {
    return (
      <div>
        {!isWaiter && (
          <div className="mx-auto w-full max-w-[1600px] px-4 pt-4 sm:px-6 flex items-center justify-between border-b border-border pb-3 mb-2">
            <span className="text-xs text-muted-foreground">
              Você está visualizando o <strong>Dashboard do Garçom</strong> em modo gestor.
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5"
              onClick={() => setManagerView("gestor")}
            >
              ← Voltar ao Dashboard do Gestor
            </Button>
          </div>
        )}
        <WaiterDashboard />
      </div>
    );
  }

  const active = orders.filter((o) => o.status !== "entregue" && o.status !== "pago");
  const occupiedTables = new Set(active.map((o) => o.table)).size;
  const late = active.filter((o) => urgencyFor(o, now) === "late").length;
  const revenue = orders.reduce((s, o) => s + orderTotal(o), 0);
  const avgMinutes = active.length
    ? Math.round(active.reduce((s, o) => s + (now - o.openedAt) / 60000, 0) / active.length)
    : 0;

  const byStatus = (["pendente", "preparo", "pronto", "entregue"] as const).map((s) => ({
    status: STATUS_LABEL[s],
    total: orders.filter((o) => o.status === s).length,
  }));

  const sections = [
    {
      id: "operacao" as const,
      label: "Operação do Salão",
      desc: "Mesas, pedidos e tempos",
      icon: LayoutDashboard,
      badge: `${occupiedTables} mesas`,
      badgeAlert: false,
    },
    {
      id: "cardapio" as const,
      label: "Cardápio & Itens",
      desc: "Produtos, fotos e valores",
      icon: UtensilsCrossed,
      badge: `${products.length} itens`,
      badgeAlert: false,
    },
    {
      id: "estoque" as const,
      label: "Estoque & Insumos",
      desc: "Inventário e reposição",
      icon: Boxes,
      badge: lowStockAlertCount > 0 ? `${lowStockAlertCount} baixo` : `${stockItems.length} itens`,
      badgeAlert: lowStockAlertCount > 0,
    },
    {
      id: "fluxo_caixa" as const,
      label: "Fluxo de Caixa",
      desc: "Histórico, entradas e sangrias",
      icon: Wallet,
      badge: "Ao vivo",
      badgeAlert: false,
    },
    ...(session?.nivel === "dono_loja" || session?.nivel === "dev" || session?.role === "gestor"
      ? [
          {
            id: "equipe" as const,
            label: "Minha Equipe",
            desc: "Colaboradores e senhas",
            icon: Users,
            badge: `${users.length} membros`,
            badgeAlert: false,
          },
        ]
      : []),
  ];

  const currentSection = sections.find((s) => s.id === gestorTab) || sections[0];
  const CurrentSectionIcon = currentSection.icon;

  return (
    <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 space-y-6">
      {/* Cabeçalho da Gestão */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Painel de Controle
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-0.5">
            Gestão do Restaurante
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            Acompanhamento operacional, cardápio, estoque, finanças e equipe em tempo real.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs h-9 shadow-2xs"
          onClick={() => setManagerView("garcom")}
        >
          <UserCheck className="size-4 text-primary" />
          <span>Visão do Garçom</span>
        </Button>
      </div>

      {/* Navegação Mobile / Telas Pequenas (< lg) */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => changeGestorTab(sec.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all border",
                gestorTab === sec.id
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:text-foreground",
              )}
            >
              <sec.icon className="size-3.5" />
              <span>{sec.label}</span>
              {sec.badge && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                    gestorTab === sec.id
                      ? "bg-primary-foreground/25 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {sec.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Principal com Menu Lateral de Seções na Esquerda */}
      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] xl:grid-cols-[290px_1fr] gap-6 items-start">
        {/* ======================================================== */}
        {/* MENU DE SEÇÕES NA LATERAL ESQUERDA DA PÁGINA (DESKTOP)   */}
        {/* ======================================================== */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-20">
          <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs space-y-1">
            <div className="px-2.5 py-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Módulos de Gestão
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {sections.length} seções
              </span>
            </div>

            {/* Lista Vertical de Seções */}
            <nav className="space-y-1 pt-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => changeGestorTab(sec.id)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl p-2.5 text-left text-xs font-medium transition-all",
                    gestorTab === sec.id
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      gestorTab === sec.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80",
                    )}
                  >
                    <sec.icon className="size-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate leading-snug">{sec.label}</span>
                      {sec.badge && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums shrink-0",
                            gestorTab === sec.id
                              ? "bg-primary-foreground/25 text-primary-foreground"
                              : sec.badgeAlert
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {sec.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-[10px] truncate mt-0.5",
                        gestorTab === sec.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground/80",
                      )}
                    >
                      {sec.desc}
                    </p>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Card de Resumo Rápido no Menu Lateral */}
          <div className="rounded-2xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold">
              <span>Resumo do Salão</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">● Ao vivo</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="rounded-xl border border-border/60 bg-background/80 p-2 text-center">
                <span className="text-[10px] text-muted-foreground block">Mesas</span>
                <span className="font-display text-base font-bold text-foreground">
                  {occupiedTables}/{TABLES_TOTAL}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/80 p-2 text-center">
                <span className="text-[10px] text-muted-foreground block">Atrasos</span>
                <span
                  className={cn(
                    "font-display text-base font-bold",
                    late > 0 ? "text-rose-500" : "text-emerald-500",
                  )}
                >
                  {late}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 p-2 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Faturamento turno</span>
              <span className="font-semibold text-foreground font-mono">
                R$ {revenue.toFixed(0)}
              </span>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* CONTEÚDO PRINCIPAL DA SEÇÃO SELECIONADA                  */}
        {/* ======================================================== */}
        <main className="min-w-0 space-y-6">
          {/* Header Contextual da Seção Ativa */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CurrentSectionIcon className="size-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">
                  {currentSection.label}
                </h2>
                <p className="text-xs text-muted-foreground">{currentSection.desc}</p>
              </div>
            </div>
            {currentSection.badge && (
              <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
                {currentSection.badge}
              </Badge>
            )}
          </div>

          {gestorTab === "cardapio" ? (
            <MenuManagement />
          ) : gestorTab === "estoque" ? (
            <StockManagement />
          ) : gestorTab === "equipe" ? (
            <TeamManagement />
          ) : gestorTab === "fluxo_caixa" ? (
            <CashFlowManager />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi
                  icon={Table2}
                  label="Mesas ocupadas"
                  value={`${occupiedTables}/${TABLES_TOTAL}`}
                  hint={`${Math.round((occupiedTables / TABLES_TOTAL) * 100)}% de ocupação do salão`}
                />
                <Kpi
                  icon={AlertTriangle}
                  label="Pedidos em atraso"
                  value={String(late)}
                  hint="Acima do tempo limite da etapa"
                  tone={late > 0 ? "late" : "ontime"}
                />
                <Kpi
                  icon={Clock3}
                  label="Tempo médio de atendimento"
                  value={`${avgMinutes} min`}
                  hint="Da abertura até a etapa atual"
                />
                <Kpi
                  icon={TrendingUp}
                  label="Faturamento em aberto"
                  value={`R$ ${revenue.toFixed(0)}`}
                  hint={`${orders.length} comandas no turno`}
                  tone="ontime"
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title="Pedidos por hora" subtitle="Picos de almoço e jantar">
                  <AreaChart data={ORDERS_BY_HOUR} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="ks-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="pedidos"
                      stroke="var(--chart-1)"
                      strokeWidth={2.5}
                      fill="url(#ks-area)"
                    />
                  </AreaChart>
                </ChartCard>

                <ChartCard title="Produtos mais vendidos" subtitle="Top itens do dia">
                  <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ left: 40, right: 16 }}>
                    <CartesianGrid stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="produto"
                      width={140}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="vendas" radius={[0, 6, 6, 0]}>
                      {TOP_PRODUCTS.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length] ?? "var(--chart-1)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartCard>

                <ChartCard title="Tempo médio por etapa" subtitle="Onde o pedido mais espera">
                  <BarChart data={AVG_TIME_BY_STATION} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="etapa" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} unit="m" />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="minutos" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartCard>

                <ChartCard title="Fila atual por etapa" subtitle="Distribuição do quadro agora">
                  <BarChart data={byStatus} margin={{ left: -20, right: 8 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="total" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartCard>
              </div>

              <div className="card-elevated mt-6 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="size-4 text-accent" />
                    <h2 className="font-display text-lg font-semibold">
                      Pedidos que exigem atenção
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Ações rápidas disponíveis diretamente nas comandas
                  </span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs tracking-wider text-muted-foreground uppercase">
                        <th className="pb-2">Pedido</th>
                        <th className="pb-2">Mesa</th>
                        <th className="pb-2">Garçom</th>
                        <th className="pb-2">Etapa</th>
                        <th className="pb-2 text-right">Espera</th>
                        <th className="pb-2 text-right">Ações Rápidas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active
                        .filter((o) => urgencyFor(o, now) !== "ontime")
                        .map((o) => (
                          <tr key={o.id} className="border-b border-border/60 last:border-0">
                            <td className="py-2.5 font-medium">{o.code}</td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-1.5">
                                <span>Mesa {o.table}</span>
                                {o.billPrinted && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] py-0 px-1 border-blue-500/30 text-blue-600 dark:text-blue-400"
                                  >
                                    Conta
                                  </Badge>
                                )}
                                {o.cleanupRequested && (
                                  <Badge className="text-[9px] py-0 px-1 bg-amber-500 text-amber-950 font-semibold">
                                    Limpeza
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 text-muted-foreground">{o.waiter}</td>
                            <td className="py-2.5">{STATUS_LABEL[o.status]}</td>
                            <td className="py-2.5 text-right font-semibold tabular-nums">
                              {Math.floor((now - o.openedAt) / 60000)} min
                            </td>
                            <td className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2 gap-1"
                                  onClick={() => setPrintOrder(o)}
                                  title="Imprimir pré-conta"
                                >
                                  <Printer className="size-3 text-blue-600" />
                                  Imprimir
                                </Button>

                                {o.cleanupRequested ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs px-2 gap-1 border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    onClick={() => {
                                      completeCleanup(o.id);
                                      toast.success(`Mesa ${o.table}: Limpeza concluída!`);
                                    }}
                                    title="Concluir limpeza"
                                  >
                                    <CheckCheck className="size-3 text-emerald-600" />
                                    Limpeza OK
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs px-2 gap-1"
                                    onClick={() => {
                                      requestCleanup(o.id);
                                      toast.success(`Mesa ${o.table}: Limpeza solicitada!`);
                                    }}
                                    title="Solicitar limpeza da mesa"
                                  >
                                    <Sparkles className="size-3 text-amber-500" />
                                    Pedir Limpeza
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setSelectedOrder(o)}
                                  title="Ver detalhes da comanda"
                                >
                                  <Eye className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {active.filter((o) => urgencyFor(o, now) !== "ontime").length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted-foreground">
                            Nenhum pedido fora do prazo. Operação em dia.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Diálogos integrados do Gestor */}
      <BillPrintDialog
        order={printOrder}
        onClose={() => setPrintOrder(null)}
        onPay={(o) => {
          setPrintOrder(null);
          setPayOrder(o);
        }}
      />
      <OrderDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onPay={(o) => {
          setSelectedOrder(null);
          setPayOrder(o);
        }}
      />
      <PaymentDialog order={payOrder} onClose={() => setPayOrder(null)} />
    </div>
  );
}
