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
  Calendar,
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
import { useKeepServ } from "@/lib/keepserv/store";
import {
  CASH_FLOW_CATEGORY_LABEL,
  orderTotal,
  PAYMENT_LABEL,
  type CashFlowCategory,
  type CashFlowEntry,
  type CashFlowType,
  type PaymentMethod,
} from "@/lib/keepserv/types";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function CashFlowManager() {
  const { cashFlowEntries, orders, addCashFlowEntry, deleteCashFlowEntry, session } = useKeepServ();

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

  // Filtros da tabela
  const [filterType, setFilterType] = useState<"all" | CashFlowType>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Cálculo de KPIs Financeiros
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

    for (const entry of cashFlowEntries) {
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

    // Previsão das comandas abertas no salão
    const pendentesValor = orders
      .filter((o) => o.status !== "pago")
      .reduce((acc, o) => acc + orderTotal(o), 0);

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
      pendentesValor,
    };
  }, [cashFlowEntries, orders]);

  // Gráfico: Comparativo de Receitas por Método de Pagamento
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {
      pix: 0,
      dinheiro: 0,
      credito: 0,
      debito: 0,
    };

    for (const entry of cashFlowEntries) {
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
  }, [cashFlowEntries]);

  // Gráfico: Despesas por Categoria
  const expensesByCategoryData = useMemo(() => {
    const map: Record<string, number> = {};

    for (const entry of cashFlowEntries) {
      if (entry.type === "saida") {
        const label = CASH_FLOW_CATEGORY_LABEL[entry.category] || entry.category;
        map[label] = (map[label] || 0) + entry.amount;
      }
    }

    return Object.entries(map).map(([categoria, valor]) => ({
      categoria,
      valor,
    }));
  }, [cashFlowEntries]);

  // Filtragem dos lançamentos
  const filteredEntries = useMemo(() => {
    return cashFlowEntries.filter((entry) => {
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
  }, [cashFlowEntries, filterType, filterCategory, filterMethod, searchQuery]);

  // Handlers para ações rápidas
  const handleOpenNewEntry = (type: CashFlowType, cat?: CashFlowCategory) => {
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

    addCashFlowEntry({
      type: formType,
      category: formCategory,
      description: formDescription.trim(),
      amount: parsedAmount,
      method: formMethod,
      notes: formNotes.trim() || undefined,
      author: session?.name ? `${session.name} (Gestor)` : "Marcos Tavares (Gestor)",
    });

    toast.success(
      `${formType === "entrada" ? "Entrada" : "Saída"} de ${formatBRL(parsedAmount)} registrada com sucesso!`,
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
            <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Caixa Aberto · Turno em Andamento
            </span>
          </div>
          <h2 className="font-display text-xl font-bold tracking-tight mt-1">
            Fluxo de Caixa & Gestão Financeira
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conciliação financeira em tempo real, gaveta de dinheiro físico, sangrias e conciliação
            de comandas.
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
              {kpis.saldoOperacional >= 0 ? "Superávit do turno" : "Déficit temporário"}
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
            <span className="font-medium text-muted-foreground">Gaveta do caixa</span>
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
              {orders.filter((o) => o.status !== "pago").length} comandas em aberto
            </span>
            <Badge variant="outline" className="text-purple-600 border-purple-500/30">
              Previsão de receita
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
                Distribuição das receitas recebidas por modalidade
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
                Onde foram aplicadas as saídas do turno
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
                Nenhuma saída registrada até o momento.
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
              Histórico detalhado de todas as receitas de comandas, aportes, sangrias e despesas do
              turno.
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
                <th className="py-2.5 px-3">Horário</th>
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
              {filteredEntries.map((entry) => {
                const date = new Date(entry.timestamp);
                const timeStr = date.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isEntrada = entry.type === "entrada";

                return (
                  <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                    {/* Horário */}
                    <td className="py-2.5 px-3 text-muted-foreground font-mono whitespace-nowrap">
                      {timeStr}
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
                            className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10"
                            onClick={() => handleDeleteEntry(entry)}
                            title="Estornar / Excluir movimentação"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    Nenhuma movimentação encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nova Movimentação (Entrada / Saída / Sangria / Insumos) */}
      <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Movimentação de Caixa</DialogTitle>
            <DialogDescription>
              Lance saídas operacionais, compras de emergência, diárias de extras, suprimentos ou
              sangrias.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEntry} className="space-y-4 pt-2">
            {/* Tipo: Entrada ou Saída */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Movimentação</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formType === "entrada" ? "default" : "outline"}
                  className={`h-9 text-xs font-medium justify-center gap-1.5 ${
                    formType === "entrada" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                  }`}
                  onClick={() => {
                    setFormType("entrada");
                    setFormCategory("suprimento");
                  }}
                >
                  <ArrowUpRight className="size-3.5" />
                  Entrada (Aporte / Reforço)
                </Button>
                <Button
                  type="button"
                  variant={formType === "saida" ? "default" : "outline"}
                  className={`h-9 text-xs font-medium justify-center gap-1.5 ${
                    formType === "saida" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                  }`}
                  onClick={() => {
                    setFormType("saida");
                    setFormCategory("insumos");
                  }}
                >
                  <ArrowDownRight className="size-3.5" />
                  Saída (Despesa / Sangria)
                </Button>
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Categoria</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-ring"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as CashFlowCategory)}
              >
                {formType === "entrada" ? (
                  <>
                    <option value="suprimento">Suprimento de Troco / Reforço de Gaveta</option>
                    <option value="outros">Outras Entradas / Aportes</option>
                  </>
                ) : (
                  <>
                    <option value="sangria">Sangria de Caixa (Retirada para cofre / banco)</option>
                    <option value="insumos">
                      Compra de Insumos / Emergência (Gelo, gás, hortifruti)
                    </option>
                    <option value="pessoal_extra">
                      Diária de Extra / Freelancer (Garçom, cozinha)
                    </option>
                    <option value="manutencao">Manutenção & Reparos do Salão/Bar</option>
                    <option value="servicos">Serviços Operacionais / Entregadores</option>
                    <option value="outros">Outras Despesas</option>
                  </>
                )}
              </select>
            </div>

            {/* Valor (R$) e Meio de Pagamento */}
            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-xs font-semibold">Forma de Pagamento</Label>
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
                Turno Atual
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
                <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
                <p>Hora: {new Date().toLocaleTimeString("pt-BR")}</p>
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
                Saídas e Deduções do Turno
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
                  Resultado Líquido do Turno:
                </p>
                <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                  Lucro operacional disponível
                </p>
              </div>
              <span className="text-lg font-extrabold text-emerald-950 dark:text-emerald-100">
                {formatBRL(kpis.saldoOperacional)}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsReportOpen(false)}>
              Fechar
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                toast.success("Relatório pronto para conferência e impressão.");
                window.print();
              }}
            >
              <Printer className="size-3.5" />
              Imprimir Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalhes de Lançamento */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Detalhes da Movimentação</DialogTitle>
            <DialogDescription>Informações completas registradas no livro caixa.</DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">ID do Registro:</span>
                  <span className="font-mono">{selectedEntry.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Data e Horário:</span>
                  <span>{new Date(selectedEntry.timestamp).toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge
                    variant="outline"
                    className={
                      selectedEntry.type === "entrada"
                        ? "text-emerald-600 border-emerald-500/30"
                        : "text-rose-600 border-rose-500/30"
                    }
                  >
                    {selectedEntry.type === "entrada" ? "Entrada (+)" : "Saída (-)"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Categoria:</span>
                  <span className="font-semibold">
                    {CASH_FLOW_CATEGORY_LABEL[selectedEntry.category] ?? selectedEntry.category}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Forma de Pagamento:</span>
                  <span className="capitalize">{selectedEntry.method || "Outro"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Registrado por:</span>
                  <span className="font-medium">{selectedEntry.author}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border font-bold text-sm">
                  <span>Valor:</span>
                  <span
                    className={
                      selectedEntry.type === "entrada" ? "text-emerald-600" : "text-rose-600"
                    }
                  >
                    {selectedEntry.type === "entrada" ? "+ " : "- "}
                    {formatBRL(selectedEntry.amount)}
                  </span>
                </div>
              </div>

              <div>
                <p className="font-semibold text-muted-foreground">Descrição / Motivo:</p>
                <p className="text-foreground mt-0.5">{selectedEntry.description}</p>
              </div>

              {selectedEntry.notes && (
                <div>
                  <p className="font-semibold text-muted-foreground">Observações / Comprovante:</p>
                  <p className="text-foreground mt-0.5 italic">{selectedEntry.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button size="sm" onClick={() => setSelectedEntry(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
