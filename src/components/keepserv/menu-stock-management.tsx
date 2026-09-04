import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Info,
  Layers,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  PackageX,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  UtensilsCrossed,
  X,
  Beer,
  Wine,
  Coffee,
  Cookie,
  Salad,
  Soup,
  Beef,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  type MenuItem,
  type NewProductInput,
} from "@/lib/keepserv/menu";
import { useKeepServ } from "@/lib/keepserv/store";
import type { OrderItem } from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

const HIGHLIGHT_LABELS: Record<
  NonNullable<MenuItem["highlight"]>,
  { label: string; style: string }
> = {
  mais_pedido: {
    label: "Mais Pedido",
    style: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  chef: {
    label: "Especial do Chef",
    style: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  },
  artesanal: {
    label: "Artesanal",
    style: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  vegetariano: {
    label: "Vegetariano",
    style: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
};

function getCategoryIcon(cat: OrderItem["category"], name: string) {
  const lower = name.toLowerCase();
  if (cat === "bebida") {
    if (lower.includes("chopp") || lower.includes("cerveja")) return Beer;
    if (lower.includes("vinho")) return Wine;
    if (lower.includes("café") || lower.includes("espresso")) return Coffee;
    return Wine;
  }
  if (cat === "sobremesa") {
    return Cookie;
  }
  if (cat === "entrada") {
    if (lower.includes("salada") || lower.includes("batata") || lower.includes("onion"))
      return Salad;
    return Soup;
  }
  if (
    lower.includes("carne") ||
    lower.includes("picanha") ||
    lower.includes("costela") ||
    lower.includes("hambúrguer")
  ) {
    return Beef;
  }
  return UtensilsCrossed;
}

export function MenuStockManagement() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    toggleProductActive,
    resetProductsToDefault,
  } = useKeepServ();

  // Filtros e busca
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [stockStatusFilter, setStockStatusFilter] = useState<
    "todos" | "baixo" | "esgotado" | "normal" | "inativo"
  >("todos");

  // Modais
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [restockProduct, setRestockProduct] = useState<MenuItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<MenuItem | null>(null);

  // Estados do formulário de criação/edição
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<OrderItem["category"]>("prato");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formServes, setFormServes] = useState("");
  const [formHighlight, setFormHighlight] = useState<string>("none");
  const [formUnit, setFormUnit] = useState("un");
  const [formTrackStock, setFormTrackStock] = useState(true);
  const [formStock, setFormStock] = useState("20");
  const [formMinStock, setFormMinStock] = useState("5");
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Estados do modal de reposição
  const [restockQty, setRestockQty] = useState("10");
  const [restockReason, setRestockReason] = useState("");

  // Métricas de estoque
  const stats = useMemo(() => {
    const totalItems = products.length;
    let activeCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockUnits = 0;
    let totalStockValue = 0;

    for (const p of products) {
      if (p.active) activeCount++;
      if (p.trackStock) {
        totalStockUnits += p.stock;
        totalStockValue += p.stock * p.price;
        if (p.stock <= 0) {
          outOfStockCount++;
        } else if (p.stock <= p.minStock) {
          lowStockCount++;
        }
      }
    }

    return {
      totalItems,
      activeCount,
      pausedCount: totalItems - activeCount,
      lowStockCount,
      outOfStockCount,
      totalStockUnits,
      totalStockValue,
    };
  }, [products]);

  // Lista filtrada
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Categoria
      if (categoryFilter !== "todos" && p.category !== categoryFilter) {
        return false;
      }

      // Status de estoque
      if (stockStatusFilter === "inativo" && p.active) return false;
      if (stockStatusFilter === "baixo") {
        if (!p.trackStock || p.stock > p.minStock || p.stock <= 0) return false;
      }
      if (stockStatusFilter === "esgotado") {
        if (!p.trackStock || p.stock > 0) return false;
      }
      if (stockStatusFilter === "normal") {
        if (!p.trackStock || p.stock <= p.minStock) return false;
      }

      // Busca textual
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q) || false;
        const matchesCat = CATEGORY_LABEL[p.category]?.toLowerCase().includes(q) || false;
        const matchesUnit = p.unit?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesDesc && !matchesCat && !matchesUnit) return false;
      }

      return true;
    });
  }, [products, categoryFilter, stockStatusFilter, search]);

  const openAddModal = () => {
    setFormName("");
    setFormCategory("prato");
    setFormPrice("");
    setFormDescription("");
    setFormServes("Individual");
    setFormHighlight("none");
    setFormUnit("porção");
    setFormTrackStock(true);
    setFormStock("20");
    setFormMinStock("5");
    setFormActive(true);
    setFormError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (p: MenuItem) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormPrice(p.price.toFixed(2).replace(".", ","));
    setFormDescription(p.description || "");
    setFormServes(p.serves || "");
    setFormHighlight(p.highlight || "none");
    setFormUnit(p.unit || "un");
    setFormTrackStock(p.trackStock);
    setFormStock(String(p.stock));
    setFormMinStock(String(p.minStock));
    setFormActive(p.active);
    setFormError(null);
  };

  const handleSaveProduct = () => {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError("Informe o nome do produto.");
      return;
    }

    const priceNum = parseFloat(formPrice.replace(/\./g, "").replace(",", "."));
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Informe um preço de venda válido (ex: 29,90).");
      return;
    }

    const stockNum = parseInt(formStock, 10);
    const minStockNum = parseInt(formMinStock, 10);

    const highlightVal =
      formHighlight !== "none" ? (formHighlight as MenuItem["highlight"]) : undefined;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: trimmedName,
        category: formCategory,
        price: priceNum,
        description: formDescription.trim() || undefined,
        serves: formServes.trim() || undefined,
        highlight: highlightVal,
        unit: formUnit.trim() || "un",
        trackStock: formTrackStock,
        stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
        minStock: isNaN(minStockNum) ? 5 : Math.max(0, minStockNum),
        active: formActive,
      });
      toast.success(`Produto "${trimmedName}" atualizado com sucesso!`);
      setEditingProduct(null);
    } else {
      addProduct({
        name: trimmedName,
        category: formCategory,
        price: priceNum,
        description: formDescription.trim() || undefined,
        serves: formServes.trim() || undefined,
        highlight: highlightVal,
        unit: formUnit.trim() || "un",
        trackStock: formTrackStock,
        stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
        minStock: isNaN(minStockNum) ? 5 : Math.max(0, minStockNum),
        active: formActive,
      });
      toast.success(`Produto "${trimmedName}" cadastrado no cardápio!`);
      setIsAddOpen(false);
    }
  };

  const handleConfirmRestock = () => {
    if (!restockProduct) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Informe uma quantidade válida para entrada de estoque.");
      return;
    }

    adjustStock(restockProduct.id, qty, "delta");
    toast.success(
      `Entrada de +${qty} ${restockProduct.unit || "un"} confirmada para "${restockProduct.name}"! Saldo atual: ${
        restockProduct.stock + qty
      }`,
    );
    setRestockProduct(null);
    setRestockQty("10");
    setRestockReason("");
  };

  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    deleteProduct(productToDelete.id);
    toast.success(`Produto "${productToDelete.name}" removido do cardápio.`);
    setProductToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header com Ações Rápidas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Cardápio & Controle de Estoque
            </h2>
            <Badge variant="outline" className="text-xs">
              {products.length} itens
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cadastre novos produtos, edite preços, pause vendas e monitore alertas de reposição em
            tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  "Deseja redefinir o cardápio para os itens padrão de demonstração? Alterações personalizadas serão substituídas.",
                )
              ) {
                resetProductsToDefault();
                toast.info("Cardápio restaurado para os itens originais do sistema.");
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Restaurar Padrões
          </Button>

          <Button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Cadastrar Produto
          </Button>
        </div>
      </div>

      {/* KPI Cards de Estoque */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total no Cardápio */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Itens Cadastrados</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stats.totalItems}</span>
            <span className="text-xs text-muted-foreground">
              ({stats.activeCount} ativos · {stats.pausedCount} pausados)
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Disponíveis em 4 categorias no salão</p>
        </div>

        {/* Estoque Baixo (Alerta Amarelo) */}
        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === "baixo" ? "todos" : "baixo")}
          className={cn(
            "rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md",
            stats.lowStockCount > 0
              ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500"
              : "border-border/80 bg-card",
            stockStatusFilter === "baixo" && "ring-2 ring-amber-500 ring-offset-1",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Estoque Crítico / Baixo
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {stats.lowStockCount}
            </span>
            <span className="text-xs text-muted-foreground">abaixo do mínimo</span>
          </div>
          <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
            {stats.lowStockCount > 0
              ? "Clique para filtrar itens a repor"
              : "Nenhum produto em alerta"}
          </p>
        </div>

        {/* Itens Esgotados (Alerta Vermelho) */}
        <div
          onClick={() =>
            setStockStatusFilter(stockStatusFilter === "esgotado" ? "todos" : "esgotado")
          }
          className={cn(
            "rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md",
            stats.outOfStockCount > 0
              ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500"
              : "border-border/80 bg-card",
            stockStatusFilter === "esgotado" && "ring-2 ring-rose-500 ring-offset-1",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
              Itens Esgotados
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <PackageX className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700 dark:text-rose-300">
              {stats.outOfStockCount}
            </span>
            <span className="text-xs text-muted-foreground">zerados</span>
          </div>
          <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-400/80">
            {stats.outOfStockCount > 0 ? "Exigem reposição urgente" : "Estoque 100% abastecido"}
          </p>
        </div>

        {/* Valor em Prateleira / Unidades Totais */}
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Valor em Prateleira</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              }).format(stats.totalStockValue)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.totalStockUnits} unidades/porções controladas
          </p>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Campo de Pesquisa */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do prato, bebida, ingrediente..."
            className="pl-9 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtros por Categoria & Estoque */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Categoria */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <Button
              variant={categoryFilter === "todos" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("todos")}
              className="text-xs h-8"
            >
              Todas ({products.length})
            </Button>
            {CATEGORY_ORDER.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className="text-xs h-8"
                >
                  {CATEGORY_LABEL[cat]} ({count})
                </Button>
              );
            })}
          </div>

          {/* Filtro de Estoque */}
          <Select
            value={stockStatusFilter}
            onValueChange={(val: "todos" | "baixo" | "esgotado" | "normal" | "inativo") =>
              setStockStatusFilter(val)
            }
          >
            <SelectTrigger className="w-[170px] h-8 text-xs">
              <SelectValue placeholder="Situação do Estoque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="baixo">⚠️ Estoque Baixo</SelectItem>
              <SelectItem value="esgotado">🚫 Esgotados</SelectItem>
              <SelectItem value="normal">✅ Estoque Normal</SelectItem>
              <SelectItem value="inativo">⏸️ Pausados no Cardápio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista / Grid de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Nenhum produto encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Tente ajustar a busca ou os filtros de categoria e estoque selecionados acima.
          </p>
          {(search || categoryFilter !== "todos" || stockStatusFilter !== "todos") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setCategoryFilter("todos");
                setStockStatusFilter("todos");
              }}
              className="mt-4 text-xs"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const Icon = getCategoryIcon(product.category, product.name);
            const isOutOfStock = product.trackStock && product.stock <= 0;
            const isLowStock =
              product.trackStock && product.stock > 0 && product.stock <= product.minStock;

            return (
              <div
                key={product.id}
                className={cn(
                  "flex flex-col justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/40",
                  !product.active && "opacity-60 bg-muted/30",
                  isOutOfStock && "border-rose-500/50 bg-rose-500/[0.02]",
                  isLowStock && "border-amber-500/50 bg-amber-500/[0.02]",
                )}
              >
                {/* Cabeçalho do Card */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                          product.category === "prato" &&
                            "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                          product.category === "entrada" &&
                            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                          product.category === "bebida" &&
                            "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
                          product.category === "sobremesa" &&
                            "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-semibold text-foreground text-sm truncate leading-tight">
                            {product.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {CATEGORY_LABEL[product.category]}
                          </span>
                          {product.serves && (
                            <>
                              <span className="text-[10px] text-muted-foreground/60">•</span>
                              <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                                {product.serves}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preço em destaque */}
                    <div className="text-right shrink-0">
                      <div className="font-bold text-foreground text-base">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(product.price)}
                      </div>
                    </div>
                  </div>

                  {/* Destaque comercial (Chef, Mais Pedido etc) */}
                  {product.highlight && HIGHLIGHT_LABELS[product.highlight] && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-2 py-0.5",
                          HIGHLIGHT_LABELS[product.highlight].style,
                        )}
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        {HIGHLIGHT_LABELS[product.highlight].label}
                      </Badge>
                    </div>
                  )}

                  {/* Descrição curta */}
                  {product.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Bloco Inferior: Estoque & Ações */}
                <div className="mt-4 pt-3 border-t border-border/70 space-y-3">
                  {/* Status do Estoque */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Estoque:</span>
                      {product.trackStock ? (
                        isOutOfStock ? (
                          <Badge
                            variant="destructive"
                            className="text-[11px] px-2 py-0.5 bg-rose-600"
                          >
                            Esgotado (0 {product.unit || "un"})
                          </Badge>
                        ) : isLowStock ? (
                          <Badge
                            variant="outline"
                            className="text-[11px] px-2 py-0.5 border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold"
                          >
                            ⚠️ Baixo ({product.stock} {product.unit || "un"} / min{" "}
                            {product.minStock})
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[11px] px-2 py-0.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          >
                            {product.stock} {product.unit || "un"} disponíveis
                          </Badge>
                        )
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-2 py-0.5 text-muted-foreground"
                        >
                          Livre / Sem controle
                        </Badge>
                      )}
                    </div>

                    {/* Toggle de Ativo no Cardápio */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {product.active ? "Visível" : "Pausado"}
                      </span>
                      <Switch
                        checked={product.active}
                        onCheckedChange={() => {
                          toggleProductActive(product.id);
                          toast.info(
                            product.active
                              ? `Produto "${product.name}" foi pausado do cardápio.`
                              : `Produto "${product.name}" agora está ativo no cardápio!`,
                          );
                        }}
                      />
                    </div>
                  </div>

                  {/* Barra de Ajuste de Estoque Rápido & Ações */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Botões de ajuste rápido -1 e +1 */}
                    {product.trackStock ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-xs"
                          disabled={product.stock <= 0}
                          onClick={() => {
                            adjustStock(product.id, -1, "delta");
                            toast.success(`Estoque de "${product.name}": ${product.stock - 1}`);
                          }}
                          title="Reduzir 1 unidade"
                        >
                          -1
                        </Button>
                        <span className="px-1.5 text-xs font-mono font-semibold text-foreground min-w-[28px] text-center">
                          {product.stock}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-xs"
                          onClick={() => {
                            adjustStock(product.id, 1, "delta");
                            toast.success(`Estoque de "${product.name}": ${product.stock + 1}`);
                          }}
                          title="Aumentar 1 unidade"
                        >
                          +1
                        </Button>

                        {/* Botão de Repor em lote */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRestockProduct(product);
                            setRestockQty("10");
                            setRestockReason("");
                          }}
                          className="h-7 text-xs px-2 ml-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <PackagePlus className="mr-1 h-3.5 w-3.5" />
                          Repor
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">
                        Não contabiliza porções
                      </span>
                    )}

                    {/* Ações de Edição e Exclusão */}
                    <div className="flex items-center gap-1 ml-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(product)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Editar dados e preço"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProductToDelete(product)}
                        className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        title="Excluir produto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CADASTRAR OU EDITAR PRODUTO */}
      <Dialog
        open={isAddOpen || !!editingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              {editingProduct ? "Editar Produto do Cardápio" : "Cadastrar Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do item, preço de venda, rendimento e regras de estoque.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Nome do Produto */}
            <div className="space-y-1.5">
              <Label htmlFor="prod-name">Nome do Produto *</Label>
              <Input
                id="prod-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Picanha na chapa especial, Gin Tônica artesanal..."
              />
            </div>

            {/* Categoria e Preço */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prod-cat">Categoria *</Label>
                <Select
                  value={formCategory}
                  onValueChange={(val: OrderItem["category"]) => setFormCategory(val)}
                >
                  <SelectTrigger id="prod-cat">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ORDER.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABEL[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-price">Preço de Venda (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="prod-price"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="0,00"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Serve / Rendimento & Destaque Comercial */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prod-serves">Porção / Rendimento</Label>
                <Input
                  id="prod-serves"
                  value={formServes}
                  onChange={(e) => setFormServes(e.target.value)}
                  placeholder="Ex: Serve 2 pessoas, Individual, Petisco..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-highlight">Selo de Destaque</Label>
                <Select value={formHighlight} onValueChange={(val) => setFormHighlight(val)}>
                  <SelectTrigger id="prod-highlight">
                    <SelectValue placeholder="Nenhum destaque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum selo</SelectItem>
                    <SelectItem value="mais_pedido">⭐ Mais Pedido</SelectItem>
                    <SelectItem value="chef">👨‍🍳 Especial do Chef</SelectItem>
                    <SelectItem value="artesanal">🍺 Artesanal da Casa</SelectItem>
                    <SelectItem value="vegetariano">🌱 Vegetariano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descrição Detalhada */}
            <div className="space-y-1.5">
              <Label htmlFor="prod-desc">Descrição & Ingredientes</Label>
              <Textarea
                id="prod-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreva os ingredientes nobres, temperos, modo de preparo e acompanhamentos..."
                rows={2}
              />
            </div>

            {/* Configurações de Estoque */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Boxes className="h-4 w-4 text-primary" />
                    Controle de Estoque & Alerta de Reposição
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Abate o saldo automaticamente ao lançar pedidos para este produto.
                  </p>
                </div>
                <Switch checked={formTrackStock} onCheckedChange={setFormTrackStock} />
              </div>

              {formTrackStock && (
                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="prod-stock" className="text-xs">
                      {editingProduct ? "Saldo em Estoque" : "Saldo Inicial"}
                    </Label>
                    <Input
                      id="prod-stock"
                      type="number"
                      min={0}
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prod-min-stock" className="text-xs">
                      Estoque Mínimo (Alerta)
                    </Label>
                    <Input
                      id="prod-min-stock"
                      type="number"
                      min={0}
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prod-unit" className="text-xs">
                      Unidade de Medida
                    </Label>
                    <Input
                      id="prod-unit"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      placeholder="porção, un, caneca, lata..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Disponibilidade no Cardápio */}
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3">
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  Disponível para Venda
                </Label>
                <p className="text-xs text-muted-foreground">
                  Se desativado, o produto é pausado e não aparece no Cardápio Digital nem para os
                  garçons.
                </p>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setEditingProduct(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} className="bg-primary hover:bg-primary/90">
              {editingProduct ? "Salvar Alterações" : "Adicionar ao Cardápio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: ENTRADA DE ESTOQUE / REPOSIÇÃO */}
      <Dialog
        open={!!restockProduct}
        onOpenChange={(open) => {
          if (!open) setRestockProduct(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-emerald-600" />
              Entrada de Mercadoria / Reposição
            </DialogTitle>
            <DialogDescription>
              Adicione unidades recebidas para atualizar o estoque disponível de venda.
            </DialogDescription>
          </DialogHeader>

          {restockProduct && (
            <div className="space-y-4 py-2">
              {/* Resumo do Produto Selecionado */}
              <div className="rounded-lg border border-border/80 bg-muted/40 p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-foreground">{restockProduct.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Categoria: {CATEGORY_LABEL[restockProduct.category]}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Saldo Atual</div>
                  <div className="font-bold text-base text-foreground font-mono">
                    {restockProduct.stock} {restockProduct.unit || "un"}
                  </div>
                </div>
              </div>

              {/* Quantidade a Adicionar */}
              <div className="space-y-2">
                <Label htmlFor="restock-qty">Quantidade a Acrescentar *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="restock-qty"
                    type="number"
                    min={1}
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    className="text-base font-semibold font-mono"
                  />
                  <span className="text-sm font-medium text-muted-foreground shrink-0">
                    {restockProduct.unit || "un"}
                  </span>
                </div>

                {/* Atalhos Rápidos */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[5, 10, 20, 50].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRestockQty(String(n))}
                      className="text-xs h-7 px-2"
                    >
                      +{n}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Motivo / Nota do Fornecedor */}
              <div className="space-y-1.5">
                <Label htmlFor="restock-reason">Nota Fiscal / Origem (Opcional)</Label>
                <Input
                  id="restock-reason"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  placeholder="Ex: Compra Distribuidora XYZ, NF 4910, Feira matinal..."
                />
              </div>

              {/* Projeção do Novo Saldo */}
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  Novo Saldo Projetado:
                </span>
                <span className="text-base font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                  {restockProduct.stock + (parseInt(restockQty, 10) || 0)}{" "}
                  {restockProduct.unit || "un"}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockProduct(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRestock}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirmar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CONFIRMAR EXCLUSÃO DE PRODUTO */}
      <Dialog
        open={!!productToDelete}
        onOpenChange={(open) => {
          if (!open) setProductToDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              Excluir Produto do Cardápio
            </DialogTitle>
            <DialogDescription>
              Esta ação removerá o produto do cardápio e não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {productToDelete && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2 text-sm text-foreground">
              <p>
                Tem certeza que deseja excluir <strong>"{productToDelete.name}"</strong>?
              </p>
              <p className="text-xs text-muted-foreground">
                Preço: R$ {productToDelete.price.toFixed(2).replace(".", ",")} · Estoque atual:{" "}
                {productToDelete.stock} {productToDelete.unit || "un"}.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
