import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  HandPlatter,
  LayoutDashboard,
  Phone,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Search,
  Sparkles,
  Table2,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BillPrintDialog } from "@/components/keepserv/bill-print-dialog";
import { FixedTableQRDialog } from "@/components/keepserv/fixed-table-qr-dialog";
import { NewOrderDialog } from "@/components/keepserv/new-order-dialog";
import { OrderDialog } from "@/components/keepserv/order-dialog";
import { PaymentDialog } from "@/components/keepserv/payment-dialog";
import { QRCodeModal } from "@/components/keepserv/qr-code-modal";
import { RecentOrdersList } from "@/components/keepserv/recent-orders-list";
import { TableManagementDialog } from "@/components/keepserv/table-management-dialog";
import { useAuth, useOrders } from "@/state";
import {
  elapsedLabel,
  orderTotal,
  PAYMENT_LABEL,
  STATUS_LABEL,
  urgencyFor,
  type Order,
} from "@/domain";
import { cn } from "@/lib/utils";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function WaiterDashboard() {
  const { orders, tables, activeTables, now, moveTo, requestCleanup, completeCleanup, printBill } =
    useOrders();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [tableManagerOpen, setTableManagerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [qrOrder, setQrOrder] = useState<Order | null>(null);
  const [fixedQrOpen, setFixedQrOpen] = useState(false);
  const [tableFilter, setTableFilter] = useState<"mine" | "all" | "ready" | "bill" | "cleanup">(
    "mine",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const waiterName = session?.name ?? "Garçom";

  // Pedidos prontos para entrega (alerta prioritário)
  const readyOrders = useMemo(() => {
    return orders.filter((o) => o.status === "pronto");
  }, [orders]);

  const myReadyOrders = useMemo(() => {
    return readyOrders.filter((o) => o.waiter.toLowerCase() === waiterName.toLowerCase());
  }, [readyOrders, waiterName]);

  // Mesas abertas (não pagas)
  const openOrders = useMemo(() => {
    return orders.filter((o) => o.status !== "pago");
  }, [orders]);

  const myOpenOrders = useMemo(() => {
    return openOrders.filter((o) => o.waiter.toLowerCase() === waiterName.toLowerCase());
  }, [openOrders, waiterName]);

  // Contagem de mesas distintas abertas
  const distinctOpenTables = useMemo(() => {
    return new Set(openOrders.map((o) => o.table)).size;
  }, [openOrders]);

  const myDistinctOpenTables = useMemo(() => {
    return new Set(myOpenOrders.map((o) => o.table)).size;
  }, [myOpenOrders]);

  // Vendas do turno
  const paidOrders = useMemo(() => {
    return orders.filter((o) => o.status === "pago");
  }, [orders]);

  const myPaidOrders = useMemo(() => {
    return paidOrders.filter(
      (o) =>
        o.waiter.toLowerCase() === waiterName.toLowerCase() ||
        o.payment?.cashier?.toLowerCase() === waiterName.toLowerCase(),
    );
  }, [paidOrders, waiterName]);

  // Total vendido pelo garçom (em aberto + fechado)
  const myTotalSales = useMemo(() => {
    const allMyOrders = orders.filter((o) => o.waiter.toLowerCase() === waiterName.toLowerCase());
    return allMyOrders.reduce((acc, o) => acc + orderTotal(o), 0);
  }, [orders, waiterName]);

  // Total já recebido/pago das comandas do garçom
  const myCollectedSales = useMemo(() => {
    return myPaidOrders.reduce((acc, o) => acc + (o.payment?.amount ?? orderTotal(o)), 0);
  }, [myPaidOrders]);

  // Total geral de vendas do turno no restaurante
  const shiftTotalSales = useMemo(() => {
    return orders.reduce((acc, o) => acc + orderTotal(o), 0);
  }, [orders]);

  // Estimativa de taxa de serviço (10% de gorjeta) do garçom
  const estimatedTips = useMemo(() => {
    return myTotalSales * 0.1;
  }, [myTotalSales]);

  // Ticket médio do garçom
  const myTicketAvg = useMemo(() => {
    const count = orders.filter((o) => o.waiter.toLowerCase() === waiterName.toLowerCase()).length;
    return count > 0 ? myTotalSales / count : 0;
  }, [orders, waiterName, myTotalSales]);

  // Mesas com solicitação de limpeza
  const cleanupOrders = useMemo(() => {
    return openOrders.filter((o) => o.cleanupRequested);
  }, [openOrders]);

  // Mesas com conta impressa
  const printedOrders = useMemo(() => {
    return openOrders.filter((o) => o.billPrinted);
  }, [openOrders]);

  // Filtragem de comandas exibidas na seção de mesas
  const displayedOrders = useMemo(() => {
    let list: Order[];
    switch (tableFilter) {
      case "mine":
        list = myOpenOrders;
        break;
      case "ready":
        list = openOrders.filter((o) => o.status === "pronto");
        break;
      case "bill":
        list = openOrders.filter((o) => o.status === "entregue" || o.billPrinted);
        break;
      case "cleanup":
        list = cleanupOrders;
        break;
      case "all":
      default:
        list = openOrders;
        break;
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((o) => {
      return (
        String(o.table).includes(q) ||
        o.code.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        o.waiter.toLowerCase().includes(q)
      );
    });
  }, [tableFilter, myOpenOrders, openOrders, cleanupOrders, searchQuery]);

  // Handlers para Ações Rápidas
  const handleQuickPrint = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    printBill(order.id);
    toast.success(`Pré-conta da Mesa ${order.table} enviada para a impressora!`, {
      description: `Comanda ${order.code} · Total ${brl(orderTotal(order))}`,
    });
  };

  const handleToggleCleanup = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (order.cleanupRequested) {
      completeCleanup(order.id);
      toast.success(`Mesa ${order.table}: Higienização finalizada!`, {
        description: "Mesa limpa e pronta para novos clientes.",
      });
    } else {
      requestCleanup(order.id);
      toast.success(`Mesa ${order.table}: Solicitação de limpeza registrada!`, {
        description: "Equipe de salão foi notificada para higienizar a mesa.",
      });
    }
  };

  // Handler rápido para marcar como entregue
  const handleDeliver = (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    moveTo(orderId, "entregue");
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">
      {/* Header do Dashboard do Garçom */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold">Dashboard do Garçom</h1>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tempo Real
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Olá, <strong className="text-foreground">{waiterName}</strong>. Acompanhe suas mesas,
            vendas do turno e pedidos prontos na praça da cozinha.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/dashboard", search: { tab: "operacao" } })}
            className="gap-2 shadow-xs text-xs border-primary/30 hover:bg-primary/5 text-primary"
            title="Ir para a página de Operação Geral do Salão"
          >
            <LayoutDashboard className="size-4" />
            <span>Operação do Salão</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setTableManagerOpen(true)}
            className="gap-2 shadow-xs text-xs border-primary/30 hover:bg-primary/5 text-primary font-medium"
            title="Ajustar quantidade de mesas ou pausar/reativar mesas na operação"
          >
            <Table2 className="size-4" />
            <span>
              Gerenciar Mesas ({activeTables.length}/{tables.length})
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setFixedQrOpen(true)}
            className="gap-2 shadow-xs text-xs"
          >
            <QrCode className="size-4" />
            QR das Mesas
          </Button>
          <Button onClick={() => setNewOrderOpen(true)} className="gap-2 shadow-xs">
            <Plus className="size-4" />
            Novo pedido
          </Button>
        </div>
      </div>

      {/* 🚨 Seção de Notificações de Pedidos Prontos para Entrega */}
      <section className="mb-8">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl",
                  readyOrders.length > 0
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Bell className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">
                    Notificações: Pedidos Prontos para Entrega
                  </h2>
                  {readyOrders.length > 0 ? (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-amber-950 dark:text-amber-100 font-semibold text-xs px-2">
                      {readyOrders.length} aguardando retirada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">
                      Tudo entregue
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avisos diretos da cozinha quando a praça finaliza o preparo dos pratos
                </p>
              </div>
            </div>

            {myReadyOrders.length > 0 && (
              <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                ★ {myReadyOrders.length} pedido(s) das suas mesas!
              </span>
            )}
          </div>

          {readyOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                <CheckCircle2 className="size-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Nenhum prato aguardando retirada na cozinha
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assim que a cozinha concluir o preparo de uma comanda, ela aparecerá aqui em tempo
                real com som e aviso.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {readyOrders.map((order) => {
                const isMine = order.waiter.toLowerCase() === waiterName.toLowerCase();
                const readyMinutesAgo = Math.floor((now - order.statusChangedAt) / 60000);
                const isOverdue = readyMinutesAgo >= 3;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md",
                      isMine
                        ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                        : "border-border bg-surface/50",
                      isOverdue && "border-rose-500/50 bg-rose-500/5 dark:bg-rose-500/10",
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-background font-display font-bold text-base shadow-2xs border border-border">
                            {order.table}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-foreground">Mesa {order.table}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.code} · {order.guests} pessoas
                            </p>
                          </div>
                        </div>

                        {isMine ? (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 font-medium">
                            Sua mesa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            {order.waiter}
                          </Badge>
                        )}
                      </div>

                      {/* Itens do pedido */}
                      <div className="mt-3 rounded-lg border border-border/60 bg-background/60 p-2 text-xs">
                        <p className="text-[11px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <Utensils className="size-3" /> Pratos para servir:
                        </p>
                        <ul className="space-y-1">
                          {order.items
                            .filter((i) => !i.canceled)
                            .map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between text-foreground"
                              >
                                <span className="truncate pr-2 font-medium">
                                  {item.qty}× {item.name}
                                </span>
                                {item.note && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 italic shrink-0">
                                    ({item.note})
                                  </span>
                                )}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className={cn("size-3.5", isOverdue && "text-rose-500")} />
                        <span className={cn(isOverdue && "font-bold text-rose-600")}>
                          Pronto há {readyMinutesAgo} min
                        </span>
                      </div>

                      <Button
                        size="sm"
                        className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                        onClick={(e) => handleDeliver(order.id, e)}
                      >
                        <HandPlatter className="size-3.5" />
                        Entregar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 📊 Seção de Métricas & KPIs em Tempo Real */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Mesas Abertas */}
        <div className="card-elevated border-l-4 border-l-primary p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Mesas Abertas (Atendimento)
            </p>
            <Table2 className="size-4 text-muted-foreground" />
          </div>
          <p className="font-display mt-2 text-3xl font-semibold tabular-nums">
            {myDistinctOpenTables}{" "}
            <span className="text-sm font-normal text-muted-foreground">suas</span>
            <span className="text-muted-foreground/50 mx-1.5 font-light">/</span>
            <span className="text-xl font-normal text-muted-foreground">
              {distinctOpenTables} total
            </span>
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {distinctOpenTables} de {activeTables.length} mesas ativas ocupadas (
              {Math.round((distinctOpenTables / Math.max(1, activeTables.length)) * 100)}%)
            </span>
            <button
              type="button"
              onClick={() => setTableManagerOpen(true)}
              className="text-primary hover:underline text-[11px] font-medium"
            >
              Configurar mesas
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-wrap items-center gap-1.5">
            {cleanupOrders.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] gap-1 px-2 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                onClick={() => setTableFilter("cleanup")}
                title="Filtrar mesas com limpeza solicitada"
              >
                <Sparkles className="size-3 text-amber-500" />
                {cleanupOrders.length} limpeza{cleanupOrders.length > 1 ? "s" : ""}
              </Button>
            ) : (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-500" />
                Salão higienizado
              </span>
            )}
            {printedOrders.length > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] h-6 px-1.5 border-blue-500/40 text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-blue-500/10"
                onClick={() => setTableFilter("bill")}
                title="Filtrar mesas com pré-conta impressa"
              >
                <Printer className="size-2.5 mr-1" />
                {printedOrders.length} conta{printedOrders.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* KPI 2: Vendas do Turno */}
        <div className="card-elevated border-l-4 border-l-emerald-500 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Vendas do Turno (Suas Mesas)
            </p>
            <TrendingUp className="size-4 text-emerald-600" />
          </div>
          <p className="font-display mt-2 text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {brl(myTotalSales)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
            <span>Já recebido: {brl(myCollectedSales)}</span>
            <span className="font-medium text-foreground">Turno geral: {brl(shiftTotalSales)}</span>
          </p>
        </div>

        {/* KPI 3: Estimativa de Gorjetas (10%) */}
        <div className="card-elevated border-l-4 border-l-amber-500 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Gorjetas Estimadas (10%)
            </p>
            <Sparkles className="size-4 text-amber-500" />
          </div>
          <p className="font-display mt-2 text-3xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {brl(estimatedTips)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Taxa de serviço acumulada no turno para sua equipe
          </p>
        </div>

        {/* KPI 4: Ticket Médio & Contagem */}
        <div className="card-elevated border-l-4 border-l-blue-500 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Ticket Médio por Mesa
            </p>
            <Receipt className="size-4 text-blue-500" />
          </div>
          <p className="font-display mt-2 text-3xl font-semibold tabular-nums">
            {brl(myTicketAvg)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {myOpenOrders.length} comanda(s) em aberto sob seu cuidado
          </p>
        </div>
      </div>

      {/* 📋 Seção de Gerenciamento das Mesas em Tempo Real */}
      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Resumo de Mesas em Atendimento</h2>
            <p className="text-xs text-muted-foreground">
              Acompanhe o consumo acumulado, tempo de mesa e feche contas com um clique
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Campo de busca rápida por Mesa ou Nome do Cliente */}
            <div className="relative w-full sm:w-60">
              <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Buscar mesa ou cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs rounded-xl bg-card border-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground font-semibold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
              <Button
                variant={tableFilter === "mine" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setTableFilter("mine")}
              >
                Minhas mesas ({myOpenOrders.length})
              </Button>
              <Button
                variant={tableFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setTableFilter("all")}
              >
                Todas ({openOrders.length})
              </Button>
              <Button
                variant={tableFilter === "ready" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-8 text-amber-600 dark:text-amber-400"
                onClick={() => setTableFilter("ready")}
              >
                Prontas ({readyOrders.length})
              </Button>
              <Button
                variant={tableFilter === "bill" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-8 text-emerald-600 dark:text-emerald-400"
                onClick={() => setTableFilter("bill")}
              >
                Pagar ({openOrders.filter((o) => o.status === "entregue" || o.billPrinted).length})
              </Button>
              {cleanupOrders.length > 0 && (
                <Button
                  variant={tableFilter === "cleanup" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs h-8 text-amber-600 dark:text-amber-400 font-semibold gap-1"
                  onClick={() => setTableFilter("cleanup")}
                >
                  <Sparkles className="size-3" />
                  Limpeza ({cleanupOrders.length})
                </Button>
              )}
            </div>
          </div>
        </div>

        {displayedOrders.length === 0 ? (
          <div className="card-elevated flex flex-col items-center justify-center py-12 text-center">
            <Table2 className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhuma mesa encontrada</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {searchQuery
                ? `Nenhuma mesa com o termo "${searchQuery}". Tente limpar a busca.`
                : "Alterne os filtros acima ou abra um novo pedido para começar o atendimento."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedOrders.map((order) => {
              const isMine = order.waiter.toLowerCase() === waiterName.toLowerCase();
              const total = orderTotal(order);
              const urgency = urgencyFor(order, now);
              const minutes = Math.floor((now - order.openedAt) / 60000);

              return (
                <div
                  key={order.id}
                  className={cn(
                    "card-elevated flex flex-col justify-between p-4 transition-all hover:border-primary/40",
                    isMine && "border-l-4 border-l-primary",
                    order.cleanupRequested &&
                      "ring-2 ring-amber-500/60 bg-amber-500/5 dark:bg-amber-950/20",
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-display text-lg font-bold">Mesa {order.table}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQrOrder(order);
                            }}
                            title="Gerar QR Code para o cliente consultar a comanda"
                          >
                            <QrCode className="size-3.5 text-primary" />
                          </Button>
                          {isMine && (
                            <Badge
                              variant="outline"
                              className="border-primary/40 text-primary text-[10px] px-1.5 py-0"
                            >
                              Sua
                            </Badge>
                          )}
                          {order.billPrinted && (
                            <Badge
                              variant="outline"
                              className="border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] px-1.5 py-0"
                              title="Pré-conta já impressa"
                            >
                              <Printer className="size-2.5 mr-1" />
                              Conta impressa
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.code} · {order.guests} clientes
                        </p>

                        {/* Identificação do Cliente (Nome Customizado e Telefone) */}
                        {order.customerName && (
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                              <User className="size-3" />
                              {order.customerName}
                            </span>
                            {order.customerPhone && (
                              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                                <Phone className="size-2.5" />
                                {order.customerPhone}
                              </span>
                            )}
                            {order.customerRegistered && (
                              <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                Cadastrado
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-medium",
                            order.status === "pronto" &&
                              "bg-amber-500/20 text-amber-700 dark:text-amber-300 animate-pulse",
                            order.status === "entregue" &&
                              "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                          )}
                        >
                          {STATUS_LABEL[order.status]}
                        </Badge>
                        {order.cleanupRequested && (
                          <Badge className="bg-amber-500 text-amber-950 dark:text-amber-100 text-[10px] px-1.5 py-0 font-semibold animate-pulse">
                            <Sparkles className="size-2.5 mr-1" />
                            Limpeza solicitada
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        Aberta há {minutes} min
                      </span>
                      <span className="font-medium text-foreground">{order.waiter}</span>
                    </div>

                    {/* Resumo de itens */}
                    <div className="mt-2 text-xs space-y-1 text-muted-foreground line-clamp-3">
                      {order.items
                        .filter((i) => !i.canceled)
                        .slice(0, 3)
                        .map((i) => (
                          <div key={i.id} className="flex justify-between">
                            <span className="truncate pr-2">
                              {i.qty}× {i.name}
                            </span>
                            <span className="tabular-nums font-mono">{brl(i.price * i.qty)}</span>
                          </div>
                        ))}
                      {order.items.filter((i) => !i.canceled).length > 3 && (
                        <p className="text-[11px] text-muted-foreground italic">
                          +{order.items.filter((i) => !i.canceled).length - 3} outros itens...
                        </p>
                      )}
                    </div>

                    {/* ⚡ AÇÕES RÁPIDAS DIRETAMENTE NO CARD DE RESUMO ⚡ */}
                    <div className="mt-3 rounded-xl border border-border/80 bg-muted/40 p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-1">
                          <Zap className="size-3 text-amber-500" /> Ações Rápidas
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Mesa {order.table}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {/* Botão de Ação Rápida: QR Code da Comanda */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 px-1.5 font-medium transition-colors hover:border-primary/60 hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrOrder(order);
                          }}
                          title="Gerar QR Code para o cliente consultar a comanda no celular"
                        >
                          <QrCode className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">QR Code</span>
                        </Button>

                        {/* Botão de Ação Rápida: Imprimir Conta */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 text-xs gap-1 px-1.5 font-medium transition-colors hover:border-blue-500/60 hover:bg-blue-500/10",
                            order.billPrinted &&
                              "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintOrder(order);
                          }}
                          title="Imprimir conferência de conta para a mesa"
                        >
                          <Printer className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">
                            {order.billPrinted ? "Reimprimir" : "Conta"}
                          </span>
                        </Button>

                        {/* Botão de Ação Rápida: Solicitar Limpeza */}
                        {order.cleanupRequested ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 px-1.5 font-medium border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-600"
                            onClick={(e) => handleToggleCleanup(order, e)}
                            title="Concluir higienização e limpeza da mesa"
                          >
                            <CheckCheck className="size-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">Limpeza OK</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 px-1.5 font-medium hover:border-amber-500/60 hover:bg-amber-500/10 transition-colors"
                            onClick={(e) => handleToggleCleanup(order, e)}
                            title="Solicitar à equipe a limpeza da mesa"
                          >
                            <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">Limpeza</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card com Total e Ação */}
                  <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total da conta</span>
                      <span className="font-display text-lg font-bold tabular-nums text-foreground">
                        {brl(total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => setSelectedOrder(order)}
                      >
                        Ver comanda
                      </Button>

                      {order.status === "pronto" ? (
                        <Button
                          size="sm"
                          className="h-8 gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                          onClick={() => moveTo(order.id, "entregue")}
                        >
                          <HandPlatter className="size-3.5" />
                          Entregar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          onClick={() => setPayOrder(order)}
                        >
                          <Receipt className="size-3.5" />
                          Receber
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 💳 Pedidos Recentes & Transações Concluídas */}
      <RecentOrdersList
        onSelectOrder={(order) => setSelectedOrder(order)}
        onPrintReceipt={(order) => setPrintOrder(order)}
        onPayOrder={(order) => setPayOrder(order)}
      />

      {/* Diálogos integrados */}
      <NewOrderDialog open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
      <OrderDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onPay={(o) => {
          setSelectedOrder(null);
          setPayOrder(o);
        }}
      />
      <PaymentDialog order={payOrder} onClose={() => setPayOrder(null)} />
      <BillPrintDialog
        order={printOrder}
        onClose={() => setPrintOrder(null)}
        onPay={(o) => {
          setPrintOrder(null);
          setPayOrder(o);
        }}
      />
      <QRCodeModal order={qrOrder} onClose={() => setQrOrder(null)} />
      <FixedTableQRDialog open={fixedQrOpen} onClose={() => setFixedQrOpen(false)} />
      <TableManagementDialog open={tableManagerOpen} onOpenChange={setTableManagerOpen} />
    </div>
  );
}
