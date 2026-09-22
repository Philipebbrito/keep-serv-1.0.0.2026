import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Landmark,
  Building2,
  Zap,
  Droplets,
  Wifi,
  FileSpreadsheet,
  CheckCheck,
  RefreshCw,
  Trash2,
  Edit3,
  Barcode,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBilling } from "@/state";
import {
  BILL_CATEGORY_CONFIG,
  BILL_STATUS_LABEL,
  type BillCategory,
  type BillItem,
  type BillStatus,
  type BillType,
  type NewBillInput,
  type Recurrence,
} from "@/domain";
import { cn } from "@/lib/utils";

function formatBRL(val: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ts));
}

function getCategoryIcon(cat: BillCategory) {
  switch (cat) {
    case "aluguel":
      return Building2;
    case "energia":
      return Zap;
    case "agua":
      return Droplets;
    case "internet_telefone":
      return Wifi;
    case "contabilidade":
      return FileSpreadsheet;
    case "folha_pagamento":
      return Briefcase;
    case "fornecedor_carnes":
    case "fornecedor_bebidas":
    case "fornecedor_insumos":
    case "fornecedor_embalagens":
      return Layers;
    case "recebivel_cartao":
    case "voucher_refeicao":
    case "evento_corporativo":
      return DollarSign;
    default:
      return Landmark;
  }
}

export function BillsManagement() {
  const {
    bills,
    bankAccounts,
    bankStatements,
    addBill,
    updateBill,
    deleteBill,
    payBill,
    reconcileBill,
    reconcileStatementItem,
    autoReconcileAll,
    resetBillsToDefault,
  } = useBilling();

  // Estados de navegação interna
  const [activeTab, setActiveTab] = useState<
    "todas" | "pagar" | "custos_fixos" | "receber" | "conciliacao"
  >("todas");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>("todas");

  // Modais
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [billToPay, setBillToPay] = useState<BillItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("transferencia");
  const [payAccount, setPayAccount] = useState("");
  const [syncWithCashFlow, setSyncWithCashFlow] = useState(true);

  // Modal de edição/detalhes
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<BillItem | null>(null);

  // Formulário de Novo Lançamento
  const [newType, setNewType] = useState<BillType>("pagar");
  const [newTitle, setNewTitle] = useState("");
  const [newEntity, setNewEntity] = useState("");
  const [newDoc, setNewDoc] = useState("");
  const [newCategory, setNewCategory] = useState<BillCategory>("fornecedor_insumos");
  const [newIsFixed, setNewIsFixed] = useState(false);
  const [newRecurrence, setNewRecurrence] = useState<Recurrence>("nenhuma");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [newBarcode, setNewBarcode] = useState("");
  const [newBoletoBank, setNewBoletoBank] = useState("");
  const [newInvoice, setNewInvoice] = useState("");
  const [newAccount, setNewAccount] = useState(bankAccounts[0]?.name || "");
  const [newNotes, setNewNotes] = useState("");

  const now = Date.now();

  // Métricas Consolidadas
  const metrics = useMemo(() => {
    const pagarBills = bills.filter((b) => b.type === "pagar" && b.status !== "cancelado");
    const receberBills = bills.filter((b) => b.type === "receber" && b.status !== "cancelado");

    const totalPendentePagar = pagarBills
      .filter((b) => b.status === "pendente" || b.status === "agendado" || b.status === "vencido")
      .reduce((sum, b) => sum + b.amount, 0);

    const totalPendenteReceber = receberBills
      .filter((b) => b.status === "pendente" || b.status === "agendado")
      .reduce((sum, b) => sum + b.amount, 0);

    const vencidas = pagarBills.filter((b) => {
      if (b.status === "pago") return false;
      return b.status === "vencido" || b.dueDate < now;
    });

    const totalVencido = vencidas.reduce((sum, b) => sum + b.amount, 0);

    const conciliados = bills.filter((b) => b.conciliationStatus === "conciliado");
    const percConciliado =
      bills.length > 0 ? Math.round((conciliados.length / bills.length) * 100) : 0;

    return {
      totalPendentePagar,
      totalPendenteReceber,
      saldoProjetado: totalPendenteReceber - totalPendentePagar,
      vencidasCount: vencidas.length,
      totalVencido,
      percConciliado,
    };
  }, [bills, now]);

  // Lista filtrada
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      // Aba ativa
      if (activeTab === "pagar" && b.type !== "pagar") return false;
      if (activeTab === "receber" && b.type !== "receber") return false;
      if (activeTab === "custos_fixos" && (!b.isFixedCost || b.type !== "pagar")) return false;

      // Busca texto
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          b.title.toLowerCase().includes(q) ||
          b.entityName.toLowerCase().includes(q) ||
          (b.barcode && b.barcode.includes(q)) ||
          (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(q)) ||
          (b.boletoBank && b.boletoBank.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Filtro de status
      if (statusFilter !== "todos") {
        if (statusFilter === "vencido") {
          const isOverdue = b.status === "vencido" || (b.status !== "pago" && b.dueDate < now);
          if (!isOverdue) return false;
        } else if (b.status !== statusFilter) {
          return false;
        }
      }

      // Filtro de categoria
      if (categoryFilter !== "todas" && b.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [bills, activeTab, search, statusFilter, categoryFilter, now]);

  // Contas Bancárias e Extrato para Conciliação
  const filteredStatements = useMemo(() => {
    if (selectedBankFilter === "todas") return bankStatements;
    return bankStatements.filter((s) => s.bankAccount === selectedBankFilter);
  }, [bankStatements, selectedBankFilter]);

  const conciliationMetrics = useMemo(() => {
    const totalExtratos = bankStatements.length;
    const conciliados = bankStatements.filter((s) => s.conciliated).length;
    const pendentes = totalExtratos - conciliados;
    return { totalExtratos, conciliados, pendentes };
  }, [bankStatements]);

  // Ações de formulário
  const handleOpenAdd = (presetType: BillType = "pagar", isFixed = false) => {
    setNewType(presetType);
    setNewTitle("");
    setNewEntity("");
    setNewDoc("");
    setNewCategory(
      isFixed ? "aluguel" : presetType === "pagar" ? "fornecedor_insumos" : "recebivel_cartao",
    );
    setNewIsFixed(isFixed);
    setNewRecurrence(isFixed ? "mensal" : "nenhuma");
    setNewAmount("");
    const d = new Date();
    d.setDate(d.getDate() + (isFixed ? 10 : 5));
    setNewDueDate(d.toISOString().split("T")[0]);
    setNewBarcode("");
    setNewBoletoBank("");
    setNewInvoice("");
    setNewNotes("");
    setIsAddOpen(true);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newAmount.replace(",", "."));
    if (!newTitle.trim()) {
      toast.error("Informe a descrição do título.");
      return;
    }
    if (!newEntity.trim()) {
      toast.error("Informe o fornecedor ou cliente.");
      return;
    }
    if (isNaN(val) || val <= 0) {
      toast.error("Informe um valor válido em reais.");
      return;
    }

    const dueTimestamp = new Date(`${newDueDate}T12:00:00`).getTime();

    const input: NewBillInput = {
      type: newType,
      title: newTitle,
      entityName: newEntity,
      entityDocument: newDoc,
      category: newCategory,
      isFixedCost: newIsFixed,
      recurrence: newRecurrence,
      amount: val,
      dueDate: dueTimestamp,
      barcode: newBarcode,
      boletoBank: newBoletoBank,
      invoiceNumber: newInvoice,
      bankAccount: newAccount,
      notes: newNotes,
    };

    addBill(input);
    toast.success(
      `Título "${newTitle}" ${newType === "pagar" ? "agendado para pagamento" : "cadastrado para recebimento"} com sucesso!`,
    );
    setIsAddOpen(false);
  };

  const handleOpenPay = (bill: BillItem) => {
    setBillToPay(bill);
    setPayAmount(bill.amount.toString());
    setPayMethod(bill.barcode ? "boleto" : "transferencia");
    setPayAccount(bill.bankAccount || bankAccounts[0]?.name || "Itaú PJ - Operacional Principal");
    setSyncWithCashFlow(true);
    setIsPayOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!billToPay) return;
    const val = parseFloat(payAmount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Informe o valor liquidado.");
      return;
    }

    payBill(billToPay.id, {
      paidAmount: val,
      paidAt: Date.now(),
      paymentMethod: payMethod,
      bankAccount: payAccount,
      syncWithCashFlow,
    });

    toast.success(
      billToPay.type === "pagar"
        ? `Pagamento de ${formatBRL(val)} registrado com sucesso!`
        : `Recebimento de ${formatBRL(val)} registrado com sucesso!`,
    );
    setIsPayOpen(false);
    setBillToPay(null);
  };

  const handleCopyBarcode = (barcode?: string) => {
    if (!barcode) return;
    navigator.clipboard.writeText(barcode.replace(/\s+/g, ""));
    toast.success("Linha digitável copiada para a área de transferência!");
  };

  const handleAutoReconcile = () => {
    const res = autoReconcileAll();
    if (res.matchedCount > 0) {
      toast.success(res.message);
    } else {
      toast.info("Nenhum novo lançamento com valores coincidentes pendente de conciliação.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. CARDS DE INDICADORES / KPIS FINANCEIROS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* A Pagar */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Contas a Pagar
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              {formatBRL(metrics.totalPendentePagar)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Total previsto entre fornecedores, boletos e custos fixos.
          </p>
        </div>

        {/* A Receber */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Contas a Receber
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatBRL(metrics.totalPendenteReceber)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Repasses Stone, vouchers de refeição e banquetes a prazo.
          </p>
        </div>

        {/* Saldo Projetado */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Saldo Projetado
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Landmark className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={cn(
                "font-display text-2xl font-bold tracking-tight",
                metrics.saldoProjetado >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              {formatBRL(metrics.saldoProjetado)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Diferença prevista (A Receber − A Pagar pendentes).
          </p>
        </div>

        {/* Alertas & Conciliação */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {metrics.vencidasCount > 0 ? "Títulos Vencidos" : "Conciliação Bancária"}
            </span>
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                metrics.vencidasCount > 0
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse"
                  : "bg-teal-500/10 text-teal-600 dark:text-teal-400",
              )}
            >
              {metrics.vencidasCount > 0 ? (
                <AlertTriangle className="size-4" />
              ) : (
                <CheckCheck className="size-4" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {metrics.vencidasCount > 0 ? (
              <>
                <span className="font-display text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {metrics.vencidasCount}
                </span>
                <span className="text-xs text-rose-500 font-semibold">
                  ({formatBRL(metrics.totalVencido)})
                </span>
              </>
            ) : (
              <>
                <span className="font-display text-2xl font-bold tracking-tight text-foreground">
                  {metrics.percConciliado}%
                </span>
                <span className="text-xs text-muted-foreground">conciliado</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {metrics.vencidasCount > 0
              ? "Atenção: títulos com vencimento expirado necessitam baixa."
              : "Status de conciliação entre extrato e lançamentos."}
          </p>
        </div>
      </div>

      {/* 2. BARRA DE FERRAMENTAS E ABAS PRINCIPAIS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
        {/* Abas */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/50 p-1 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("todas")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "todas"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Todos os Títulos</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {bills.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pagar")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "pagar"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ArrowDownRight className="size-3.5 text-rose-500" />
            <span>Contas a Pagar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("custos_fixos")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "custos_fixos"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Building2 className="size-3.5 text-amber-500" />
            <span>Custos Fixos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("receber")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "receber"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ArrowUpRight className="size-3.5 text-emerald-500" />
            <span>Contas a Receber</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("conciliacao")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "conciliacao"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CheckCheck className="size-3.5" />
            <span>Conciliação Bancária</span>
            {bankStatements.some((s) => !s.conciliated) && (
              <span className="flex size-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "conciliacao" ? (
            <Button
              size="sm"
              onClick={handleAutoReconcile}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              <Sparkles className="size-3.5" />
              Conciliar em 1 Clique
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAdd("pagar", true)}
                className="gap-1.5 text-xs"
              >
                <Building2 className="size-3.5 text-amber-500" />
                Novo Custo Fixo
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenAdd("pagar", false)}
                className="gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                Agendar Conta
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 3. VISÃO DE CONCILIAÇÃO BANCÁRIA vs. LISTAGEM DE TÍTULOS */}
      {activeTab === "conciliacao" ? (
        <div className="space-y-6">
          {/* Card explicativo e contas bancárias cadastradas */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Landmark className="size-4.5 text-primary" />
                  Painel de Conciliação Bancária & Extratos
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Conferência automática e cruzamento entre movimentações bancárias (OFX/Extrato) e
                  os títulos registrados na loja.
                </p>
              </div>

              {/* Seletor de conta bancária */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Conta:</span>
                <Select value={selectedBankFilter} onValueChange={setSelectedBankFilter}>
                  <SelectTrigger className="h-8 text-xs w-[240px]">
                    <SelectValue placeholder="Todas as Contas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Contas Conectadas</SelectItem>
                    {bankAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.name}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid das Contas Conectadas */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              {bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="rounded-xl border border-border/60 bg-muted/30 p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {acc.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-mono px-1.5 py-0"
                    >
                      {acc.type}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground font-mono">
                    <p>Banco: {acc.bank}</p>
                    <p>
                      Ag: {acc.agency} · CC: {acc.account}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extrato Bancário para Conciliar */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  Lançamentos do Extrato Bancário
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {conciliationMetrics.conciliados} de {conciliationMetrics.totalExtratos} itens
                  conciliados com comprovante contábil.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoReconcile}
                className="gap-1.5 text-xs text-primary font-semibold"
              >
                <Sparkles className="size-3.5" />
                Auto-Conciliar
              </Button>
            </div>

            <div className="divide-y divide-border/60">
              {filteredStatements.map((stmt) => {
                const isCredit = stmt.amount > 0;
                const matchedBill = stmt.matchedBillId
                  ? bills.find((b) => b.id === stmt.matchedBillId)
                  : null;

                return (
                  <div
                    key={stmt.id}
                    className={cn(
                      "p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                      stmt.conciliated ? "bg-muted/10" : "bg-card hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl",
                          isCredit
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {isCredit ? (
                          <ArrowUpRight className="size-4.5" />
                        ) : (
                          <ArrowDownRight className="size-4.5" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {stmt.description}
                          </span>
                          {stmt.conciliated ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0 text-[10px] font-semibold gap-1">
                              <CheckCircle2 className="size-3" />
                              Conciliado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-amber-500 border-amber-500/30 text-[10px]"
                            >
                              Pendente
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-mono">
                          <span>Data: {formatDate(stmt.date)}</span>
                          <span>·</span>
                          <span>Conta: {stmt.bankAccount}</span>
                          {stmt.documentNumber && (
                            <>
                              <span>·</span>
                              <span>Doc: {stmt.documentNumber}</span>
                            </>
                          )}
                          {matchedBill && (
                            <>
                              <span>·</span>
                              <span className="text-foreground font-sans font-medium">
                                Vinculado a: {matchedBill.title} ({matchedBill.entityName})
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <span
                        className={cn(
                          "font-mono font-bold text-base",
                          isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                        )}
                      >
                        {isCredit ? "+" : ""}
                        {formatBRL(stmt.amount)}
                      </span>

                      {!stmt.conciliated ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            reconcileStatementItem(stmt.id);
                            toast.success("Lançamento do extrato conciliado manualmente!");
                          }}
                          className="h-8 text-xs font-semibold gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        >
                          <CheckCheck className="size-3.5" />
                          Conciliar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">✓ Batido</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 4. LISTAGEM GERAL DE CONTAS A PAGAR & RECEBER COM FILTROS */
        <div className="space-y-4">
          {/* Barra de Filtro e Busca */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Buscar por fornecedor, boleto, descrição ou nota fiscal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-xs border-0 shadow-none focus-visible:ring-0 bg-transparent px-1"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs text-muted-foreground hover:text-foreground mr-1"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-[140px]">
                  <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">A Vencer</SelectItem>
                  <SelectItem value="agendado">Agendados (DDA)</SelectItem>
                  <SelectItem value="pago">Liquidados</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Categoria */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 text-xs w-[180px]">
                  <SlidersHorizontal className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Categorias</SelectItem>
                  <SelectItem value="fornecedor_carnes">Fornecedor: Carnes</SelectItem>
                  <SelectItem value="fornecedor_bebidas">Fornecedor: Bebidas</SelectItem>
                  <SelectItem value="fornecedor_insumos">Fornecedor: Insumos</SelectItem>
                  <SelectItem value="fornecedor_embalagens">Fornecedor: Embalagens</SelectItem>
                  <SelectItem value="aluguel">Aluguel Imóvel</SelectItem>
                  <SelectItem value="energia">Energia Elétrica</SelectItem>
                  <SelectItem value="agua">Água & Esgoto</SelectItem>
                  <SelectItem value="internet_telefone">Internet & Telecom</SelectItem>
                  <SelectItem value="contabilidade">Contabilidade</SelectItem>
                  <SelectItem value="recebivel_cartao">Repasse de Cartão</SelectItem>
                  <SelectItem value="evento_corporativo">Eventos / Banquetes</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={resetBillsToDefault}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                title="Restaurar lançamentos padrão de demonstração"
              >
                <RefreshCw className="size-3.5 mr-1" />
                Restaurar
              </Button>
            </div>
          </div>

          {/* Tabela / Lista de Títulos */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            {filteredBills.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <CalendarClock className="size-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    Nenhum lançamento encontrado
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tente ajustar seus filtros ou cadastre um novo título a pagar/receber.
                  </p>
                </div>
                <Button size="sm" onClick={() => handleOpenAdd("pagar")} className="text-xs">
                  <Plus className="size-3.5 mr-1.5" />
                  Cadastrar Título
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredBills.map((bill) => {
                  const isExpense = bill.type === "pagar";
                  const CatIcon = getCategoryIcon(bill.category);
                  const isOverdue =
                    bill.status !== "pago" && (bill.status === "vencido" || bill.dueDate < now);
                  const isDueToday =
                    bill.status !== "pago" &&
                    new Date(bill.dueDate).toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={bill.id}
                      className={cn(
                        "p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4",
                        isOverdue ? "bg-rose-500/5 hover:bg-rose-500/10" : "hover:bg-muted/30",
                      )}
                    >
                      {/* Lado Esquerdo: Ícone + Detalhes do Título */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-xl",
                            isExpense
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          <CatIcon className="size-5" />
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-foreground truncate">
                              {bill.title}
                            </span>

                            {/* Badge Custo Fixo */}
                            {bill.isFixedCost && (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold"
                              >
                                Custo Fixo ({bill.recurrence})
                              </Badge>
                            )}

                            {/* Badge Categoria */}
                            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                              {BILL_CATEGORY_CONFIG[bill.category]?.label || bill.category}
                            </span>

                            {/* Badge Status */}
                            {isOverdue ? (
                              <Badge variant="destructive" className="text-[10px] font-bold">
                                Vencido
                              </Badge>
                            ) : isDueToday ? (
                              <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                                Vence Hoje
                              </Badge>
                            ) : (
                              <Badge
                                variant={BILL_STATUS_LABEL[bill.status]?.variant || "secondary"}
                                className="text-[10px]"
                              >
                                {BILL_STATUS_LABEL[bill.status]?.label || bill.status}
                              </Badge>
                            )}

                            {/* Status Conciliação */}
                            {bill.conciliationStatus === "conciliado" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCheck className="size-3.5" />
                                Conciliado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                                Não conciliado
                              </span>
                            )}
                          </div>

                          {/* Fornecedor / Cliente e Metadados */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{bill.entityName}</span>
                            {bill.entityDocument && <span>Doc: {bill.entityDocument}</span>}
                            {bill.invoiceNumber && <span>Doc/NF: {bill.invoiceNumber}</span>}
                            <span>·</span>
                            <span
                              className={cn(
                                "font-mono font-medium",
                                isOverdue ? "text-rose-600 font-bold" : "",
                              )}
                            >
                              Vencimento: {formatDate(bill.dueDate)}
                            </span>
                            {bill.bankAccount && (
                              <>
                                <span>·</span>
                                <span>Conta: {bill.bankAccount}</span>
                              </>
                            )}
                          </div>

                          {/* Se for boleto bancário: linha digitável e botão copiar */}
                          {bill.barcode && (
                            <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-1.5 border border-border/60">
                              <Barcode className="size-3.5 text-muted-foreground" />
                              <span className="text-[11px] font-mono text-muted-foreground tracking-wider">
                                {bill.boletoBank ? `${bill.boletoBank} · ` : ""}
                                {bill.barcode}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyBarcode(bill.barcode)}
                                className="h-6 px-2 text-[10px] font-semibold text-primary hover:text-primary gap-1"
                              >
                                <Copy className="size-3" />
                                Copiar Linha
                              </Button>
                            </div>
                          )}

                          {bill.notes && (
                            <p className="text-[11px] text-muted-foreground italic">
                              Obs: {bill.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lado Direito: Valores & Ações */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
                        <div className="text-left lg:text-right">
                          <span
                            className={cn(
                              "font-display text-lg font-bold block leading-tight",
                              isExpense
                                ? "text-foreground"
                                : "text-emerald-600 dark:text-emerald-400",
                            )}
                          >
                            {isExpense ? "-" : "+"}
                            {formatBRL(bill.amount)}
                          </span>
                          {bill.status === "pago" && bill.paidAt && (
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              Liquidado em {formatDate(bill.paidAt)}
                            </span>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-1.5">
                          {bill.status !== "pago" ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPay(bill)}
                              className={cn(
                                "h-8 text-xs font-semibold gap-1",
                                isExpense
                                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white",
                              )}
                            >
                              <CheckCircle2 className="size-3.5" />
                              {isExpense ? "Dar Baixa / Pagar" : "Confirmar Recebimento"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                reconcileBill(bill.id, bill.conciliationStatus !== "conciliado");
                                toast.success(
                                  bill.conciliationStatus === "conciliado"
                                    ? "Conciliação desfeita."
                                    : "Título marcado como conciliado!",
                                );
                              }}
                              className={cn(
                                "h-8 text-xs font-semibold gap-1",
                                bill.conciliationStatus === "conciliado"
                                  ? "text-muted-foreground"
                                  : "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10",
                              )}
                            >
                              <CheckCheck className="size-3.5" />
                              {bill.conciliationStatus === "conciliado"
                                ? "Desconciliar"
                                : "Conciliar"}
                            </Button>
                          )}

                          {/* Menu / Ação de Excluir */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Deseja excluir o título "${bill.title}"?`)) {
                                deleteBill(bill.id);
                                toast.success("Título excluído com sucesso.");
                              }
                            }}
                            className="size-8 text-muted-foreground hover:text-rose-500"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL DE CADASTRO / AGENDAMENTO DE NOVO TÍTULO */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={handleSaveNew} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                Agendar Novo Título Financeiro
              </DialogTitle>
              <DialogDescription className="text-xs">
                Cadastre contas a pagar para fornecedores, boletos, custos fixos ou previsões de
                recebimentos.
              </DialogDescription>
            </DialogHeader>

            {/* Alternador de Tipo */}
            <div className="grid grid-cols-2 gap-2 bg-muted/60 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => {
                  setNewType("pagar");
                  setNewCategory("fornecedor_insumos");
                }}
                className={cn(
                  "py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                  newType === "pagar"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ArrowDownRight className="size-3.5" />
                Conta a Pagar (Saída)
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewType("receber");
                  setNewCategory("recebivel_cartao");
                  setNewIsFixed(false);
                }}
                className={cn(
                  "py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                  newType === "receber"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ArrowUpRight className="size-3.5" />
                Conta a Receber (Entrada)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Título */}
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Descrição do Lançamento *</Label>
                <Input
                  placeholder="Ex: Fatura Frigorífico Boi Nobre, Aluguel Salão..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Favorecido / Fornecedor / Cliente */}
              <div className="space-y-1">
                <Label className="text-xs">
                  {newType === "pagar" ? "Fornecedor / Favorecido *" : "Cliente / Adquirente *"}
                </Label>
                <Input
                  placeholder="Ex: Enel, Ambev, Stone, Imobiliária..."
                  value={newEntity}
                  onChange={(e) => setNewEntity(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* CNPJ / CPF */}
              <div className="space-y-1">
                <Label className="text-xs">CNPJ ou CPF (Opcional)</Label>
                <Input
                  placeholder="00.000.000/0001-00"
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <Label className="text-xs">Categoria Financeira</Label>
                <Select
                  value={newCategory}
                  onValueChange={(val: BillCategory) => setNewCategory(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fornecedor_carnes">
                      Fornecedor: Carnes & Proteínas
                    </SelectItem>
                    <SelectItem value="fornecedor_bebidas">Fornecedor: Bebidas & Chopp</SelectItem>
                    <SelectItem value="fornecedor_insumos">Fornecedor: Insumos Gerais</SelectItem>
                    <SelectItem value="fornecedor_embalagens">Fornecedor: Embalagens</SelectItem>
                    <SelectItem value="aluguel">Aluguel do Imóvel</SelectItem>
                    <SelectItem value="energia">Energia Elétrica (Enel)</SelectItem>
                    <SelectItem value="agua">Água & Saneamento (Sabesp)</SelectItem>
                    <SelectItem value="internet_telefone">Internet & Telecomunicações</SelectItem>
                    <SelectItem value="contabilidade">Honorários Contábeis</SelectItem>
                    <SelectItem value="folha_pagamento">Folha de Pagamento</SelectItem>
                    <SelectItem value="manutencao">Manutenção & Reparos</SelectItem>
                    <SelectItem value="recebivel_cartao">Repasse Stone / Cartões</SelectItem>
                    <SelectItem value="voucher_refeicao">Repasse VR / Vouchers</SelectItem>
                    <SelectItem value="evento_corporativo">Eventos / Banquetes</SelectItem>
                    <SelectItem value="outro">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor */}
              <div className="space-y-1">
                <Label className="text-xs">Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="h-9 text-xs font-mono font-bold"
                  required
                />
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-1">
                <Label className="text-xs">Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Conta Bancária */}
              <div className="space-y-1">
                <Label className="text-xs">Conta Bancária de Liquidação</Label>
                <Select value={newAccount} onValueChange={setNewAccount}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.name}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custo Fixo Recorrente */}
              {newType === "pagar" && (
                <div className="sm:col-span-2 rounded-xl bg-muted/40 p-3 border border-border/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer">
                      Marcar como Custo Fixo Operacional
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Gera recorrência mensal (ex: aluguel, energia, contabilidade, internet).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={newIsFixed}
                    onChange={(e) => {
                      setNewIsFixed(e.target.checked);
                      if (e.target.checked) setNewRecurrence("mensal");
                    }}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </div>
              )}

              {/* Informações de Boleto Bancário (Opcional) */}
              <div className="sm:col-span-2 space-y-2 border-t border-border/60 pt-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Barcode className="size-4 text-primary" />
                  Dados do Boleto / Linha Digitável (Opcional)
                </Label>
                <Input
                  placeholder="34191.79001 01043.510047 91020.150008 5 95600000345000"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Banco Emissor (ex: Itaú, Bradesco)"
                    value={newBoletoBank}
                    onChange={(e) => setNewBoletoBank(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Número da NF-e / Pedido"
                    value={newInvoice}
                    onChange={(e) => setNewInvoice(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Observações Internas</Label>
                <Textarea
                  placeholder="Ex: Entrega confirmada na câmara fria, aprovação do gestor..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="font-semibold text-xs">
                Confirmar e Agendar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. MODAL DE LIQUIDAÇÃO / BAIXA DO TÍTULO */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="max-w-md">
          {billToPay && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  {billToPay.type === "pagar"
                    ? "Registrar Pagamento de Título"
                    : "Registrar Recebimento de Valor"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {billToPay.type === "pagar"
                    ? `Dando baixa na despesa para "${billToPay.entityName}".`
                    : `Confirmando o recebimento da receita de "${billToPay.entityName}".`}
                </DialogDescription>
              </DialogHeader>

              {/* Resumo do título */}
              <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Título:</span>
                  <span className="font-bold text-foreground truncate max-w-[220px]">
                    {billToPay.title}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Vencimento original:</span>
                  <span className="font-mono">{formatDate(billToPay.dueDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor original:</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatBRL(billToPay.amount)}
                  </span>
                </div>
              </div>

              {/* Campos de Quitação */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Valor Liquidado (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="h-9 text-xs font-mono font-bold text-base"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Método de Liquidação</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">
                        Transferência Bancária (TED/DOC)
                      </SelectItem>
                      <SelectItem value="pix">Pix Instantâneo</SelectItem>
                      <SelectItem value="boleto">Boleto Bancário Liquidado</SelectItem>
                      <SelectItem value="debito_automatico">Débito Automático</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro em Espécie (Caixa PDV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Conta Bancária Utilizada</Label>
                  <Select value={payAccount} onValueChange={setPayAccount}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.name}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sincronizar com Fluxo de Caixa */}
                <div className="rounded-xl bg-primary/5 p-3 border border-primary/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer">
                      Lançar no Fluxo de Caixa da Loja
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Cria automaticamente um lançamento no Fluxo de Caixa em tempo real.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={syncWithCashFlow}
                    onChange={(e) => setSyncWithCashFlow(e.target.checked)}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsPayOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmPayment}
                  className="font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Confirmar Baixa
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
