import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Filter,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Table2,
  Trash2,
  Users,
  Wrench,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TABLE_REASON_LABEL, orderTotal, type DiningTable, type TableStatusReason } from "@/domain";
import { cn } from "@/lib/utils";
import { useAuth, useOrders } from "@/state";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface TableManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TableManagementDialog({ open, onOpenChange }: TableManagementDialogProps) {
  const { session } = useAuth();
  const { tables, activeTables, orders, setTotalTables, toggleTableStatus, addTable, removeTable } =
    useOrders();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "occupied">(
    "all",
  );
  const [customTableCount, setCustomTableCount] = useState<string>("");
  const [newTableNumber, setNewTableNumber] = useState<string>("");
  const [newTableLabel, setNewTableLabel] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Modal / Confirmação de pausa temporária com motivo
  const [pauseTargetTable, setPauseTargetTable] = useState<DiningTable | null>(null);
  const [selectedReason, setSelectedReason] = useState<TableStatusReason>("manutencao");
  const [customReasonNote, setCustomReasonNote] = useState("");

  const roleName = session?.cargo || session?.role || "operador";
  const isGestor = roleName === "gestor" || session?.nivel === "dev";
  const isGarcom = roleName === "garcom";

  // Mapeamento de comandas abertas por mesa
  const activeOrdersByTable = useMemo(() => {
    const map = new Map<number, (typeof orders)[0]>();
    for (const ord of orders) {
      if (ord.status !== "pago") {
        map.set(ord.table, ord);
      }
    }
    return map;
  }, [orders]);

  const occupiedCount = activeOrdersByTable.size;
  const inactiveCount = tables.length - activeTables.length;
  const freeActiveCount = Math.max(0, activeTables.length - occupiedCount);

  // Lista filtrada
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const activeOrder = activeOrdersByTable.get(t.id);
      const isOccupied = !!activeOrder;

      if (filterStatus === "active" && !t.active) return false;
      if (filterStatus === "inactive" && t.active) return false;
      if (filterStatus === "occupied" && !isOccupied) return false;

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesNumber = String(t.id).includes(query);
        const matchesLabel = t.label?.toLowerCase().includes(query);
        const matchesReason = t.statusReason?.toLowerCase().includes(query);
        const matchesOrder = activeOrder?.code.toLowerCase().includes(query);
        if (!matchesNumber && !matchesLabel && !matchesReason && !matchesOrder) {
          return false;
        }
      }

      return true;
    });
  }, [tables, activeOrdersByTable, filterStatus, search]);

  const handleApplyCount = (countToApply?: number) => {
    const target = countToApply ?? parseInt(customTableCount, 10);
    if (isNaN(target) || target <= 0) return;
    setTotalTables(target);
    setCustomTableCount("");
  };

  const handleAddNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    const num = newTableNumber ? parseInt(newTableNumber, 10) : undefined;
    const res = addTable(num, newTableLabel.trim() || undefined);
    if (res.success) {
      setNewTableNumber("");
      setNewTableLabel("");
      setShowAddForm(false);
    }
  };

  const handleConfirmPause = () => {
    if (!pauseTargetTable) return;
    toggleTableStatus(pauseTargetTable.id, selectedReason, customReasonNote.trim() || undefined);
    setPauseTargetTable(null);
    setCustomReasonNote("");
    setSelectedReason("manutencao");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-5xl gap-0 overflow-hidden p-0">
          {/* Header */}
          <DialogHeader className="border-b border-border bg-muted/20 px-6 py-4 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <DialogTitle className="font-display text-2xl flex items-center gap-2">
                  <Table2 className="size-6 text-primary" />
                  Gerenciamento de Mesas do Salão
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground">
                  Altere a quantidade total de mesas no salão e gerencie quais mesas estão em
                  operação ou temporariamente interditadas.
                </DialogDescription>
              </div>

              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-1 font-medium"
              >
                Acesso Operacional: {isGestor ? "Gestor do Estabelecimento" : "Garçom do Salão"}
              </Badge>
            </div>
          </DialogHeader>

          <div className="max-h-[78vh] overflow-y-auto p-6 space-y-6">
            {/* 📊 Métricas Rápidas do Salão */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-xl border border-border bg-card p-3.5 text-center">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Cadastrado
                </span>
                <p className="font-display text-2xl font-bold mt-1 text-foreground">
                  {tables.length}
                </p>
                <span className="text-[10px] text-muted-foreground">mesas no sistema</span>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-center">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Em Operação
                </span>
                <p className="font-display text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">
                  {activeTables.length}
                </p>
                <span className="text-[10px] text-emerald-600/80">disponíveis p/ atendimento</span>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-center">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Fora de Operação
                </span>
                <p className="font-display text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">
                  {inactiveCount}
                </p>
                <span className="text-[10px] text-amber-600/80">pausadas/manutenção</span>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-center">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Ocupadas Agora
                </span>
                <p className="font-display text-2xl font-bold mt-1 text-primary">{occupiedCount}</p>
                <span className="text-[10px] text-muted-foreground">comandas em aberto</span>
              </div>

              <div className="rounded-xl border border-border bg-card p-3.5 text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Livres no Salão
                </span>
                <p className="font-display text-2xl font-bold mt-1 text-foreground">
                  {freeActiveCount}
                </p>
                <span className="text-[10px] text-muted-foreground">prontas para receber</span>
              </div>
            </div>

            {/* ⚙️ Bloco de Ajuste da Quantidade Total do Salão */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Wrench className="size-4 text-primary" />
                    Capacidade & Quantidade Total de Mesas
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Aumente ou diminua o número de mesas presentes no salão. Novas mesas são criadas
                    automaticamente ativas.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="gap-1.5 text-xs h-8"
                >
                  <Plus className="size-3.5 text-primary" />
                  {showAddForm ? "Cancelar Mesa Avulsa" : "Adicionar Mesa Avulsa"}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => handleApplyCount(Math.max(1, tables.length - 1))}
                    disabled={tables.length <= 1}
                    title="Diminuir 1 mesa"
                  >
                    <Minus className="size-3.5" />
                  </Button>

                  <div className="px-3 py-1 rounded-md bg-muted font-mono font-bold text-sm min-w-14 text-center">
                    {tables.length}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => handleApplyCount(tables.length + 1)}
                    title="Adicionar 1 mesa"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
                  <span className="text-xs text-muted-foreground">Definir exato:</span>
                  <Input
                    type="number"
                    min={1}
                    max={150}
                    placeholder="Ex: 30"
                    value={customTableCount}
                    onChange={(e) => setCustomTableCount(e.target.value)}
                    className="h-8 w-20 text-xs text-center font-mono"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleApplyCount()}
                    disabled={!customTableCount}
                  >
                    Salvar
                  </Button>
                </div>

                {/* Presets comuns de restaurantes */}
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-[11px] text-muted-foreground mr-1 hidden md:inline">
                    Padrões rápidos:
                  </span>
                  {[12, 18, 24, 30, 40].map((preset) => (
                    <Button
                      key={preset}
                      variant={tables.length === preset ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => handleApplyCount(preset)}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Formulário retrátil para adicionar mesa avulsa específica */}
              {showAddForm && (
                <form
                  onSubmit={handleAddNewTable}
                  className="rounded-lg border border-primary/20 bg-primary/5 p-3 mt-2 flex flex-wrap items-end gap-3"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Número da Mesa (opcional)</Label>
                    <Input
                      type="number"
                      placeholder={`Ex: ${Math.max(...tables.map((t) => t.id), 0) + 1}`}
                      value={newTableNumber}
                      onChange={(e) => setNewTableNumber(e.target.value)}
                      className="h-8 w-28 text-xs"
                    />
                  </div>

                  <div className="space-y-1 flex-1 min-w-[160px]">
                    <Label className="text-xs">Identificador / Nome (opcional)</Label>
                    <Input
                      placeholder="Ex: Mesa Bistrô 25, Varanda 3..."
                      value={newTableLabel}
                      onChange={(e) => setNewTableLabel(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <Button type="submit" size="sm" className="h-8 text-xs gap-1.5">
                    <Plus className="size-3.5" />
                    Criar Mesa
                  </Button>
                </form>
              )}
            </div>

            {/* 🔍 Filtros e Busca de Mesas */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant={filterStatus === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 text-xs font-medium"
                  onClick={() => setFilterStatus("all")}
                >
                  Todas ({tables.length})
                </Button>
                <Button
                  variant={filterStatus === "active" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  onClick={() => setFilterStatus("active")}
                >
                  Em Operação ({activeTables.length})
                </Button>
                <Button
                  variant={filterStatus === "inactive" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 text-xs font-medium text-amber-700 dark:text-amber-400"
                  onClick={() => setFilterStatus("inactive")}
                >
                  Fora de Operação ({inactiveCount})
                </Button>
                <Button
                  variant={filterStatus === "occupied" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 text-xs font-medium text-primary"
                  onClick={() => setFilterStatus("occupied")}
                >
                  Ocupadas ({occupiedCount})
                </Button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Buscar por número ou motivo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* 📋 Grid de Mesas */}
            {filteredTables.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-2">
                <Table2 className="size-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">Nenhuma mesa encontrada</p>
                <p className="text-xs text-muted-foreground">
                  Ajuste o filtro acima ou pesquise por outro termo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredTables.map((t) => {
                  const activeOrder = activeOrdersByTable.get(t.id);
                  const isOccupied = !!activeOrder;

                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "rounded-xl border p-4 flex flex-col justify-between transition-all bg-card shadow-2xs",
                        t.active
                          ? isOccupied
                            ? "border-primary/40 ring-1 ring-primary/20"
                            : "border-border hover:border-border/80"
                          : "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/15",
                      )}
                    >
                      <div>
                        {/* Top row: Número da mesa e Badge de status */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "size-9 rounded-lg flex items-center justify-center font-display font-bold text-sm",
                                t.active
                                  ? isOccupied
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-primary/10 text-primary"
                                  : "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                              )}
                            >
                              {t.id}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-foreground">
                                {t.label || `Mesa ${t.id}`}
                              </h4>
                              <span className="text-[10px] text-muted-foreground">
                                {isOccupied
                                  ? "Comanda ativa"
                                  : t.active
                                    ? "Livre no salão"
                                    : "Pausada"}
                              </span>
                            </div>
                          </div>

                          {t.active ? (
                            isOccupied ? (
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/30 text-[10px]"
                              >
                                #{activeOrder.code}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]"
                              >
                                Em Operação
                              </Badge>
                            )
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold"
                            >
                              Fora de Operação
                            </Badge>
                          )}
                        </div>

                        {/* Detalhes de status */}
                        {t.active ? (
                          isOccupied ? (
                            <div className="rounded-lg bg-muted/40 p-2.5 my-2 space-y-1 text-xs">
                              <div className="flex justify-between items-center text-muted-foreground">
                                <span>Garçom:</span>
                                <span className="font-semibold text-foreground">
                                  {activeOrder.waiter}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-muted-foreground">
                                <span>Consumo:</span>
                                <span className="font-mono font-bold text-primary">
                                  {brl(orderTotal(activeOrder))}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2.5 text-xs text-muted-foreground flex items-center gap-1.5">
                              <CheckCircle2 className="size-3.5 text-emerald-600" />
                              <span>Pronta para abrir novos pedidos</span>
                            </div>
                          )
                        ) : (
                          <div className="rounded-lg bg-amber-500/10 p-2.5 my-2 space-y-1 text-xs border border-amber-500/20">
                            <div className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300">
                              <Ban className="size-3" />
                              <span>
                                {t.statusReason
                                  ? TABLE_REASON_LABEL[t.statusReason as TableStatusReason] ||
                                    t.statusReason
                                  : "Interditada Temporariamente"}
                              </span>
                            </div>
                            {t.customReason && (
                              <p className="text-[11px] text-muted-foreground italic">
                                "{t.customReason}"
                              </p>
                            )}
                            {isOccupied && (
                              <p className="text-[10px] font-medium text-amber-600 mt-1">
                                ⚠️ Atenção: Há comanda em andamento (#{activeOrder.code})
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Ações operacionais da mesa */}
                      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-1.5">
                        {t.active ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-7 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                            onClick={() => {
                              setPauseTargetTable(t);
                              setSelectedReason("manutencao");
                            }}
                            title="Retirar temporariamente esta mesa da operação"
                          >
                            <Ban className="size-3 mr-1" />
                            Pausar / Interditar
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="flex-1 text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            onClick={() => toggleTableStatus(t.id)}
                            title="Reativar mesa para novos pedidos"
                          >
                            <CheckCircle2 className="size-3 mr-1" />
                            Reativar Mesa
                          </Button>
                        )}

                        {/* Excluir mesa (apenas se não tiver comanda aberta) */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          disabled={isOccupied}
                          onClick={() => removeTable(t.id)}
                          title={
                            isOccupied
                              ? "Não é possível remover mesa com comanda aberta"
                              : "Excluir esta mesa do salão"
                          }
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo auxiliar para pausar mesa e registrar o motivo */}
      <Dialog open={!!pauseTargetTable} onOpenChange={(o) => !o && setPauseTargetTable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Ban className="size-5 text-amber-500" />
              Pausar Mesa {pauseTargetTable?.id} da Operação
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ao pausar esta mesa, os clientes não poderão abrir novas comandas através do QR Code
              até que a mesa seja reativada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Motivo da Interdição / Pausa</Label>
              <Select
                value={selectedReason}
                onValueChange={(v) => setSelectedReason(v as TableStatusReason)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manutencao">Em Manutenção / Cadeira quebrada</SelectItem>
                  <SelectItem value="juntada">Juntada a outra mesa (Grupo grande)</SelectItem>
                  <SelectItem value="reservada">Reservada para Evento / Aniversário</SelectItem>
                  <SelectItem value="avaria">Avaria ou Limpeza Pesada</SelectItem>
                  <SelectItem value="outro">Outro Motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observação complementar (opcional)</Label>
              <Input
                placeholder="Ex: Juntada com a Mesa 4 para grupo de 10 pessoas"
                value={customReasonNote}
                onChange={(e) => setCustomReasonNote(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setPauseTargetTable(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleConfirmPause}
            >
              <Ban className="size-3.5" />
              Confirmar Pausa da Mesa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
