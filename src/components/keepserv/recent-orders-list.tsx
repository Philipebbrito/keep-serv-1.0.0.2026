import {
  AlertTriangle,
  Banknote,
  Bell,
  CheckCircle2,
  Clock,
  Clock3,
  Coins,
  Copy,
  CreditCard,
  Eye,
  Filter,
  Flame,
  History,
  Printer,
  QrCode,
  RotateCcw,
  Search,
  Sparkles,
  Table2,
  Users,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, useOrders } from "@/state";
import {
  elapsedLabel,
  orderTotal,
  PAYMENT_LABEL,
  STATUS_LABEL,
  urgencyFor,
  type Order,
  type OrderStatus,
  type PaymentMethod,
} from "@/domain";
import { cn } from "@/lib/utils";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function formatRelativeTime(timestamp: number, now: number): string {
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 45) return "Agora mesmo";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours}h ${diffMin % 60}m`;
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatExactTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(start: number, end: number): string {
  const diffMin = Math.max(1, Math.round((end - start) / 60000));
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface RecentOrdersListProps {
  onSelectOrder?: (order: Order) => void;
  onPrintReceipt?: (order: Order) => void;
  onPayOrder?: (order: Order) => void;
  className?: string;
}

export function RecentOrdersList({
  onSelectOrder,
  onPrintReceipt,
  onPayOrder,
  className,
}: RecentOrdersListProps) {
  const { orders, now } = useOrders();
  const { session } = useAuth();
  const waiterName = session?.name ?? "Garçom";

  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<"all" | PaymentMethod>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Todas as comandas ordenadas pelas atividades mais recentes
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const timeA = a.payment?.at ?? a.statusChangedAt ?? a.openedAt;
      const timeB = b.payment?.at ?? b.statusChangedAt ?? b.openedAt;
      return timeB - timeA;
    });
  }, [orders]);

  // Filtro por escopo: Minhas comandas vs Todo o Salão
  const scopedOrders = useMemo(() => {
    if (scope === "mine") {
      return sortedOrders.filter(
        (o) =>
          o.waiter.toLowerCase() === waiterName.toLowerCase() ||
          o.payment?.cashier?.toLowerCase() === waiterName.toLowerCase(),
      );
    }
    return sortedOrders;
  }, [sortedOrders, scope, waiterName]);

  // Lista única de mesas disponíveis nas comandas para o seletor
  const availableTables = useMemo(() => {
    const tableSet = new Set<number>();
    scopedOrders.forEach((o) => tableSet.add(o.table));
    return Array.from(tableSet).sort((a, b) => a - b);
  }, [scopedOrders]);

  // Contagem por status no escopo atual
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: scopedOrders.length,
      pendente: 0,
      preparo: 0,
      pronto: 0,
      entregue: 0,
      pago: 0,
    };
    scopedOrders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [scopedOrders]);

  // Aplica todos os filtros: Status, Número da Mesa, Método de Pagamento e Busca Textual
  const filteredOrders = useMemo(() => {
    return scopedOrders.filter((order) => {
      // 1. Filtro por Status
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // 2. Filtro por Número da Mesa
      if (tableFilter !== "all" && String(order.table) !== tableFilter) {
        return false;
      }

      // 3. Filtro por Método de Pagamento (aplicável se o pedido foi pago)
      if (methodFilter !== "all") {
        if (!order.payment || order.payment.method !== methodFilter) {
          return false;
        }
      }

      // 4. Busca Textual por Código, Mesa, Garçom ou Itens
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const codeMatch = order.code.toLowerCase().includes(term);
        const tableMatch = `mesa ${order.table}`.includes(term) || `${order.table}` === term;
        const waiterMatch = order.waiter.toLowerCase().includes(term);
        const cashierMatch = (order.payment?.cashier ?? "").toLowerCase().includes(term);
        const itemMatch = order.items.some((item) => item.name.toLowerCase().includes(term));
        return codeMatch || tableMatch || waiterMatch || cashierMatch || itemMatch;
      }

      return true;
    });
  }, [scopedOrders, statusFilter, tableFilter, methodFilter, searchTerm]);

  // Métricas agregadas do lote filtrado
  const stats = useMemo(() => {
    const totalAmount = filteredOrders.reduce(
      (acc, o) => acc + (o.payment?.amount ?? orderTotal(o)),
      0,
    );
    const totalTips = totalAmount * 0.1;
    const avgTicket = filteredOrders.length > 0 ? totalAmount / filteredOrders.length : 0;
    const totalGuests = filteredOrders.reduce((acc, o) => acc + o.guests, 0);

    return {
      totalAmount,
      totalTips,
      avgTicket,
      totalGuests,
      count: filteredOrders.length,
    };
  }, [filteredOrders]);

  // Verifica se algum filtro está ativo
  const hasActiveFilters =
    statusFilter !== "all" ||
    tableFilter !== "all" ||
    methodFilter !== "all" ||
    searchTerm.trim().length > 0;

  const handleResetFilters = () => {
    setStatusFilter("all");
    setTableFilter("all");
    setMethodFilter("all");
    setSearchTerm("");
    toast.info("Filtros resetados");
  };

  const handleCopyCode = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(
      `Comanda ${order.code} · Mesa ${order.table} · Status: ${STATUS_LABEL[order.status]} · Total ${brl(order.payment?.amount ?? orderTotal(order))}`,
    );
    toast.success(`Resumo da Comanda ${order.code} copiado!`);
  };

  return (
    <section
      id="recent-orders-list"
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-xs transition-all",
        className,
      )}
    >
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <History className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Histórico & Pedidos Recentes
              </h2>
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary text-xs font-semibold"
              >
                {filteredOrders.length} {filteredOrders.length === 1 ? "pedido" : "pedidos"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Filtre por Mesa, Status de atendimento e acompanhe timestamps em tempo real
            </p>
          </div>
        </div>

        {/* Alternador de Escopo: Minhas Comandas vs Todo o Salão */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setScope("mine")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              scope === "mine"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Minhas Comandas</span>
            <span className="rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] text-primary">
              {
                sortedOrders.filter(
                  (o) =>
                    o.waiter.toLowerCase() === waiterName.toLowerCase() ||
                    o.payment?.cashier?.toLowerCase() === waiterName.toLowerCase(),
                ).length
              }
            </span>
          </button>
          <button
            type="button"
            onClick={() => setScope("all")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              scope === "all"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Todo o Salão</span>
            <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
              {sortedOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* 🔍 BARRA DE FILTROS PRINCIPAL (STATUS & MESA & BUSCA) 🔍 */}
      <div className="mt-4 rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-3">
        {/* Linha 1: Filtro por Status (Tabs/Chips Dinâmicos com contadores) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
              <Filter className="size-3 text-primary" />
              Filtrar por Status:
            </span>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                onClick={handleResetFilters}
              >
                <RotateCcw className="size-3" />
                Limpar filtros
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Status: Todos */}
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                statusFilter === "all"
                  ? "bg-foreground text-background font-semibold shadow-xs"
                  : "bg-card text-muted-foreground border border-border hover:text-foreground",
              )}
            >
              <span>Todos</span>
              <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
                {statusCounts.all}
              </span>
            </button>

            {/* Status: Pendente */}
            <button
              type="button"
              onClick={() => setStatusFilter("pendente")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                statusFilter === "pendente"
                  ? "bg-amber-500 text-amber-950 font-semibold shadow-xs"
                  : "bg-card text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/10",
              )}
            >
              <Clock3 className="size-3" />
              <span>Pendente</span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px]">
                {statusCounts.pendente}
              </span>
            </button>

            {/* Status: Em Preparo */}
            <button
              type="button"
              onClick={() => setStatusFilter("preparo")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                statusFilter === "preparo"
                  ? "bg-orange-500 text-white font-semibold shadow-xs"
                  : "bg-card text-orange-700 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-500/10",
              )}
            >
              <Flame className="size-3" />
              <span>Em Preparo</span>
              <span className="rounded-full bg-orange-500/20 px-1.5 py-0.2 text-[10px]">
                {statusCounts.preparo}
              </span>
            </button>

            {/* Status: Pronto */}
            <button
              type="button"
              onClick={() => setStatusFilter("pronto")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                statusFilter === "pronto"
                  ? "bg-amber-600 text-white font-semibold shadow-xs"
                  : "bg-card text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/10",
              )}
            >
              <Bell className="size-3" />
              <span>Pronto</span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px]">
                {statusCounts.pronto}
              </span>
            </button>

            {/* Status: Entregue (Delivering / Delivered) */}
            <button
              type="button"
              onClick={() => setStatusFilter("entregue")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                statusFilter === "entregue"
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "bg-card text-blue-700 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/10",
              )}
            >
              <Utensils className="size-3" />
              <span>Entregue</span>
              <span className="rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[10px]">
                {statusCounts.entregue}
              </span>
            </button>

            {/* Status: Pago (Completed transactions) */}
            <button
              type="button"
              onClick={() => setStatusFilter("pago")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                statusFilter === "pago"
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "bg-card text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10",
              )}
            >
              <CheckCircle2 className="size-3" />
              <span>Pago</span>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px]">
                {statusCounts.pago}
              </span>
            </button>
          </div>
        </div>

        {/* Linha 2: Filtro por Mesa, Busca e Método de Pagamento */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Seletor Dropdown por Número da Mesa */}
            <div className="flex items-center gap-1.5 min-w-[150px]">
              <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Table2 className="size-3.5 text-muted-foreground" />
                Mesa:
              </span>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className="h-8 text-xs bg-card border-border w-[125px]">
                  <SelectValue placeholder="Todas as mesas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as mesas</SelectItem>
                  {availableTables.map((tbl) => (
                    <SelectItem key={tbl} value={String(tbl)}>
                      Mesa {tbl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chips Rápidos de Mesa se alguma mesa estiver selecionada */}
            {tableFilter !== "all" && (
              <Badge
                variant="secondary"
                className="h-7 gap-1 px-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
              >
                Mesa {tableFilter}
                <button
                  type="button"
                  onClick={() => setTableFilter("all")}
                  className="hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}

            {/* Campo de Busca Rápida */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar comanda ou prato..."
                className="h-8 pl-8 pr-7 text-xs bg-card"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Filtros por Método de Pagamento (opcional) */}
          {(statusFilter === "all" || statusFilter === "pago") && (
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-[11px] text-muted-foreground hidden lg:inline">Método:</span>
              {(["all", "pix", "credito", "debito", "dinheiro"] as const).map((method) => {
                const isSelected = methodFilter === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setMethodFilter(method)}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                      isSelected
                        ? "bg-foreground text-background font-semibold"
                        : "bg-card text-muted-foreground hover:bg-muted border border-border/70",
                    )}
                  >
                    {method === "pix" && <QrCode className="size-2.5" />}
                    {method === "credito" && <CreditCard className="size-2.5" />}
                    {method === "debito" && <CreditCard className="size-2.5" />}
                    {method === "dinheiro" && <Banknote className="size-2.5" />}
                    <span>{method === "all" ? "Todos" : PAYMENT_LABEL[method]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cartões com Métricas Rápidas do Lote Filtrado */}
      <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-muted/25 p-3">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Coins className="size-3 text-emerald-500" />
            {statusFilter === "pago" ? "Total Liquidado" : "Volume Financeiro"}
          </span>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">
            {brl(stats.totalAmount)}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {stats.count} {stats.count === 1 ? "comanda" : "comandas"} no filtro
          </span>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/25 p-3">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3 text-amber-500" /> Estimativa 10% (Gorjeta)
          </span>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {brl(stats.totalTips)}
          </p>
          <span className="text-[10px] text-muted-foreground">Repasse proporcional</span>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/25 p-3">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Wallet className="size-3 text-blue-500" /> Ticket Médio
          </span>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">
            {brl(stats.avgTicket)}
          </p>
          <span className="text-[10px] text-muted-foreground">Média por comanda</span>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/25 p-3">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Users className="size-3 text-purple-500" /> Pessoas Servidas
          </span>
          <p className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">
            {stats.totalGuests}
          </p>
          <span className="text-[10px] text-muted-foreground">Clientes atendidos</span>
        </div>
      </div>

      {/* Lista de Pedidos Recentes Filtrados */}
      <div className="mt-4 space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <History className="size-6" />
            </div>
            <p className="mt-3 text-sm font-semibold">
              Nenhum pedido encontrado com os filtros selecionados
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
              {hasActiveFilters
                ? "Tente ajustar o filtro de status, número da mesa ou termo de busca."
                : scope === "mine"
                  ? "Você ainda não possui comandas registradas no escopo deste turno."
                  : "Nenhuma comanda registrada no sistema até o momento."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-8 text-xs gap-1.5"
                onClick={handleResetFilters}
              >
                <RotateCcw className="size-3" />
                Limpar todos os filtros
              </Button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const payment = order.payment;
            const amount = payment?.amount ?? orderTotal(order);
            const tipEstimate = amount * 0.1;
            const completedAt = payment?.at ?? order.statusChangedAt ?? order.openedAt;
            const durationText = formatDuration(order.openedAt, completedAt);
            const isMyOrder = order.waiter.toLowerCase() === waiterName.toLowerCase();
            const urgency = urgencyFor(order, now);

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder?.(order)}
                className="group relative flex flex-col justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm sm:flex-row sm:items-center cursor-pointer"
              >
                {/* Lado Esquerdo: Identificação, Status & Timestamps */}
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Código da Comanda */}
                    <span className="font-display font-bold text-base tracking-tight text-foreground">
                      {order.code}
                    </span>

                    {/* Identificador da Mesa (clicar filtra pela mesa) */}
                    <Badge
                      variant="outline"
                      className="font-medium text-xs hover:border-primary cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTableFilter(String(order.table));
                      }}
                      title="Filtrar por esta mesa"
                    >
                      Mesa {order.table}
                    </Badge>

                    {/* 🟢 INDICADOR DE STATUS PRECISO 🟢 */}
                    {order.status === "pago" && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-semibold gap-1 py-0.5">
                        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                        Pago & Concluído
                      </Badge>
                    )}

                    {order.status === "entregue" && (
                      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[11px] font-semibold gap-1 py-0.5">
                        <Utensils className="size-3 text-blue-600" />
                        Entregue na mesa
                      </Badge>
                    )}

                    {order.status === "pronto" && (
                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[11px] font-semibold gap-1 py-0.5 animate-pulse">
                        <Bell className="size-3 text-amber-600" />
                        Pronto p/ servir
                      </Badge>
                    )}

                    {order.status === "preparo" && (
                      <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30 text-[11px] font-semibold gap-1 py-0.5">
                        <Flame className="size-3 text-orange-600 animate-pulse" />
                        Em preparo
                      </Badge>
                    )}

                    {order.status === "pendente" && (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px] font-semibold gap-1 py-0.5">
                        <Clock3 className="size-3 text-amber-600" />
                        Pendente
                      </Badge>
                    )}

                    {/* Alerta de SLA se aplicável para pedidos ativos */}
                    {order.status !== "pago" && urgency !== "ontime" && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] py-0 font-medium animate-pulse"
                      >
                        <AlertTriangle className="size-2.5 mr-1" />
                        {urgency === "late" ? "Atrasado" : "Atenção SLA"}
                      </Badge>
                    )}

                    {/* Forma de Pagamento quando houver */}
                    {payment?.method && (
                      <Badge
                        variant="secondary"
                        className="text-[11px] gap-1 font-normal text-muted-foreground py-0.5"
                      >
                        {payment.method === "pix" && <QrCode className="size-3 text-emerald-600" />}
                        {payment.method === "credito" && (
                          <CreditCard className="size-3 text-blue-600" />
                        )}
                        {payment.method === "debito" && (
                          <CreditCard className="size-3 text-amber-600" />
                        )}
                        {payment.method === "dinheiro" && (
                          <Banknote className="size-3 text-emerald-600" />
                        )}
                        <span>{PAYMENT_LABEL[payment.method]}</span>
                        {payment.splitCount > 1 && (
                          <span className="text-[10px] font-semibold text-foreground/80">
                            ({payment.splitCount}x)
                          </span>
                        )}
                      </Badge>
                    )}

                    {/* Tag de Atribuição */}
                    {isMyOrder && (
                      <Badge
                        variant="outline"
                        className="border-primary/40 bg-primary/10 text-primary text-[10px] py-0"
                      >
                        Sua comanda
                      </Badge>
                    )}
                  </div>

                  {/* ⏱️ TIMESTAMPS DETALHADOS ⏱️ */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {/* Horário e Tempo Relativo */}
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="size-3 text-primary" />
                      {formatExactTime(
                        order.status === "pago" ? completedAt : order.statusChangedAt,
                      )}
                    </span>

                    <span className="font-medium text-foreground/90">
                      (
                      {formatRelativeTime(
                        order.status === "pago" ? completedAt : order.statusChangedAt,
                        now,
                      )}
                      )
                    </span>

                    <span>·</span>

                    {/* Duração ou tempo de espera */}
                    {order.status === "pago" ? (
                      <span>
                        Duração: <strong className="text-foreground">{durationText}</strong>
                      </span>
                    ) : (
                      <span>
                        Espera na etapa:{" "}
                        <strong className="text-foreground">
                          {elapsedLabel(order.statusChangedAt, now)}
                        </strong>
                      </span>
                    )}

                    <span>·</span>

                    {/* Garçom responsável */}
                    <span>
                      Garçom: <span className="font-medium text-foreground">{order.waiter}</span>
                    </span>

                    {payment?.cashier && payment.cashier !== order.waiter && (
                      <span>
                        (cx: <span className="font-medium">{payment.cashier}</span>)
                      </span>
                    )}
                  </div>

                  {/* Resumo Discriminado dos Itens */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {order.items
                      .filter((i) => !i.canceled)
                      .slice(0, 3)
                      .map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          <span className="font-semibold text-foreground mr-1">{item.qty}x</span>
                          {item.name}
                        </span>
                      ))}
                    {order.items.filter((i) => !i.canceled).length > 3 && (
                      <span className="text-[10px] text-muted-foreground italic">
                        +{order.items.filter((i) => !i.canceled).length - 3} itens
                      </span>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Valores Financeiros e Ações Rápidas */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t border-border/60 sm:border-t-0 pt-2 sm:pt-0 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="block text-[11px] text-muted-foreground">
                      {order.status === "pago" ? "Valor Liquidado" : "Total da Conta"}
                    </span>
                    <span className="font-display text-lg font-bold tabular-nums text-foreground">
                      {brl(amount)}
                    </span>
                    <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      10%: {brl(tipEstimate)}
                    </span>
                  </div>

                  {/* Botões de Ação Rápida */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 gap-1 hover:border-primary/50"
                      onClick={() => onSelectOrder?.(order)}
                      title="Ver detalhes completos da comanda"
                    >
                      <Eye className="size-3 text-muted-foreground" />
                      <span className="hidden sm:inline">Detalhes</span>
                    </Button>

                    {order.status === "pago" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2 gap-1 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/40"
                        onClick={() => onPrintReceipt?.(order)}
                        title="Reimprimir comprovante / 2ª via da conta"
                      >
                        <Printer className="size-3" />
                        <span className="hidden sm:inline">2ª Via</span>
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                          onClick={() => onPrintReceipt?.(order)}
                          title="Imprimir conferência da conta"
                        >
                          <Printer className="size-3" />
                          <span className="hidden sm:inline">Conta</span>
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          className="h-7 text-xs px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          onClick={() => onPayOrder?.(order)}
                          title="Receber pagamento da mesa"
                        >
                          <Wallet className="size-3" />
                          <span className="hidden sm:inline">Receber</span>
                        </Button>
                      </>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => handleCopyCode(order, e)}
                      title="Copiar resumo da comanda"
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
