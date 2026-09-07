import {
  AlertTriangle,
  Beef,
  Boxes,
  Camera,
  CheckCircle2,
  DollarSign,
  Edit,
  Eye,
  EyeOff,
  Flame,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  Wine,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductPhotoUploader } from "@/components/keepserv/product-photo-uploader";
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
  MENU_CATEGORIES,
  type MenuCategory,
  type MenuItem,
  type NewProductInput,
  type StockConsumptionType,
} from "@/lib/keepserv/menu";
import { getProductStockStatus, type RecipeIngredient } from "@/lib/keepserv/stock";
import { useKeepServ } from "@/lib/keepserv/store";
import { cn } from "@/lib/utils";

export function MenuManagement() {
  const {
    products,
    stockItems,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    resetProductsToDefault,
  } = useKeepServ();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"todas" | MenuCategory>("todas");
  const [consumptionFilter, setConsumptionFilter] = useState<
    "todos" | "none" | "direct" | "recipe"
  >("todos");

  // Modais
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<MenuItem | null>(null);

  // Campos do Formulário de Produto
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<MenuCategory>("pratos");
  const [formPrice, setFormPrice] = useState("0,00");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState<string | undefined>(undefined);
  const [formServes, setFormServes] = useState("");
  const [formHighlight, setFormHighlight] = useState(false);
  const [formActive, setFormActive] = useState(true);

  // Relação com Estoque
  const [formConsumption, setFormConsumption] = useState<StockConsumptionType>("none");
  const [formLinkedStockId, setFormLinkedStockId] = useState("");
  const [formDirectQty, setFormDirectQty] = useState("1");
  const [formRecipeIngredients, setFormRecipeIngredients] = useState<RecipeIngredient[]>([]);

  // Formulário temporário de ingrediente para receita
  const [selectedIngStockId, setSelectedIngStockId] = useState("");
  const [selectedIngQty, setSelectedIngQty] = useState("0.1");

  const [formError, setFormError] = useState<string | null>(null);

  // Itens de estoque filtrados para facilitar seleção
  const readyToConsumeStock = useMemo(
    () => stockItems.filter((s) => s.type === "pronto_consumo"),
    [stockItems],
  );
  const rawMaterialStock = useMemo(
    () => stockItems.filter((s) => s.type === "materia_prima"),
    [stockItems],
  );

  // Produtos Filtrados
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (selectedCategory !== "todas" && item.category !== selectedCategory) return false;
      if (consumptionFilter !== "todos" && (item.stockConsumption || "none") !== consumptionFilter)
        return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q) || false;
        if (!matchName && !matchDesc) return false;
      }

      return true;
    });
  }, [products, selectedCategory, consumptionFilter, search]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory("pratos");
    setFormPrice("0,00");
    setFormDescription("");
    setFormImage(undefined);
    setFormServes("1 pessoa");
    setFormHighlight(false);
    setFormActive(true);

    setFormConsumption("none");
    setFormLinkedStockId("");
    setFormDirectQty("1");
    setFormRecipeIngredients([]);
    setSelectedIngStockId("");
    setSelectedIngQty("0.1");
    setFormError(null);
    setIsAddOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingProduct(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price.toFixed(2).replace(".", ","));
    setFormDescription(item.description || "");
    setFormImage(item.image);
    setFormServes(item.serves || "");
    setFormHighlight(!!item.highlight);
    setFormActive(item.active !== false);

    setFormConsumption(item.stockConsumption || "none");
    setFormLinkedStockId(item.linkedStockItemId || "");
    setFormDirectQty((item.directStockQty || 1).toString());
    setFormRecipeIngredients(item.recipeIngredients ? [...item.recipeIngredients] : []);
    setSelectedIngStockId("");
    setSelectedIngQty("0.1");
    setFormError(null);
  };

  const handleAddIngredientToRecipe = () => {
    if (!selectedIngStockId) {
      toast.error("Selecione um insumo para adicionar à receita.");
      return;
    }
    const qty = Number(selectedIngQty.replace(",", "."));
    if (isNaN(qty) || qty <= 0) {
      toast.error("Informe uma quantidade válida maior que zero.");
      return;
    }

    const stockItem = stockItems.find((s) => s.id === selectedIngStockId);
    if (!stockItem) return;

    // Se já tiver na receita, atualiza quantidade
    const existingIndex = formRecipeIngredients.findIndex(
      (ing) => ing.stockItemId === selectedIngStockId,
    );

    if (existingIndex >= 0) {
      const updated = [...formRecipeIngredients];
      updated[existingIndex].quantity = Number((updated[existingIndex].quantity + qty).toFixed(3));
      setFormRecipeIngredients(updated);
      toast.info(`Quantidade de "${stockItem.name}" atualizada na receita.`);
    } else {
      setFormRecipeIngredients((prev) => [
        ...prev,
        {
          stockItemId: stockItem.id,
          stockItemName: stockItem.name,
          quantity: qty,
          unit: stockItem.unit,
        },
      ]);
      toast.success(`Insumo "${stockItem.name}" adicionado à receita.`);
    }

    setSelectedIngStockId("");
    setSelectedIngQty("0.1");
  };

  const handleRemoveIngredient = (stockItemId: string) => {
    setFormRecipeIngredients((prev) => prev.filter((ing) => ing.stockItemId !== stockItemId));
  };

  const handleSaveProduct = () => {
    setFormError(null);
    if (!formName.trim()) {
      setFormError("Informe o nome do produto no cardápio.");
      return;
    }

    const cleanPrice = Number(formPrice.replace(/\./g, "").replace(",", ".")) || 0;
    if (cleanPrice < 0) {
      setFormError("O preço de venda não pode ser negativo.");
      return;
    }

    // Validações de relação com estoque
    if (formConsumption === "direct") {
      if (!formLinkedStockId) {
        setFormError("Para consumo direto, selecione o item correspondente no estoque.");
        return;
      }
      const directQty = Number(formDirectQty.replace(",", "."));
      if (isNaN(directQty) || directQty <= 0) {
        setFormError("Informe a quantidade que será consumida do estoque (ex: 1 un, 1 garrafa).");
        return;
      }
    } else if (formConsumption === "recipe") {
      if (formRecipeIngredients.length === 0) {
        setFormError("Adicione pelo menos uma matéria-prima na receita do prato.");
        return;
      }
    }

    const payload: NewProductInput = {
      name: formName.trim(),
      category: formCategory,
      price: cleanPrice,
      description: formDescription.trim() || undefined,
      image: formImage?.trim() || undefined,
      serves: formServes.trim() || undefined,
      highlight: formHighlight,
      active: formActive,
      stockConsumption: formConsumption,
      linkedStockItemId: formConsumption === "direct" ? formLinkedStockId : undefined,
      directStockQty:
        formConsumption === "direct" ? Number(formDirectQty.replace(",", ".")) || 1 : undefined,
      recipeIngredients: formConsumption === "recipe" ? formRecipeIngredients : undefined,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      toast.success("Produto atualizado com sucesso!");
      setEditingProduct(null);
    } else {
      addProduct(payload);
      toast.success("Novo produto adicionado ao cardápio!");
      setIsAddOpen(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    const res = deleteProduct(productToDelete.id);
    if (res.success) {
      toast.success(`Produto "${productToDelete.name}" excluído.`);
      setProductToDelete(null);
    } else {
      toast.error(res.message || "Erro ao excluir produto.");
    }
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO CARDÁPIO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <UtensilsCrossed className="size-6 text-primary" />
              Cardápio do Restaurante
            </h2>
            <Badge variant="outline" className="text-xs font-normal">
              Preços, Categorias & Consumo de Estoque
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Cadastre os itens servidos aos clientes e defina como cada um interage com o estoque:
            consumo direto de produtos prontos (bebidas/latas), consumo de matérias-primas por
            receita (carnes/ingredientes) ou sem dedução de estoque.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Deseja restaurar os itens padrões do cardápio?")) {
                resetProductsToDefault();
                toast.info("Cardápio restaurado para o padrão.");
              }
            }}
            className="text-xs text-muted-foreground hover:text-foreground h-9"
          >
            <RotateCcw className="size-3.5 mr-1.5" />
            Restaurar Padrão
          </Button>

          <Button
            onClick={openAddModal}
            size="sm"
            className="text-xs font-semibold bg-primary text-primary-foreground h-9 shadow-sm"
          >
            <Plus className="size-4 mr-1.5" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* FILTROS DE CATEGORIA E RELAÇÃO COM ESTOQUE */}
      <div className="space-y-3">
        {/* Categorias */}
        <div className="flex flex-wrap items-center gap-1.5 border-b pb-2.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("todas")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              selectedCategory === "todas"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground",
            )}
          >
            Todas as Categorias ({products.length})
          </button>
          {MENU_CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Barra de Busca e Filtro de Consumo */}
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no cardápio por nome ou descrição..."
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

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Tipo de Consumo:
            </span>
            <Select
              value={consumptionFilter}
              onValueChange={(val: "todos" | "none" | "direct" | "recipe") =>
                setConsumptionFilter(val)
              }
            >
              <SelectTrigger className="w-[190px] h-9 text-xs">
                <SelectValue placeholder="Relação com Estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="direct">🍷 Consumo Direto (Bebidas)</SelectItem>
                <SelectItem value="recipe">🥩 Consumo de Matéria-Prima</SelectItem>
                <SelectItem value="none">⚪ Sem Controle de Estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* GRID DE PRODUTOS DO CARDÁPIO */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground rounded-xl border bg-card/40">
            <UtensilsCrossed className="mx-auto size-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">Nenhum produto encontrado no cardápio.</p>
            <p className="text-xs mt-1">Altere a categoria selecionada ou adicione um novo item.</p>
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const stockStatus = getProductStockStatus(prod, stockItems);
            const isPaused = prod.active === false;

            return (
              <div
                key={prod.id}
                className={cn(
                  "rounded-xl border bg-card p-4 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden",
                  isPaused && "opacity-60 bg-muted/20 border-dashed",
                  prod.highlight && "ring-1 ring-amber-500/30",
                )}
              >
                {/* Destaque Banner */}
                {prod.highlight && (
                  <div className="absolute top-0 right-0 z-10 bg-amber-500 text-amber-950 font-bold text-[9px] px-2 py-0.5 rounded-bl-lg flex items-center gap-1 uppercase tracking-wider shadow-xs">
                    <Sparkles className="size-2.5" /> Destaque
                  </div>
                )}

                {/* Foto do Prato no Card do Gestor */}
                {prod.image ? (
                  <div className="relative mb-3 -mx-4 -mt-4 h-36 overflow-hidden bg-muted/40 border-b group/img">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      className="absolute bottom-2 right-2 rounded-md bg-black/60 hover:bg-black/85 text-white text-[10px] font-medium px-2 py-1 flex items-center gap-1 backdrop-blur-xs transition-colors shadow-xs"
                      title="Alterar foto"
                    >
                      <Camera className="size-3 text-white" />
                      Alterar foto
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openEditModal(prod)}
                    className="mb-3 -mx-4 -mt-4 py-2.5 px-3 bg-muted/20 hover:bg-primary/5 border-b border-dashed flex items-center justify-between text-muted-foreground hover:text-primary cursor-pointer transition-colors text-left"
                    title="Adicionar foto ao produto"
                  >
                    <span className="text-[11px] flex items-center gap-1.5 font-medium">
                      <Camera className="size-3.5 text-muted-foreground" />
                      Sem foto cadastrada
                    </span>
                    <span className="text-[10px] font-semibold text-primary">
                      + Adicionar foto
                    </span>
                  </button>
                )}

                <div>
                  {/* Topo: Categoria e Preço */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px] font-normal uppercase py-0">
                      {prod.category}
                    </Badge>
                    <span className="text-base font-bold text-foreground">
                      R$ {prod.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  {/* Nome e Descrição */}
                  <h3 className="font-semibold text-sm text-foreground leading-snug">
                    {prod.name}
                  </h3>
                  {prod.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {prod.description}
                    </p>
                  )}
                  {prod.serves && (
                    <span className="text-[11px] text-muted-foreground/80 mt-1 block">
                      Serve: {prod.serves}
                    </span>
                  )}
                </div>

                {/* BLOCO DA RELAÇÃO COM O ESTOQUE */}
                <div className="mt-4 pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Estoque Vinculado:
                    </span>
                    {/* Badge de Disponibilidade */}
                    {stockStatus.available ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        {stockStatus.maxPortions !== null
                          ? `${stockStatus.maxPortions} porções disponíveis`
                          : "Disponível"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="size-3" /> Esgotado no estoque
                      </span>
                    )}
                  </div>

                  {/* Detalhe da Relação */}
                  {prod.stockConsumption === "direct" ? (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                        <Wine className="size-3.5 text-amber-600" />
                        <span className="font-medium truncate max-w-[160px]">
                          {stockItems.find((s) => s.id === prod.linkedStockItemId)?.name ||
                            "Item não encontrado"}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-amber-500/30">
                        -{prod.directStockQty || 1} un / pedido
                      </Badge>
                    </div>
                  ) : prod.stockConsumption === "recipe" ? (
                    <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-2 text-xs">
                      <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-200 font-medium mb-1">
                        <span className="flex items-center gap-1">
                          <Beef className="size-3.5 text-indigo-600" />
                          Receita ({prod.recipeIngredients?.length || 0} insumos)
                        </span>
                        {stockStatus.maxPortions !== null && (
                          <span className="text-[10px] font-bold">
                            Max: {stockStatus.maxPortions}x
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1">
                        {prod.recipeIngredients?.map((ing) => (
                          <span
                            key={ing.stockItemId}
                            className="bg-background/80 px-1.5 py-0.5 rounded border text-foreground/80"
                          >
                            {ing.quantity} {ing.unit} {ing.stockItemName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted/40 border p-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-muted-foreground/40" />
                      Sem consumo automático de estoque
                    </div>
                  )}

                  {/* Ações do Card */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => toggleProductActive(prod.id)}
                      className={cn(
                        "text-xs font-medium flex items-center gap-1 transition-colors",
                        prod.active !== false
                          ? "text-muted-foreground hover:text-foreground"
                          : "text-amber-600 hover:text-amber-700",
                      )}
                      title={prod.active !== false ? "Pausar no cardápio" : "Ativar no cardápio"}
                    >
                      {prod.active !== false ? (
                        <>
                          <Eye className="size-3.5" /> Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-3.5" /> Pausado
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(prod)}
                        className="h-8 px-2 text-xs"
                      >
                        <Edit className="size-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setProductToDelete(prod)}
                        className="size-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: NOVO / EDITAR PRODUTO NO CARDÁPIO */}
      <Dialog
        open={isAddOpen || editingProduct !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="size-5 text-primary" />
              {editingProduct
                ? `Editar Produto: ${editingProduct.name}`
                : "Novo Produto no Cardápio"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure as informações de venda do item e especifique se o produto consome
              diretamente do estoque (ex: bebidas) ou consome matérias-primas por receita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-600 font-medium">
                {formError}
              </div>
            )}

            {/* FOTO DO PRODUTO */}
            <ProductPhotoUploader
              value={formImage}
              onChange={setFormImage}
              productName={formName}
              category={formCategory}
            />

            {/* DADOS BÁSICOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="prod-name" className="text-xs font-semibold">
                  Nome do Produto no Cardápio *
                </Label>
                <Input
                  id="prod-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Picanha na Brasa Especial, Coca-Cola Lata 350ml, Chopp Pilsen 500ml..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-cat" className="text-xs font-semibold">
                  Categoria *
                </Label>
                <Select
                  value={formCategory}
                  onValueChange={(val: MenuCategory) => setFormCategory(val)}
                >
                  <SelectTrigger id="prod-cat" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MENU_CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-price" className="text-xs font-semibold">
                  Preço de Venda (R$) *
                </Label>
                <Input
                  id="prod-price"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0,00"
                  className="h-9 text-xs font-mono font-semibold"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="prod-desc" className="text-xs">
                  Descrição dos Ingredientes / Prato
                </Label>
                <Textarea
                  id="prod-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Corte nobre com sal grosso, acompanhada de mandioca na manteiga de garrafa..."
                  className="text-xs resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-serves" className="text-xs">
                  Porção / Serve
                </Label>
                <Input
                  id="prod-serves"
                  value={formServes}
                  onChange={(e) => setFormServes(e.target.value)}
                  placeholder="Ex: 1 pessoa, 2 a 3 pessoas, 500ml..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-2.5 bg-muted/20">
                <div>
                  <Label htmlFor="prod-high" className="text-xs font-medium cursor-pointer">
                    Item em Destaque
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Exibe badge especial no cardápio
                  </p>
                </div>
                <Switch id="prod-high" checked={formHighlight} onCheckedChange={setFormHighlight} />
              </div>
            </div>

            {/* SEÇÃO PRINCIPAL: RELAÇÃO COM ESTOQUE (REQUISITO EXPLÍCITO DO USUÁRIO) */}
            <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
              <div>
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Boxes className="size-4 text-primary" />
                  Relação com o Estoque & Almoxarifado *
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Selecione se este produto vai consumir diretamente do estoque ou por
                  matéria-prima.
                </p>
              </div>

              {/* 3 Opções de Consumo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Sem consumo */}
                <button
                  type="button"
                  onClick={() => setFormConsumption("none")}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-lg border text-xs transition-all",
                    formConsumption === "none"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/40 font-medium"
                      : "border-border text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  <span className="font-semibold text-foreground">⚪ Sem Estoque</span>
                  <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Não deduz saldo de estoque automaticamente.
                  </span>
                </button>

                {/* 2. Consumo Direto (Bebidas / Prontos) */}
                <button
                  type="button"
                  onClick={() => setFormConsumption("direct")}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-lg border text-xs transition-all",
                    formConsumption === "direct"
                      ? "border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500/40 font-medium"
                      : "border-border text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                    <Wine className="size-3 text-amber-600" />
                    Consumo Direto
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Bebidas, latas, garrafas e itens prontos para servir.
                  </span>
                </button>

                {/* 3. Consumo por Receita (Matéria-prima) */}
                <button
                  type="button"
                  onClick={() => setFormConsumption("recipe")}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-lg border text-xs transition-all",
                    formConsumption === "recipe"
                      ? "border-indigo-500 bg-indigo-500/10 text-foreground ring-1 ring-indigo-500/40 font-medium"
                      : "border-border text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                    <Beef className="size-3 text-indigo-600" />
                    Receita / Insumos
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1 leading-tight">
                    Deduz matérias-primas por porção (ficha técnica).
                  </span>
                </button>
              </div>

              {/* CAMPOS ESPECÍFICOS: CONSUMO DIRETO */}
              {formConsumption === "direct" && (
                <div className="rounded-lg border bg-card p-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="direct-stock" className="text-xs font-semibold">
                      Item de Estoque Pronto para Consumo *
                    </Label>
                    <Select value={formLinkedStockId} onValueChange={setFormLinkedStockId}>
                      <SelectTrigger id="direct-stock" className="h-9 text-xs">
                        <SelectValue placeholder="Selecione a bebida ou produto acabado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {readyToConsumeStock.length > 0 && (
                          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                            Prontos para Consumo
                          </div>
                        )}
                        {readyToConsumeStock.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} (Saldo: {s.currentStock} {s.unit})
                          </SelectItem>
                        ))}
                        {rawMaterialStock.length > 0 && (
                          <>
                            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase border-t mt-1 pt-1">
                              Outros Itens de Estoque
                            </div>
                            {rawMaterialStock.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} (Saldo: {s.currentStock} {s.unit})
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="direct-qty" className="text-xs">
                      Quantidade baixada por cada pedido vendido
                    </Label>
                    <Input
                      id="direct-qty"
                      value={formDirectQty}
                      onChange={(e) => setFormDirectQty(e.target.value)}
                      placeholder="1"
                      className="h-9 text-xs font-mono w-32"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Ex: 1 para 1 lata/garrafa vendida, ou 0.5 para 500ml de chopp.
                    </p>
                  </div>
                </div>
              )}

              {/* CAMPOS ESPECÍFICOS: RECEITA / MATÉRIA-PRIMA */}
              {formConsumption === "recipe" && (
                <div className="rounded-lg border bg-card p-3 space-y-3">
                  <div>
                    <Label className="text-xs font-semibold">
                      Composição da Receita (Matérias-Primas Consumidas por Porção)
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Quando uma comanda pedir este prato, os insumos abaixo serão baixados
                      automaticamente na proporção indicada.
                    </p>
                  </div>

                  {/* Adicionar Insumo */}
                  <div className="flex flex-col sm:flex-row gap-2 items-end bg-muted/40 p-2.5 rounded-lg">
                    <div className="flex-1 space-y-1 w-full">
                      <Label className="text-[11px]">Matéria-Prima do Almoxarifado</Label>
                      <Select value={selectedIngStockId} onValueChange={setSelectedIngStockId}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Escolha a matéria-prima..." />
                        </SelectTrigger>
                        <SelectContent>
                          {rawMaterialStock.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} (Disponível: {s.currentStock} {s.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-28 space-y-1">
                      <Label className="text-[11px]">Qtd / Porção</Label>
                      <Input
                        value={selectedIngQty}
                        onChange={(e) => setSelectedIngQty(e.target.value)}
                        placeholder="0.35"
                        className="h-8 text-xs font-mono bg-background"
                      />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddIngredientToRecipe}
                      className="h-8 text-xs px-3 font-medium"
                    >
                      <Plus className="size-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {/* Lista de Insumos da Receita */}
                  <div className="space-y-1.5">
                    {formRecipeIngredients.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2 text-center">
                        Nenhum ingrediente adicionado à receita ainda.
                      </p>
                    ) : (
                      formRecipeIngredients.map((ing) => (
                        <div
                          key={ing.stockItemId}
                          className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Beef className="size-3.5 text-indigo-600" />
                            <span className="font-semibold text-foreground">
                              {ing.stockItemName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-muted-foreground">
                              {ing.quantity} {ing.unit} por prato
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(ing.stockItemId)}
                              className="text-rose-500 hover:text-rose-700"
                              title="Remover insumo"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddOpen(false);
                setEditingProduct(null);
              }}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveProduct}
              className="text-xs font-semibold bg-primary text-primary-foreground"
            >
              {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EXCLUSÃO */}
      <Dialog
        open={productToDelete !== null}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-rose-600 flex items-center gap-2">
              <Trash2 className="size-5" />
              Excluir Produto do Cardápio
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir o produto <strong>"{productToDelete?.name}"</strong>? O
              item será removido do cardápio e não aparecerá mais para novos pedidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProductToDelete(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteProduct}
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
