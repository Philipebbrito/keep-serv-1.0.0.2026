import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  History,
  Package,
  PackageMinus,
  PackagePlus,
  PackageSearch,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
  Wine,
  Beef,
  Info,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMenu, useStock } from "@/state";
import {
  STOCK_TYPE_LABEL,
  type NewStockItemInput,
  type StockItem,
  type StockItemType,
} from "@/domain";
import { cn } from "@/lib/utils";

export function StockManagement() {
  const {
    stockItems,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    adjustStockItem,
    resetStockToDefault,
  } = useStock();
  const { products } = useMenu();

  // Filtros
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"todos" | StockItemType>("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | "baixo" | "esgotado" | "normal">(
    "todos",
  );

  // Modais
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [movementItem, setMovementItem] = useState<StockItem | null>(null);
  const [movementType, setMovementType] = useState<"entrada" | "saida" | "ajuste">("entrada");
  const [movementQty, setMovementQty] = useState("10");
  const [movementReason, setMovementReason] = useState("");
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);

  // Formulário de Criação/Edição
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<StockItemType>("materia_prima");
  const [formStock, setFormStock] = useState("10");
  const [formMinStock, setFormMinStock] = useState("3");
  const [formUnit, setFormUnit] = useState("kg");
  const [formCostPrice, setFormCostPrice] = useState("0,00");
  const [formSupplier, setFormSupplier] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Estatísticas de Estoque
  const stats = useMemo(() => {
    const totalItems = stockItems.length;
    let readyItemsCount = 0;
    let rawMaterialsCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalEstimatedCost = 0;

    for (const item of stockItems) {
      if (item.type === "pronto_consumo") readyItemsCount++;
      if (item.type === "materia_prima") rawMaterialsCount++;

      if (item.currentStock <= 0) {
        outOfStockCount++;
      } else if (item.currentStock <= item.minStock) {
        lowStockCount++;
      }

      totalEstimatedCost += item.currentStock * (item.costPrice || 0);
    }

    return {
      totalItems,
      readyItemsCount,
      rawMaterialsCount,
      lowStockCount,
      outOfStockCount,
      totalEstimatedCost,
    };
  }, [stockItems]);

  // Lista Filtrada
  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      if (typeFilter !== "todos" && item.type !== typeFilter) return false;

      if (statusFilter === "esgotado" && item.currentStock > 0) return false;
      if (statusFilter === "baixo" && (item.currentStock <= 0 || item.currentStock > item.minStock))
        return false;
      if (statusFilter === "normal" && item.currentStock <= item.minStock) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSupplier = item.supplier?.toLowerCase().includes(q) || false;
        const matchesUnit = item.unit.toLowerCase().includes(q);
        if (!matchesName && !matchesSupplier && !matchesUnit) return false;
      }

      return true;
    });
  }, [stockItems, typeFilter, statusFilter, search]);

  const openAddModal = () => {
    setFormName("");
    setFormType("materia_prima");
    setFormStock("10");
    setFormMinStock("3");
    setFormUnit("kg");
    setFormCostPrice("0,00");
    setFormSupplier("");
    setFormNotes("");
    setFormError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (item: StockItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormType(item.type);
    setFormStock(item.currentStock.toString());
    setFormMinStock(item.minStock.toString());
    setFormUnit(item.unit);
    setFormCostPrice(item.costPrice.toFixed(2).replace(".", ","));
    setFormSupplier(item.supplier || "");
    setFormNotes(item.notes || "");
    setFormError(null);
  };

  const openMovementModal = (item: StockItem, type: "entrada" | "saida" | "ajuste") => {
    setMovementItem(item);
    setMovementType(type);
    setMovementQty(
      type === "entrada" ? "10" : type === "saida" ? "1" : item.currentStock.toString(),
    );
    setMovementReason("");
  };

  const handleSaveItem = () => {
    setFormError(null);
    if (!formName.trim()) {
      setFormError("Informe o nome do item de estoque.");
      return;
    }

    const cleanCost = Number(formCostPrice.replace(/\./g, "").replace(",", ".")) || 0;
    const stockVal = Number(formStock.replace(",", ".")) || 0;
    const minStockVal = Number(formMinStock.replace(",", ".")) || 0;

    if (editingItem) {
      updateStockItem(editingItem.id, {
        name: formName.trim(),
        type: formType,
        currentStock: Math.max(0, stockVal),
        minStock: Math.max(0, minStockVal),
        unit: formUnit.trim() || "un",
        costPrice: Math.max(0, cleanCost),
        supplier: formSupplier.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      toast.success("Item de estoque atualizado com sucesso!");
      setEditingItem(null);
    } else {
      const input: NewStockItemInput = {
        name: formName.trim(),
        type: formType,
        currentStock: Math.max(0, stockVal),
        minStock: Math.max(0, minStockVal),
        unit: formUnit.trim() || "un",
        costPrice: Math.max(0, cleanCost),
        supplier: formSupplier.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };
      addStockItem(input);
      toast.success("Item de estoque cadastrado com sucesso!");
      setIsAddOpen(false);
    }
  };

  const handleConfirmMovement = () => {
    if (!movementItem) return;
    const qty = Number(movementQty.replace(",", "."));
    if (isNaN(qty) || qty <= 0) {
      toast.error("Informe uma quantidade válida maior que zero.");
      return;
    }

    adjustStockItem(
      movementItem.id,
      qty,
      movementReason.trim() ||
        (movementType === "entrada"
          ? "Entrada de mercadoria"
          : movementType === "saida"
            ? "Baixa de perda / avaria"
            : "Ajuste manual de balanço"),
      movementType,
    );

    const actionText =
      movementType === "entrada"
        ? `Adicionadas +${qty} ${movementItem.unit}`
        : movementType === "saida"
          ? `Baixa de -${qty} ${movementItem.unit}`
          : `Estoque ajustado para ${qty} ${movementItem.unit}`;

    toast.success(`${actionText} em "${movementItem.name}".`);
    setMovementItem(null);
  };

  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    const res = deleteStockItem(itemToDelete.id);
    if (!res.success) {
      toast.error(res.message || "Não foi possível excluir o item.");
    } else {
      toast.success(`Item "${itemToDelete.name}" removido do estoque.`);
      setItemToDelete(null);
    }
  };

  // Identifica produtos do cardápio vinculados a este item de estoque
  const getLinkedProductsCount = (stockId: string) => {
    return products.filter(
      (p) =>
        (p.stockConsumption === "direct" && p.linkedStockItemId === stockId) ||
        (p.stockConsumption === "recipe" &&
          p.recipeIngredients?.some((ing) => ing.stockItemId === stockId)),
    );
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO ESTOQUE */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Boxes className="size-6 text-primary" />
              Estoque & Almoxarifado
            </h2>
            <Badge variant="outline" className="text-xs font-normal">
              Separação de Matéria-Prima & Consumo Direto
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Gerencie o almoxarifado do bar e cozinha de forma independente do cardápio. Cadastre
            matérias-primas para produção e produtos prontos para consumo com registro detalhado de
            entradas e saídas automáticas por comandas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (
                confirm(
                  "Deseja redefinir o catálogo de estoque para os dados padrões de demonstração?",
                )
              ) {
                resetStockToDefault();
                toast.info("Estoque redefinido para o padrão.");
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground h-9"
          >
            <RotateCcw className="size-3.5 mr-1.5" />
            Redefinir Estoque
          </Button>

          <Button
            onClick={openAddModal}
            size="sm"
            className="text-xs font-semibold bg-primary text-primary-foreground h-9 shadow-sm"
          >
            <Plus className="size-4 mr-1.5" />
            Novo Item de Estoque
          </Button>
        </div>
      </div>

      {/* MÉTRICAS EM DESTAQUE */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Total de Itens</span>
            <Package className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{stats.totalItems}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Cadastrados no sistema</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Prontos p/ Consumo</span>
            <Wine className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {stats.readyItemsCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Bebidas e produtos acabados</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Matéria-Prima</span>
            <Beef className="size-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {stats.rawMaterialsCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Insumos da cozinha/bar</p>
        </div>

        <div
          className={cn(
            "rounded-xl border p-4 shadow-xs transition-colors",
            stats.lowStockCount > 0
              ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
              : "bg-card",
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Estoque Baixo</span>
            <AlertTriangle
              className={cn(
                "size-4",
                stats.lowStockCount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            />
          </div>
          <p className="text-2xl font-bold tracking-tight">{stats.lowStockCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Abaixo do mínimo definido</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">Custo Estimado</span>
            <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
            R${" "}
            {stats.totalEstimatedCost.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Valor em mercadoria estocada</p>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do insumo, fornecedor ou unidade..."
            className="pl-9 h-9 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Tipo */}
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTypeFilter("todos")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                typeFilter === "todos"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Todos ({stockItems.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("pronto_consumo")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                typeFilter === "pronto_consumo"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Wine className="size-3 text-amber-500" />
              Prontos p/ Consumo
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("materia_prima")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                typeFilter === "materia_prima"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Beef className="size-3 text-indigo-500" />
              Matéria-Prima
            </button>
          </div>

          {/* Filtro por Situação */}
          <Select
            value={statusFilter}
            onValueChange={(val: "todos" | "baixo" | "esgotado" | "normal") => setStatusFilter(val)}
          >
            <SelectTrigger className="w-[145px] h-9 text-xs">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="baixo">⚠️ Estoque Baixo</SelectItem>
              <SelectItem value="esgotado">🚫 Esgotado</SelectItem>
              <SelectItem value="normal">✅ Regular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* LISTAGEM DE ITENS DE ESTOQUE */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold">Item & Descrição</th>
                <th className="py-3 px-3 font-semibold">Classificação</th>
                <th className="py-3 px-3 font-semibold text-right">Saldo Atual</th>
                <th className="py-3 px-3 font-semibold text-right">Estoque Mínimo</th>
                <th className="py-3 px-3 font-semibold text-right">Custo Unitário</th>
                <th className="py-3 px-3 font-semibold">Vínculo com Cardápio</th>
                <th className="py-3 px-4 font-semibold text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <PackageSearch className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium">Nenhum item de estoque encontrado.</p>
                    <p className="text-xs mt-1">Ajuste os filtros ou cadastre um novo item.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isOutOfStock = item.currentStock <= 0;
                  const isLowStock = !isOutOfStock && item.currentStock <= item.minStock;
                  const linkedProducts = getLinkedProductsCount(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isOutOfStock && "bg-rose-500/5",
                        isLowStock && "bg-amber-500/5",
                      )}
                    >
                      {/* Nome e Fornecedor */}
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{item.name}</span>
                          {item.supplier && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Truck className="size-3" />
                              {item.supplier}
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-[10px] text-muted-foreground/80 italic mt-0.5">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Classificação */}
                      <td className="py-3.5 px-3">
                        {item.type === "pronto_consumo" ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-medium py-0.5 px-2"
                          >
                            <Wine className="size-3 mr-1" />
                            Pronto p/ Consumo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-[10px] font-medium py-0.5 px-2"
                          >
                            <Beef className="size-3 mr-1" />
                            Matéria-Prima
                          </Badge>
                        )}
                      </td>

                      {/* Saldo Atual com Status */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              isOutOfStock
                                ? "text-rose-600 dark:text-rose-400"
                                : isLowStock
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-foreground",
                            )}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                          {isOutOfStock ? (
                            <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5">
                              🚫 Esgotado
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                              ⚠️ Reposição
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                              <CheckCircle2 className="size-2.5" /> Normal
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estoque Mínimo */}
                      <td className="py-3.5 px-3 text-right text-muted-foreground font-mono text-xs">
                        {item.minStock} {item.unit}
                      </td>

                      {/* Preço de Custo */}
                      <td className="py-3.5 px-3 text-right text-muted-foreground font-mono text-xs">
                        R$ {item.costPrice.toFixed(2).replace(".", ",")}
                      </td>

                      {/* Relação com Cardápio */}
                      <td className="py-3.5 px-3">
                        {linkedProducts.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground italic">
                            Sem produto vinculado
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 items-center">
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-normal py-0 px-1.5"
                              title={linkedProducts.map((p) => p.name).join(", ")}
                            >
                              {linkedProducts.length}{" "}
                              {linkedProducts.length === 1 ? "produto" : "produtos"} no cardápio
                            </Badge>
                          </div>
                        )}
                      </td>

                      {/* Ações Rápidas */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Entrada rápida */}
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Dar entrada / Repor mercadoria"
                            onClick={() => openMovementModal(item, "entrada")}
                          >
                            <PackagePlus className="size-3.5" />
                          </Button>

                          {/* Baixa rápida / Perda */}
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            title="Registrar baixa de perda ou ajuste manual"
                            onClick={() => openMovementModal(item, "saida")}
                          >
                            <PackageMinus className="size-3.5" />
                          </Button>

                          {/* Histórico */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            title="Ver histórico de movimentações"
                            onClick={() => setHistoryItem(item)}
                          >
                            <History className="size-3.5" />
                          </Button>

                          {/* Editar */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            title="Editar cadastro do item"
                            onClick={() => openEditModal(item)}
                          >
                            <Edit className="size-3.5" />
                          </Button>

                          {/* Excluir */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Excluir item de estoque"
                            onClick={() => setItemToDelete(item)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO / EDITAR ITEM DE ESTOQUE */}
      <Dialog
        open={isAddOpen || editingItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingItem(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Boxes className="size-5 text-primary" />
              {editingItem ? `Editar Item: ${editingItem.name}` : "Novo Item de Estoque"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure os detalhes cadastrais do item de estoque. Ele poderá ser consumido
              diretamente por bebidas/produtos acabados ou como insumo de pratos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-600 font-medium">
                {formError}
              </div>
            )}

            {/* Tipo de Item (Matéria-prima vs Pronto para Consumo) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Item de Estoque *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormType("materia_prima");
                    if (formUnit === "lata" || formUnit === "garrafa") setFormUnit("kg");
                  }}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-lg border text-xs transition-all",
                    formType === "materia_prima"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/40"
                      : "border-border text-muted-foreground hover:border-foreground/40",
                  )}
                >
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Beef className="size-3.5 text-indigo-500" />
                    Matéria-Prima / Insumo
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Carnes, farinhas, legumes, pães e ingredientes que não são prontos para consumo.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormType("pronto_consumo");
                    if (formUnit === "kg") setFormUnit("un");
                  }}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-lg border text-xs transition-all",
                    formType === "pronto_consumo"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/40"
                      : "border-border text-muted-foreground hover:border-foreground/40",
                  )}
                >
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Wine className="size-3.5 text-amber-500" />
                    Pronto para Consumo
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Bebidas, latas, garrafas, vinhos e itens que podem ser servidos diretamente.
                  </span>
                </button>
              </div>
            </div>

            {/* Nome do Item */}
            <div className="space-y-1.5">
              <Label htmlFor="stk-name" className="text-xs">
                Nome do Item *
              </Label>
              <Input
                id="stk-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={
                  formType === "materia_prima"
                    ? "Ex: Picanha Bovina Resfriada, Batata Congelada 9mm..."
                    : "Ex: Coca-Cola Lata 350ml, Cerveja IPA 473ml..."
                }
                className="h-9 text-xs"
              />
            </div>

            {/* Estoque Atual, Mínimo e Unidade */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="stk-curr" className="text-xs">
                  Estoque Atual
                </Label>
                <Input
                  id="stk-curr"
                  type="text"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="0"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stk-min" className="text-xs">
                  Estoque Mínimo
                </Label>
                <Input
                  id="stk-min"
                  type="text"
                  value={formMinStock}
                  onChange={(e) => setFormMinStock(e.target.value)}
                  placeholder="3"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stk-unit" className="text-xs">
                  Unidade
                </Label>
                <Select value={formUnit} onValueChange={setFormUnit}>
                  <SelectTrigger id="stk-unit" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">un (unidade)</SelectItem>
                    <SelectItem value="kg">kg (quilos)</SelectItem>
                    <SelectItem value="g">g (gramas)</SelectItem>
                    <SelectItem value="L">L (litros)</SelectItem>
                    <SelectItem value="ml">ml (mililitros)</SelectItem>
                    <SelectItem value="lata">lata</SelectItem>
                    <SelectItem value="garrafa">garrafa</SelectItem>
                    <SelectItem value="cx">cx (caixa)</SelectItem>
                    <SelectItem value="porção">porção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custo de Aquisição e Fornecedor */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="stk-cost" className="text-xs">
                  Custo Unitário (R$)
                </Label>
                <Input
                  id="stk-cost"
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(e.target.value)}
                  placeholder="0,00"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stk-supp" className="text-xs">
                  Fornecedor Principal
                </Label>
                <Input
                  id="stk-supp"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  placeholder="Ex: Frigorífico Boi Nobre, Ambev..."
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label htmlFor="stk-notes" className="text-xs">
                Observações de Armazenamento / Validade
              </Label>
              <Textarea
                id="stk-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Ex: Armazenar na câmara fria a 2°C, conferir lote semanalmente..."
                className="text-xs resize-none"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddOpen(false);
                setEditingItem(null);
              }}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveItem}
              className="text-xs font-semibold bg-primary text-primary-foreground"
            >
              {editingItem ? "Salvar Alterações" : "Cadastrar Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ENTRADA / SAÍDA / AJUSTE DE ESTOQUE */}
      <Dialog open={movementItem !== null} onOpenChange={(open) => !open && setMovementItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {movementType === "entrada" ? (
                <>
                  <PackagePlus className="size-5 text-emerald-600" />
                  Entrada de Mercadoria / Reposição
                </>
              ) : movementType === "saida" ? (
                <>
                  <PackageMinus className="size-5 text-amber-600" />
                  Registrar Baixa de Perda / Consumo
                </>
              ) : (
                <>
                  <SlidersHorizontal className="size-5 text-primary" />
                  Ajuste Manual de Balanço
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Item: <strong>{movementItem?.name}</strong> · Saldo atual:{" "}
              <strong>
                {movementItem?.currentStock} {movementItem?.unit}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {movementType === "entrada"
                  ? `Quantidade a adicionar (${movementItem?.unit}) *`
                  : movementType === "saida"
                    ? `Quantidade a dar baixa (${movementItem?.unit}) *`
                    : `Novo saldo exato (${movementItem?.unit}) *`}
              </Label>
              <Input
                type="text"
                value={movementQty}
                onChange={(e) => setMovementQty(e.target.value)}
                placeholder="0"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Motivo / Justificativa da Movimentação</Label>
              <Input
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder={
                  movementType === "entrada"
                    ? "Ex: Compra NF 1284, reposição distribuidora..."
                    : movementType === "saida"
                      ? "Ex: Validade vencida, garrafa avariada, descarte..."
                      : "Ex: Balanço semanal de contagem física..."
                }
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMovementItem(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmMovement}
              className={cn(
                "text-xs font-semibold",
                movementType === "entrada"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : movementType === "saida"
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-primary text-primary-foreground",
              )}
            >
              Confirmar Movimentação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: HISTÓRICO DE MOVIMENTAÇÕES DO ITEM */}
      <Dialog open={historyItem !== null} onOpenChange={(open) => !open && setHistoryItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <History className="size-5 text-primary" />
              Histórico de Movimentações: {historyItem?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registro cronológico de entradas de compras, saídas automáticas por pedidos em mesas e
              ajustes manuais.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[350px] overflow-y-auto space-y-2 py-2 pr-1">
            {!historyItem?.movements || historyItem.movements.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Nenhuma movimentação registrada ainda para este item.
              </div>
            ) : (
              historyItem.movements.map((mov) => (
                <div
                  key={mov.id}
                  className="rounded-lg border p-2.5 text-xs flex items-start justify-between bg-card/60 shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      {mov.type === "entrada" ? (
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <ArrowUpRight className="size-3" /> +{mov.quantity} {historyItem.unit}
                        </span>
                      ) : mov.type === "saida" ? (
                        <span className="font-bold text-rose-600 flex items-center gap-1">
                          <ArrowDownRight className="size-3" /> -{mov.quantity} {historyItem.unit}
                        </span>
                      ) : (
                        <span className="font-bold text-blue-600 flex items-center gap-1">
                          <SlidersHorizontal className="size-3" /> Ajuste: {mov.newStock}{" "}
                          {historyItem.unit}
                        </span>
                      )}
                      <span className="text-muted-foreground text-[10px]">
                        (Saldo: {mov.previousStock} → {mov.newStock})
                      </span>
                    </div>
                    <p className="text-foreground font-medium">{mov.reason}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>Responsável: {mov.author || "Sistema"}</span>
                      {mov.orderCode && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1">
                          {mov.orderCode}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(mov.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryItem(null)}
              className="text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      <Dialog open={itemToDelete !== null} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-rose-600 flex items-center gap-2">
              <Trash2 className="size-5" />
              Excluir Item de Estoque
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir o item <strong>"{itemToDelete?.name}"</strong>? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemToDelete(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteItem}
              className="text-xs font-semibold"
            >
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
