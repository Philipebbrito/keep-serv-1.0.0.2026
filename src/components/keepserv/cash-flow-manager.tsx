import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  Plus,
  ArrowDownCircle,
  Coins,
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Trash2,
  AlertCircle,
  Clock,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  History,
  Lock,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth, useBilling, useOrders } from "@/state";
import {
  CASH_FLOW_CATEGORY_LABEL,
  orderTotal,
  PAYMENT_LABEL,
  type CashFlowCategory,
  type CashFlowEntry,
  type CashFlowType,
  type PaymentMethod,
} from "@/domain";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function isSameDay(t1: number | Date, t2: number | Date): boolean {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function isYesterday(d: Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return isSameDay(d, y);
}

function formatDateDisplay(d: Date): string {
  const dayName = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const dayNum = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalized}, ${dayNum}`;
}

export function CashFlowManager() {
  const { cashFlowEntries, addCashFlowEntry, deleteCashFlowEntry, resetCashFlowToDefault } =
    useBilling();
  const { orders } = useOrders();
  const { session } = useAuth();

  // Estados de navegação temporal / histórico por data
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewScope, setViewScope] = useState<"day" | "last7days" | "last30days" | "all">("day");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Estados de modais
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CashFlowEntry | null>(null);

  // Estados do formulário de nova movimentação
  const [formType, setFormType] = useState<CashFlowType>("saida");
  const [formCategory, setFormCategory] = useState<CashFlowCategory>("insumos");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState<PaymentMethod | "transferencia">("dinheiro");
  const [formNotes, setFormNotes] = useState("");
  const [formDate, setFormDate] = useState(() => toISODate(new Date()));

  // Filtros da tabela
  const [filterType, setFilterType] = useState<"all" | CashFlowType>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Navegação rápida de datas
  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
    setViewScope("day");
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
    setViewScope("day");
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setViewScope("day");
  };

  const goToYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setSelectedDate(y);
    setViewScope("day");
  };

  const canGoNext = useMemo(() => {
    const today = new Date();
    return !isSameDay(selectedDate, today) && selectedDate < today;
  }, [selectedDate]);

  // Lançamentos filtrados pelo escopo de data selecionado
  const entriesInScope = useMemo(() => {
    if (viewScope === "day") {
      return cashFlowEntries.filter((e) => isSameDay(e.timestamp, selectedDate));
    }
    if (viewScope === "last7days") {
      const limit = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return cashFlowEntries.filter((e) => e.timestamp >= limit);
    }
    if (viewScope === "last30days") {
      const limit = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return cashFlowEntries.filter((e) => e.timestamp >= limit);
    }
    return cashFlowEntries;
  }, [cashFlowEntries, viewScope, selectedDate]);

  // Cálculo de KPIs Financeiros sobre o período selecionado
  const kpis = useMemo(() => {
    let totalEntradas = 0;
    let totalSaidas = 0;
    let dinheiroFisico = 0;
    let totalPix = 0;
    let totalCartoes = 0;
    let totalVendasComandas = 0;
    let totalSangrias = 0;
    let totalSuprimentos = 0;
    let totalDespesasInsumos = 0;

    for (const entry of entriesInScope) {
      if (entry.type === "entrada") {
        totalEntradas += entry.amount;
        if (entry.category === "venda_comanda") {
          totalVendasComandas += entry.amount;
        } else if (entry.category === "suprimento") {
          totalSuprimentos += entry.amount;
        }

        if (entry.method === "dinheiro") {
          dinheiroFisico += entry.amount;
        } else if (entry.method === "pix") {
          totalPix += entry.amount;
        } else if (entry.method === "credito" || entry.method === "debito") {
          totalCartoes += entry.amount;
        }
      } else {
        totalSaidas += entry.amount;
        if (entry.category === "sangria") {
          totalSangrias += entry.amount;
        } else if (entry.category === "insumos") {
          totalDespesasInsumos += entry.amount;
        }

        if (entry.method === "dinheiro") {
          dinheiroFisico -= entry.amount;
        }
      }
    }

    const saldoOperacional = totalEntradas - totalSaidas;

    // Previsão das comandas abertas no salão (apenas se for hoje)
    const isViewingToday = viewScope === "day" ? isToday(selectedDate) : true;
    const pendentesCount = isViewingToday ? orders.filter((o) => o.status !== "pago").length : 0;
    const pendentesValor = isViewingToday
      ? orders.filter((o) => o.status !== "pago").reduce((acc, o) => acc + orderTotal(o), 0)
      : 0;

    return {
      totalEntradas,
      totalSaidas,
      saldoOperacional,
      dinheiroFisico,
      totalPix,
      totalCartoes,
      totalDigital: totalPix + totalCartoes,
      totalVendasComandas,
      totalSangrias,
      totalSuprimentos,
      totalDespesasInsumos,
      pendentesCount,
      pendentesValor,
      isViewingToday,
    };
  }, [entriesInScope, orders, viewScope, selectedDate]);

  // Gráfico: Comparativo de Receitas por Método de Pagamento no período selecionado
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {
      pix: 0,
      dinheiro: 0,
      credito: 0,
      debito: 0,
    };

    for (const entry of entriesInScope) {
      if (entry.type === "entrada" && entry.method && entry.method in map) {
        map[entry.method] = (map[entry.method] || 0) + entry.amount;
      }
    }

    return [
      { metodo: "Pix", total: map.pix, fill: "var(--chart-1)" },
      { metodo: "Crédito", total: map.credito, fill: "var(--chart-2)" },
      { metodo: "Débito", total: map.debito, fill: "var(--chart-3)" },
      { metodo: "Dinheiro", total: map.dinheiro, fill: "var(--chart-4)" },
    ];
  }, [entriesInScope]);

  // Gráfico: Despesas por Categoria no período selecionado
  const expensesByCategoryData = useMemo(() => {
    const map: Record<string, number> = {};

    for (const entry of entriesInScope) {
      if (entry.type === "saida") {
        const label = CASH_FLOW_CATEGORY_LABEL[entry.category] || entry.category;
        map[label] = (map[label] || 0) + entry.amount;
      }
    }

    return Object.entries(map).map(([categoria, valor]) => ({
      categoria,
      valor,
    }));
  }, [entriesInScope]);

  // Filtragem dos lançamentos pelo termo de busca e seletores secundários
  const filteredEntries = useMemo(() => {
    return entriesInScope.filter((entry) => {
      if (filterType !== "all" && entry.type !== filterType) return false;
      if (filterCategory !== "all" && entry.category !== filterCategory) return false;
      if (filterMethod !== "all" && entry.method !== filterMethod) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = entry.description.toLowerCase().includes(query);
        const matchesAuthor = entry.author.toLowerCase().includes(query);
        const matchesOrder = entry.orderCode?.toLowerCase().includes(query);
        const matchesCat = CASH_FLOW_CATEGORY_LABEL[entry.category]?.toLowerCase().includes(query);
        if (!matchesDesc && !matchesAuthor && !matchesOrder && !matchesCat) return false;
      }

      return true;
    });
  }, [entriesInScope, filterType, filterCategory, filterMethod, searchQuery]);

  // Handlers para ações rápidas
  const handleOpenNewEntry = (type: CashFlowType, cat?: CashFlowCategory, targetDate?: Date) => {
    const d = targetDate || (viewScope === "day" ? selectedDate : new Date());
    setFormDate(toISODate(d));
    setFormType(type);
    setFormCategory(cat ?? (type === "entrada" ? "suprimento" : "insumos"));
    setFormMethod(type === "entrada" ? "pix" : "dinheiro");
    setFormDescription(
      cat === "sangria"
        ? "Sangria de dinheiro para cofre administrativo"
        : cat === "suprimento"
          ? "Aporte de moedas e cédulas para troco"
          : "",
    );
    setFormAmount("");
    setFormNotes("");
    setIsNewEntryOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount.replace(",", "."));
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Informe um valor monetário válido.");
      return;
    }
    if (!formDescription.trim()) {
      toast.error("Informe a descrição ou motivo da movimentação.");
      return;
    }

    const targetDate = parseISODate(formDate);
    const now = new Date();
    targetDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    addCashFlowEntry({
      type: formType,
      category: formCategory,
      description: formDescription.trim(),
      amount: parsedAmount,
      method: formMethod,
      timestamp: targetDate.getTime(),
      notes: formNotes.trim() || undefined,
      author: session?.name ? `${session.name} (Gestor)` : "Marcos Tavares (Gestor)",
    });

    toast.success(
      `${formType === "entrada" ? "Entrada" : "Saída"} de ${formatBRL(parsedAmount)} registrada com sucesso para ${targetDate.toLocaleDateString("pt-BR")}!`,
    );
    setIsNewEntryOpen(false);
  };

  const handleDeleteEntry = (entry: CashFlowEntry) => {
    if (entry.category === "venda_comanda") {
      toast.error(
        "Vendas vinculadas a comandas devem ser estornadas através do módulo de comandas.",
      );
      return;
    }
    if (confirm(`Confirmar cancelamento da movimentação: "${entry.description}"?`)) {
      deleteCashFlowEntry(entry.id);
      toast.success("Movimentação removida do fluxo de caixa.");
    }
  };

  const tooltipStyle = {
    backgroundColor: "var(--card)",
    borderColor: "var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--card-foreground)",
  };

  return (
    <div className="space-y-6">
      {/* Header com Status do Turno e Ações Rápidas */}
      <div className="card-elevated flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {viewScope === "day" && isToday(selectedDate) ? (
              <>
                <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Caixa Aberto · Turno Atual em Andamento
                </span>
              </>
            ) : viewScope === "day" ? (
              <>
                <Lock className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Histórico de Caixa Fechado · {selectedDate.toLocaleDateString("pt-BR")}
                </span>
              </>
            ) : (
              <>
                <History className="size-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Visão Histórica Consolidada
                </span>
              </>
            )}
          </div>
          <h2 className="font-display text-xl font-bold tracking-tight mt-1">
            Fluxo de Caixa & Gestão Financeira
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conciliação financeira em tempo real, histórico retroativo por calendário, gaveta de
            dinheiro físico e fechamentos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            onClick={() => handleOpenNewEntry("saida", "sangria")}
          >
            <ArrowDownCircle className="size-4 text-amber-500" />
            <span>Fazer Sangria</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            onClick={() => handleOpenNewEntry("entrada", "suprimento")}
          >
            <Coins className="size-4 text-blue-500" />
            <span>Suprimento / Troco</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            onClick={() => setIsReportOpen(true)}
          >
            <FileText className="size-4 text-primary" />
            <span>Fechamento / Relatório Z</span>
          </Button>

          <Button
            size="sm"
            className="gap-1.5 h-9 bg-brand-gradient text-primary-foreground font-semibold shadow-sm"
            onClick={() => handleOpenNewEntry("saida")}
          >
            <Plus className="size-4" />
            <span>Nova Movimentação</span>
          </Button>
        </div>
      </div>

      {/* Barra de Controle de Período & Navegação Temporal com Calendário */}
      <div className="card-elevated p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Seletor de Escopo Temporal */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1 whitespace-nowrap">
              <History className="size-3.5" />
              Período:
            </span>
            <button
              type="button"
              onClick={() => setViewScope("day")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                viewScope === "day"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              📅 Por Dia (Calendário)
            </button>
            <button
              type="button"
              onClick={() => setViewScope("last7days")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                viewScope === "last7days"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => setViewScope("last30days")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                viewScope === "last30days"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Últimos 30 dias
            </button>
            <button
              type="button"
              onClick={() => setViewScope("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                viewScope === "all"
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Histórico Completo
            </button>
          </div>

          {/* Atalho para redefinir histórico demonstrativo se desejado */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              onClick={() => {
                if (
                  confirm(
                    "Deseja restaurar o histórico demonstrativo com lançamentos completos dos últimos 7 dias?",
                  )
                ) {
                  resetCashFlowToDefault();
                  toast.success("Histórico demonstrativo recarregado com sucesso!");
                }
              }}
              title="Restaura lançamentos de demonstração dos últimos 7 dias"
            >
              <RotateCcw className="size-3" />
              <span>Restaurar Histórico Padrão</span>
            </Button>
          </div>
        </div>

        {/* Linha de Navegação do Dia Selecionado com Popover e Calendário */}
        {viewScope === "day" && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Botão Dia Anterior */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                onClick={goToPreviousDay}
                title="Ver dia anterior"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline">Dia Anterior</span>
              </Button>

              {/* Botão Central com Popover do Calendário */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 px-3 text-xs font-semibold gap-2 border-primary/30 hover:border-primary/60 bg-background shadow-xs"
                  >
                    <CalendarIcon className="size-3.5 text-primary" />
                    <span>{formatDateDisplay(selectedDate)}</span>
                    {isToday(selectedDate) ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                        Hoje · Aberto
                      </Badge>
                    ) : isYesterday(selectedDate) ? (
                      <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0">
                        Ontem · Fechado
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 text-muted-foreground"
                      >
                        Histórico Fechado
                      </Badge>
                    )}
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <CalendarIcon className="size-3.5 text-primary" />
                        Escolha uma data no calendário
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        Histórico
                      </Badge>
                    </div>

                    {/* Componente Calendar */}
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        if (d) {
                          setSelectedDate(d);
                          setViewScope("day");
                          setIsCalendarOpen(false);
                          toast.info(
                            `Visualizando fluxo de caixa de ${d.toLocaleDateString("pt-BR")}`,
                          );
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      className="rounded-md border p-2"
                    />

                    {/* Atalhos rápidos dentro do calendário */}
                    <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-muted-foreground mr-1">Atalhos:</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={() => {
                          goToToday();
                          setIsCalendarOpen(false);
                        }}
                      >
                        Hoje
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={() => {
                          goToYesterday();
                          setIsCalendarOpen(false);
                        }}
                      >
                        Ontem
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() - 2);
                          setSelectedDate(d);
                          setViewScope("day");
                          setIsCalendarOpen(false);
                        }}
                      >
                        Anteontem
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() - 7);
                          setSelectedDate(d);
                          setViewScope("day");
                          setIsCalendarOpen(false);
                        }}
                      >
                        7 Dias Atrás
                      </Button>
                    </div>

                    {/* Entrada manual de data */}
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <Label
                        htmlFor="manualDateInput"
                        className="text-[11px] text-muted-foreground whitespace-nowrap"
                      >
                        Ou digite a data:
                      </Label>
                      <Input
                        id="manualDateInput"
                        type="date"
                        max={toISODate(new Date())}
                        value={toISODate(selectedDate)}
                        onChange={(e) => {
                          if (e.target.value) {
                            const d = parseISODate(e.target.value);
                            setSelectedDate(d);
                            setViewScope("day");
                            setIsCalendarOpen(false);
                          }
                        }}
                        className="h-7 text-xs w-auto"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Botão Próximo Dia */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                onClick={goToNextDay}
                disabled={!canGoNext}
                title={canGoNext ? "Ver próximo dia" : "Você já está na data de hoje"}
              >
                <span className="hidden sm:inline">Próximo Dia</span>
                <ChevronRight className="size-3.5" />
              </Button>

              {/* Botão para voltar direto para Hoje se estiver em dia anterior */}
              {!isToday(selectedDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-primary hover:text-primary gap-1"
                  onClick={goToToday}
                >
                  <RotateCcw className="size-3" />
                  <span>Voltar para Hoje</span>
                </Button>
              )}
            </div>

            {/* Status do Dia */}
            <div className="flex items-center gap-2 text-xs">
              {isToday(selectedDate) ? (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Turno em Andamento (Caixa Aberto)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Lock className="size-3 text-muted-foreground" />
                  <span>Turno Fechado (Consulta Histórica)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resumo quando em visão consolidada */}
        {viewScope !== "day" && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {viewScope === "last7days"
                  ? "Consolidado dos Últimos 7 dias"
                  : viewScope === "last30days"
                    ? "Consolidado dos Últimos 30 dias"
                    : "Histórico Completo de Todas as Datas"}
              </Badge>
              <span className="text-muted-foreground">
                {entriesInScope.length} movimentação(ões) no período selecionado
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => {
                setSelectedDate(new Date());
                setViewScope("day");
              }}
            >
              <CalendarIcon className="size-3" />
              Ver Caixa de Hoje
            </Button>
          </div>
        )}
      </div>

      {/* Grid de KPIs Financeiros */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Líquido Operacional */}
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Resultado Líquido
            </span>
            <span
              className={`p-2 rounded-lg ${
                kpis.saldoOperacional >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              <TrendingUp className="size-4" />
            </span>
          </div>
          <p className="font-display text-2xl font-bold mt-2">{formatBRL(kpis.saldoOperacional)}</p>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border/50">
            <span className="text-muted-foreground">Entradas - Saídas</span>
            <Badge
              variant="outline"
              className={
                kpis.saldoOperacional >= 0
                  ? "text-emerald-600 border-emerald-500/30"
                  : "text-rose-600 border-rose-500/30"
              }
            >
              {kpis.saldoOperacional >= 0 ? "Superávit do período" : "Déficit temporário"}
            </Badge>
          </div>
        </div>

        {/* Dinheiro Físico em Gaveta */}
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Dinheiro na Gaveta
            </span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Banknote className="size-4" />
            </span>
          </div>
          <p className="font-display text-2xl font-bold mt-2 text-amber-700 dark:text-amber-400">
            {formatBRL(kpis.dinheiroFisico)}
          </p>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border/50">
            <span className="text-muted-foreground">Conferência física</span>
            <span className="font-medium text-muted-foreground">
              {viewScope === "day" && !isToday(selectedDate)
                ? "Saldo do fechamento"
                : "Gaveta física"}
            </span>
          </div>
        </div>

        {/* Receitas Digitais (Pix + Cartões) */}
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Recebimentos Digitais
            </span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Landmark className="size-4" />
            </span>
          </div>
          <p className="font-display text-2xl font-bold mt-2">{formatBRL(kpis.totalDigital)}</p>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border/50 text-muted-foreground">
            <span>Pix: {formatBRL(kpis.totalPix)}</span>
            <span>Cartões: {formatBRL(kpis.totalCartoes)}</span>
          </div>
        </div>

        {/* Previsão do Salão (Comandas Abertas) */}
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              A Receber no Salão
            </span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="font-display text-2xl font-bold mt-2 text-purple-700 dark:text-purple-400">
            {formatBRL(kpis.pendentesValor)}
          </p>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border/50">
            <span className="text-muted-foreground">
              {kpis.isViewingToday
                ? `${kpis.pendentesCount} comanda(s) em aberto`
                : "Caixa encerrado no dia"}
            </span>
            <Badge variant="outline" className="text-purple-600 border-purple-500/30">
              {kpis.isViewingToday ? "Previsão de receita" : "Fechado"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Métricas secundárias em faixa fina */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-elevated p-3 text-center">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Entradas
          </span>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            + {formatBRL(kpis.totalEntradas)}
          </p>
        </div>
        <div className="card-elevated p-3 text-center">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Saídas / Custos
          </span>
          <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            - {formatBRL(kpis.totalSaidas)}
          </p>
        </div>
        <div className="card-elevated p-3 text-center">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Sangrias Realizadas
          </span>
          <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {formatBRL(kpis.totalSangrias)}
          </p>
        </div>
        <div className="card-elevated p-3 text-center">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Suprimentos / Troco
          </span>
          <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {formatBRL(kpis.totalSuprimentos)}
          </p>
        </div>
      </div>

      {/* Gráficos Financeiros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Mix de Meios de Pagamento */}
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-base font-semibold">Mix de Meios de Pagamento</h3>
              <p className="text-xs text-muted-foreground">
                Distribuição das receitas recebidas por modalidade no período
              </p>
            </div>
            <Wallet className="size-4 text-muted-foreground" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={paymentMethodData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="metodo" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: number) => [formatBRL(val), "Receita"]}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Despesas e Saídas por Categoria */}
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-base font-semibold">
                Distribuição de Saídas Operacionais
              </h3>
              <p className="text-xs text-muted-foreground">
                Onde foram aplicadas as saídas do período
              </p>
            </div>
            <TrendingDown className="size-4 text-rose-500" />
          </div>
          <div className="h-64 w-full">
            {expensesByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={expensesByCategoryData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="categoria"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: number) => [formatBRL(val), "Saída"]}
                  />
                  <Bar dataKey="valor" fill="var(--chart-5)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Nenhuma saída registrada para este período.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Livro Caixa: Extrato Detalhado de Movimentações */}
      <div className="card-elevated p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">
              Extrato de Movimentações (Livro Caixa)
            </h3>
            <p className="text-xs text-muted-foreground">
              {viewScope === "day"
                ? `Exibindo movimentações de: ${formatDateDisplay(selectedDate)}`
                : viewScope === "last7days"
                  ? "Exibindo movimentações consolidadas dos últimos 7 dias"
                  : viewScope === "last30days"
                    ? "Exibindo movimentações consolidadas dos últimos 30 dias"
                    : "Exibindo todo o histórico de lançamentos do estabelecimento"}
            </p>
          </div>
          <Badge variant="outline" className="w-fit text-xs font-medium">
            {filteredEntries.length} registro(s) exibido(s)
          </Badge>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/60">
          {/* Busca por texto */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar descrição, autor ou comanda..."
              className="h-8 pl-8 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro por Tipo */}
          <select
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-ring"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "all" | CashFlowType)}
          >
            <option value="all">Todos os Tipos (+ e -)</option>
            <option value="entrada">Apenas Entradas (+)</option>
            <option value="saida">Apenas Saídas (-)</option>
          </select>

          {/* Filtro por Categoria */}
          <select
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-ring"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">Todas as Categorias</option>
            <option value="venda_comanda">Venda de Comanda</option>
            <option value="suprimento">Suprimento de Troco</option>
            <option value="sangria">Sangria de Caixa</option>
            <option value="insumos">Compra de Insumos</option>
            <option value="pessoal_extra">Diária de Extra / Freelancer</option>
            <option value="manutencao">Manutenção & Reparos</option>
            <option value="servicos">Serviços Operacionais</option>
            <option value="outros">Outras Movimentações</option>
          </select>

          {/* Filtro por Meio de Pagamento */}
          <select
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:ring-1 focus:ring-ring"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="all">Todas as Formas de Pagamento</option>
            <option value="dinheiro">Dinheiro (Gaveta)</option>
            <option value="pix">Pix</option>
            <option value="debito">Cartão de Débito</option>
            <option value="credito">Cartão de Crédito</option>
            <option value="transferencia">Transferência Bancária</option>
          </select>
        </div>

        {/* Tabela de Lançamentos */}
        <div className="overflow-x-auto rounded-lg border border-border/70">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">{viewScope === "day" ? "Horário" : "Data & Hora"}</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Descrição / Detalhes</th>
                <th className="py-2.5 px-3">Forma</th>
                <th className="py-2.5 px-3">Operador / Autor</th>
                <th className="py-2.5 px-3 text-right">Valor</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const date = new Date(entry.timestamp);
                  const formattedTime =
                    viewScope === "day"
                      ? date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                      : `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
                  const isEntrada = entry.type === "entrada";

                  return (
                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                      {/* Data / Horário */}
                      <td className="py-2.5 px-3 text-muted-foreground font-mono whitespace-nowrap">
                        {formattedTime}
                      </td>

                      {/* Tipo */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isEntrada ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px]">
                            <ArrowUpRight className="size-3" />
                            Entrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full text-[10px]">
                            <ArrowDownRight className="size-3" />
                            Saída
                          </span>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {CASH_FLOW_CATEGORY_LABEL[entry.category] ?? entry.category}
                        </Badge>
                      </td>

                      {/* Descrição */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {entry.orderCode && (
                            <span className="font-semibold px-1.5 py-0.2 rounded bg-secondary text-secondary-foreground text-[10px]">
                              {entry.orderCode}
                            </span>
                          )}
                          <span className="font-medium text-foreground">{entry.description}</span>
                          {entry.notes && (
                            <span className="text-[10px] text-muted-foreground italic">
                              ({entry.notes})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-muted-foreground capitalize">
                          {entry.method === "dinheiro" && (
                            <Banknote className="size-3 text-amber-500" />
                          )}
                          {entry.method === "pix" && <QrCode className="size-3 text-emerald-500" />}
                          {(entry.method === "credito" || entry.method === "debito") && (
                            <CreditCard className="size-3 text-blue-500" />
                          )}
                          {entry.method
                            ? PAYMENT_LABEL[entry.method as PaymentMethod] || entry.method
                            : "-"}
                        </span>
                      </td>

                      {/* Autor */}
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        {entry.author}
                      </td>

                      {/* Valor */}
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            isEntrada
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {isEntrada ? "+ " : "- "}
                          {formatBRL(entry.amount)}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedEntry(entry)}
                            title="Ver detalhes da movimentação"
                          >
                            <FileText className="size-3" />
                          </Button>
                          {entry.category !== "venda_comanda" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                              onClick={() => handleDeleteEntry(entry)}
                              title="Cancelar lançamento"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="p-3 rounded-full bg-muted/60">
                        <CalendarDays className="size-6 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        Nenhuma movimentação registrada nesta data
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        {viewScope === "day"
                          ? `Não há registros de caixa no dia ${selectedDate.toLocaleDateString("pt-BR")}. Você pode navegar pelas setas de data ou registrar um lançamento retroativo.`
                          : "Nenhum registro encontrado com os filtros selecionados."}
                      </p>
                      {viewScope === "day" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 text-xs gap-1.5"
                          onClick={() => handleOpenNewEntry("saida", "insumos", selectedDate)}
                        >
                          <Plus className="size-3.5" />
                          Lançar Movimentação nesta Data
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Detalhes do Lançamento */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Comprovante de Lançamento
            </DialogTitle>
            <DialogDescription>
              Identificador único e rastreabilidade da movimentação de caixa.
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">ID da Transação:</span>
                <span className="font-mono font-medium">{selectedEntry.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Data e Horário:</span>
                <span className="font-medium">
                  {new Date(selectedEntry.timestamp).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Natureza / Tipo:</span>
                <span className="capitalize font-semibold">
                  {selectedEntry.type === "entrada" ? "Entrada (+)" : "Saída (-)"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Categoria:</span>
                <span>
                  {CASH_FLOW_CATEGORY_LABEL[selectedEntry.category] ?? selectedEntry.category}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Descrição:</span>
                <span className="font-medium text-right max-w-[240px]">
                  {selectedEntry.description}
                </span>
              </div>
              {selectedEntry.orderCode && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Comanda de Origem:</span>
                  <span className="font-semibold text-primary">{selectedEntry.orderCode}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Meio de Liquidação:</span>
                <span className="capitalize font-medium">
                  {selectedEntry.method
                    ? PAYMENT_LABEL[selectedEntry.method as PaymentMethod] || selectedEntry.method
                    : "Não informado"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Operador Responsável:</span>
                <span className="font-medium">{selectedEntry.author}</span>
              </div>
              {selectedEntry.notes && (
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Observações / NF:</span>
                  <span className="italic text-right max-w-[240px]">{selectedEntry.notes}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-border font-bold text-sm">
                <span>Valor Liquidado:</span>
                <span
                  className={
                    selectedEntry.type === "entrada"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }
                >
                  {selectedEntry.type === "entrada" ? "+ " : "- "}
                  {formatBRL(selectedEntry.amount)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedEntry(null)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nova Movimentação Manual */}
      <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4 text-primary" />
              Registrar Movimentação de Caixa
            </DialogTitle>
            <DialogDescription>
              Insira saídas (sangrias, insumos, despesas) ou entradas de troco e aportes no caixa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEntry} className="space-y-3 pt-2">
            {/* Data da Movimentação */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Data da Movimentação</Label>
                <span className="text-[10px] text-muted-foreground">
                  {formDate === toISODate(new Date()) ? "Hoje" : "Lançamento Retroativo"}
                </span>
              </div>
              <Input
                type="date"
                max={toISODate(new Date())}
                className="h-9 text-xs"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>

            {/* Tipo: Entrada ou Saída */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Operação</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formType === "entrada" ? "default" : "outline"}
                  size="sm"
                  className={
                    formType === "entrada"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      : ""
                  }
                  onClick={() => {
                    setFormType("entrada");
                    setFormCategory("suprimento");
                  }}
                >
                  <ArrowUpRight className="size-4 mr-1.5" />
                  Entrada (+)
                </Button>
                <Button
                  type="button"
                  variant={formType === "saida" ? "default" : "outline"}
                  size="sm"
                  className={
                    formType === "saida"
                      ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                      : ""
                  }
                  onClick={() => {
                    setFormType("saida");
                    setFormCategory("insumos");
                  }}
                >
                  <ArrowDownRight className="size-4 mr-1.5" />
                  Saída (-)
                </Button>
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Categoria Financeira</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-ring"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as CashFlowCategory)}
              >
                {formType === "entrada" ? (
                  <>
                    <option value="suprimento">Suprimento de Troco / Aporte</option>
                    <option value="outros">Outras Entradas</option>
                  </>
                ) : (
                  <>
                    <option value="sangria">Sangria (Retirada para Cofre)</option>
                    <option value="insumos">Compra Emergencial de Insumos</option>
                    <option value="pessoal_extra">Diária de Garçom / Pessoal Extra</option>
                    <option value="manutencao">Manutenção & Reparos</option>
                    <option value="servicos">Serviços Operacionais</option>
                    <option value="outros">Outras Saídas</option>
                  </>
                )}
              </select>
            </div>

            {/* Valor e Forma de Pagamento */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  className="h-9 text-xs"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Meio de Liquidação</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-ring"
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value as PaymentMethod | "transferencia")}
                >
                  <option value="dinheiro">Dinheiro (Gaveta)</option>
                  <option value="pix">Pix</option>
                  <option value="transferencia">Transferência</option>
                  <option value="debito">Cartão Débito</option>
                  <option value="credito">Cartão Crédito</option>
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição / Motivo</Label>
              <Input
                placeholder="Ex: Compra de 4 sacos de gelo na distribuidora"
                className="h-9 text-xs"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                required
              />
            </div>

            {/* Observações / NF */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Observações / Comprovante (Opcional)</Label>
              <Input
                placeholder="Ex: Nota Fiscal nº 3892 ou Nome do prestador"
                className="h-9 text-xs"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewEntryOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Confirmar Lançamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Relatório de Fechamento / Relatório Z do Turno */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Printer className="size-4 text-primary" />
                Fechamento de Caixa · Relatório Z
              </DialogTitle>
              <Badge variant="outline" className="text-[10px]">
                {viewScope === "day" && isToday(selectedDate)
                  ? "Turno Atual"
                  : viewScope === "day"
                    ? `Dia: ${selectedDate.toLocaleDateString("pt-BR")}`
                    : "Consolidado"}
              </Badge>
            </div>
            <DialogDescription>
              Resumo executivo consolidado para prestação de contas e conferência de gaveta física.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Bloco de identificação */}
            <div className="rounded-lg bg-muted/40 p-3 flex items-center justify-between border border-border/70">
              <div>
                <p className="font-semibold text-foreground">KeepServ Gastronomia</p>
                <p className="text-muted-foreground text-[11px]">
                  Gestor responsável: {session?.name ?? "Marcos Tavares"}
                </p>
              </div>
              <div className="text-right text-muted-foreground text-[11px]">
                <p className="font-semibold text-foreground">
                  Data:{" "}
                  {viewScope === "day"
                    ? selectedDate.toLocaleDateString("pt-BR")
                    : "Período Consolidado"}
                </p>
                <p>Emitido às: {new Date().toLocaleTimeString("pt-BR")}</p>
              </div>
            </div>

            {/* Resumo de Conciliação */}
            <div className="space-y-2 border-t border-border pt-3">
              <h4 className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                Receitas e Entradas
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Vendas de Comandas (Salão):</span>
                  <span className="font-semibold">{formatBRL(kpis.totalVendasComandas)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Suprimentos / Troco Inicial:</span>
                  <span className="font-semibold">{formatBRL(kpis.totalSuprimentos)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Total Geral de Entradas:</span>
                  <span>+ {formatBRL(kpis.totalEntradas)}</span>
                </div>
              </div>
            </div>

            {/* Resumo por Forma de Pagamento */}
            <div className="space-y-2 border-t border-border pt-3">
              <h4 className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                Recebimentos por Modalidade
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground block">Pix Recebido</span>
                  <span className="font-bold text-sm text-foreground">
                    {formatBRL(kpis.totalPix)}
                  </span>
                </div>
                <div className="p-2 rounded bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground block">Cartões (Crédito + Débito)</span>
                  <span className="font-bold text-sm text-foreground">
                    {formatBRL(kpis.totalCartoes)}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumo de Saídas */}
            <div className="space-y-2 border-t border-border pt-3">
              <h4 className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                Saídas e Deduções
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Sangrias para Cofre:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    - {formatBRL(kpis.totalSangrias)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Despesas / Insumos / Extras:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    - {formatBRL(kpis.totalSaidas - kpis.totalSangrias)}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-bold text-rose-600 dark:text-rose-400">
                  <span>Total Geral de Saídas:</span>
                  <span>- {formatBRL(kpis.totalSaidas)}</span>
                </div>
              </div>
            </div>

            {/* Conferência Final da Gaveta */}
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 space-y-1">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Valor Esperado em Dinheiro Físico (Gaveta):
                  </p>
                  <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
                    Troco inicial + Vendas em espécie - Saídas em dinheiro
                  </p>
                </div>
                <span className="text-lg font-extrabold text-amber-950 dark:text-amber-100">
                  {formatBRL(kpis.dinheiroFisico)}
                </span>
              </div>
            </div>

            {/* Resultado Operacional */}
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 flex justify-between items-center">
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200">
                  Resultado Líquido do Período:
                </p>
                <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                  Superávit financeiro total apurado
                </p>
              </div>
              <span className="text-lg font-extrabold text-emerald-950 dark:text-emerald-100">
                {formatBRL(kpis.saldoOperacional)}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-3 flex sm:justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                window.print();
              }}
              className="gap-1.5"
            >
              <Printer className="size-3.5" />
              Imprimir Relatório Z
            </Button>
            <Button type="button" size="sm" onClick={() => setIsReportOpen(false)}>
              Concluir Conferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
