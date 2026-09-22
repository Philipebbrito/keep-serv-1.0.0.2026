import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  CheckCheck,
  Clock3,
  Eye,
  Flame,
  HeartHandshake,
  LayoutDashboard,
  Printer,
  Sparkles,
  Table2,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wallet,
  Receipt,
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
import { BillsManagement } from "@/components/keepserv/bills-management";
import { CashFlowManager } from "@/components/keepserv/cash-flow-manager";
import { CustomerManagement } from "@/components/keepserv/customer-management";
import { MenuManagement } from "@/components/keepserv/menu-management";
import { StockManagement } from "@/components/keepserv/stock-management";
import { OrderDialog } from "@/components/keepserv/order-dialog";
import { PaymentDialog } from "@/components/keepserv/payment-dialog";
import { TeamManagement } from "@/components/keepserv/team-management";
import { WaiterDashboard } from "@/components/keepserv/waiter-dashboard";
import { TableManagementDialog } from "@/components/keepserv/table-management-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AVG_TIME_BY_STATION, ORDERS_BY_HOUR, TOP_PRODUCTS } from "@/data";
import { useAuth, useMenu, useOrders, useStock } from "@/state";
import { orderTotal, STATUS_LABEL, urgencyFor, type Order } from "@/domain";

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
  const { orders, tables, activeTables, now, requestCleanup, completeCleanup, printBill } =
    useOrders();
  const { session, users } = useAuth();
  const { products } = useMenu();
  const { stockItems } = useStock();
  const isWaiter = session?.role === "garcom";
  const [managerView, setManagerView] = useState<"gestor" | "garcom">(
    isWaiter ? "garcom" : "gestor",
  );
  const [tableManagerOpen, setTableManagerOpen] = useState(false);
  const routerLocation = useRouterState({ select: (s) => s.location });
  const navigate = useNavigate();

  const tabParam = ((routerLocation?.search as Record<string, unknown>)?.tab as string) || "";
  const validTabs = [
    "fluxo_caixa",
    "contas_pagar_receber",
    "clientes_crm",
    "operacao",
    "cardapio",
    "estoque",
    "equipe",
  ] as const;
  type GestorTab = (typeof validTabs)[number];

  const gestorTab: GestorTab = validTabs.includes(tabParam as GestorTab)
    ? (tabParam as GestorTab)
    : "operacao";

  const changeGestorTab = (tab: GestorTab) => {
    navigate({
      to: "/dashboard",
      search: { tab },
    });
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

  const sectionMeta: Record<
    GestorTab,
    { title: string; desc: string; icon: typeof LayoutDashboard }
  > = {
    operacao: {
      title: "Operação do Salão",
      desc: "Acompanhamento em tempo real de ocupação de mesas, pedidos, atrasos e tempos de preparo.",
      icon: LayoutDashboard,
    },
    cardapio: {
      title: "Cardápio & Itens",
      desc: "Gestão completa de itens, fotos, precificação, categorias e disponibilidade.",
      icon: UtensilsCrossed,
    },
    estoque: {
      title: "Estoque & Insumos",
      desc: "Controle de insumos, unidades de medida, reposição e alertas de nível mínimo.",
      icon: Boxes,
    },
    fluxo_caixa: {
      title: "Fluxo de Caixa",
      desc: "Histórico financeiro detalhado, entradas, sangrias, suprimentos e fechamento de turno.",
      icon: Wallet,
    },
    contas_pagar_receber: {
      title: "Contas a Pagar & Receber",
      desc: "Agendamento de fornecedores, boletos bancários, custos fixos e conciliação bancária.",
      icon: Receipt,
    },
    clientes_crm: {
      title: "Clientes & Histórico (CRM)",
      desc: "Cadastro de clientes, frequência de visitas, ticket médio individual, aniversários e preferências de consumo.",
      icon: HeartHandshake,
    },
    equipe: {
      title: "Minha Equipe",
      desc: "Gestão de colaboradores, garçons, caixas e redefinição de senhas operacionais.",
      icon: Users,
    },
  };

  const currentMeta = sectionMeta[gestorTab] || sectionMeta.operacao;
  const CurrentSectionIcon = currentMeta.icon;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 space-y-6">
      {/* Cabeçalho do Painel de Controle / Seção Ativa (Sem badges adicionais no painel) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <CurrentSectionIcon className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {currentMeta.title}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{currentMeta.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs h-9 shadow-2xs border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => setTableManagerOpen(true)}
            title="Alterar quantidade de mesas ou pausar/reativar mesas na operação"
          >
            <Table2 className="size-4" />
            <span>
              Gerenciar Mesas ({activeTables.length}/{tables.length})
            </span>
          </Button>

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
      </div>

      {/* Conteúdo da Seção Ativa */}
      {gestorTab === "cardapio" ? (
        <MenuManagement />
      ) : gestorTab === "estoque" ? (
        <StockManagement />
      ) : gestorTab === "equipe" ? (
        <TeamManagement />
      ) : gestorTab === "fluxo_caixa" ? (
        <CashFlowManager />
      ) : gestorTab === "contas_pagar_receber" ? (
        <BillsManagement />
      ) : gestorTab === "clientes_crm" ? (
        <CustomerManagement />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              icon={Table2}
              label="Mesas ocupadas"
              value={`${occupiedTables}/${activeTables.length}`}
              hint={`${Math.round((occupiedTables / Math.max(1, activeTables.length)) * 100)}% de ocupação (${tables.length} cadastradas)`}
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
                <h2 className="font-display text-lg font-semibold">Pedidos que exigem atenção</h2>
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
      <TableManagementDialog open={tableManagerOpen} onOpenChange={setTableManagerOpen} />
    </div>
  );
}
