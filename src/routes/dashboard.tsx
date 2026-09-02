import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Clock3, Flame, Table2, TrendingUp } from "lucide-react";
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
import {
  AVG_TIME_BY_STATION,
  ORDERS_BY_HOUR,
  TABLES_TOTAL,
  TOP_PRODUCTS,
} from "@/lib/keepserv/mock-data";
import { useKeepServ } from "@/lib/keepserv/store";
import { orderTotal, STATUS_LABEL, urgencyFor } from "@/lib/keepserv/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard do gestor | Keep Serv" },
      {
        name: "description",
        content:
          "Indicadores do salão: mesas ocupadas, pedidos em atraso, tempo médio de atendimento e produtos mais vendidos do dia.",
      },
      { property: "og:title", content: "Dashboard do gestor | Keep Serv" },
      {
        property: "og:description",
        content: "Acompanhe ocupação, atrasos e ranking de pratos do seu restaurante.",
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
  const { orders, now } = useKeepServ();

  const active = orders.filter((o) => o.status !== "entregue");
  const occupiedTables = new Set(active.map((o) => o.table)).size;
  const late = active.filter((o) => urgencyFor(o, now) === "late").length;
  const revenue = orders.reduce((s, o) => s + orderTotal(o), 0);
  const avgMinutes = active.length
    ? Math.round(
        active.reduce((s, o) => s + (now - o.openedAt) / 60000, 0) / active.length,
      )
    : 0;

  const byStatus = (["pendente", "preparo", "pronto", "entregue"] as const).map((s) => ({
    status: STATUS_LABEL[s],
    total: orders.filter((o) => o.status === s).length,
  }));

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Dashboard do gestor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Serviço de hoje · atualizado em tempo real
        </p>
      </div>

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
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length] ?? "var(--chart-1)"} />
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
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-accent" />
          <h2 className="font-display text-lg font-semibold">Pedidos que exigem atenção</h2>
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
              </tr>
            </thead>
            <tbody>
              {active
                .filter((o) => urgencyFor(o, now) !== "ontime")
                .map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 font-medium">{o.code}</td>
                    <td className="py-2.5">Mesa {o.table}</td>
                    <td className="py-2.5 text-muted-foreground">{o.waiter}</td>
                    <td className="py-2.5">{STATUS_LABEL[o.status]}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">
                      {Math.floor((now - o.openedAt) / 60000)} min
                    </td>
                  </tr>
                ))}
              {active.filter((o) => urgencyFor(o, now) !== "ontime").length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Nenhum pedido fora do prazo. Operação em dia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
