import {
  ChefHat,
  Flame,
  Info,
  LayoutGrid,
  Leaf,
  List,
  MessageSquare,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_LABEL, CATEGORY_ORDER, type MenuItem } from "@/lib/keepserv/menu";
import { useKeepServ } from "@/lib/keepserv/store";
import type { Order } from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Sugestões rápidas de observação de acordo com categoria
const QUICK_NOTES: Record<string, string[]> = {
  entradas: ["Sem cebola", "Molho à parte", "Bem crocante"],
  principais: ["Ao ponto", "Bem passado", "Mal passado", "Sem cebola", "Molho à parte"],
  hamburgueres: ["Sem cebola", "Sem picles", "Ponto da carne", "Molho à parte", "Sem bacon"],
  bebidas: ["Sem gelo", "Com gelo e limão", "Bem gelada", "Adoçante"],
  sobremesas: ["Sem calda", "Calda à parte", "Com colher extra"],
};

interface DigitalMenuViewProps {
  order?: Order | null;
  tableNumber?: number | null;
  onAskItem?: (item: MenuItem, note?: string) => void;
  onStartOrderWithItems?: (items: { item: MenuItem; qty: number; note?: string }[]) => void;
}

export function DigitalMenuView({
  order,
  tableNumber,
  onAskItem,
  onStartOrderWithItems,
}: DigitalMenuViewProps) {
  const { products } = useKeepServ();
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [selectedHighlight, setSelectedHighlight] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

  // Carrinho de seleção do cliente
  const [cart, setCart] = useState<Record<string, { item: MenuItem; qty: number; note?: string }>>(
    {},
  );
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modal para detalhe / observação individual de item
  const [itemToCustomize, setItemToCustomize] = useState<MenuItem | null>(null);
  const [customQty, setCustomQty] = useState(1);
  const [customNote, setCustomNote] = useState("");

  const filteredItems = useMemo(() => {
    return products.filter((item) => {
      if (item.active === false) return false;
      if (selectedCategory !== "todos" && item.category !== selectedCategory) {
        return false;
      }
      if (selectedHighlight !== "todos") {
        if (selectedHighlight === "mais_pedido" && item.highlight !== "mais_pedido") return false;
        if (selectedHighlight === "chef" && item.highlight !== "chef") return false;
        if (selectedHighlight === "vegetariano" && item.highlight !== "vegetariano") return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) || false;
        const matchesCat = CATEGORY_LABEL[item.category]?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedHighlight, search]);

  const cartItemsArray = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = useMemo(
    () => cartItemsArray.reduce((acc, curr) => acc + curr.item.price * curr.qty, 0),
    [cartItemsArray],
  );
  const cartItemCount = useMemo(
    () => cartItemsArray.reduce((acc, curr) => acc + curr.qty, 0),
    [cartItemsArray],
  );

  const handleQuickAdd = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (item.trackStock && item.stock <= 0) {
      toast.error(`"${item.name}" está esgotado no momento.`);
      return;
    }
    setCart((prev) => {
      const existing = prev[item.id];
      const newQty = existing ? existing.qty + 1 : 1;
      return {
        ...prev,
        [item.id]: { item, qty: newQty, note: existing?.note },
      };
    });
    toast.success(`"${item.name}" adicionado!`, {
      description: "Toque na barra inferior para revisar sua seleção.",
    });
  };

  const handleUpdateQty = (itemId: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      }
      return {
        ...prev,
        [itemId]: { ...existing, qty: newQty },
      };
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const handleUpdateItemNote = (itemId: string, note: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, note },
      };
    });
  };

  const handleOpenCustomize = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const existing = cart[item.id];
    setItemToCustomize(item);
    setCustomQty(existing ? existing.qty : 1);
    setCustomNote(existing?.note || "");
  };

  const handleSaveCustomization = () => {
    if (!itemToCustomize) return;
    if (itemToCustomize.trackStock && itemToCustomize.stock <= 0) {
      toast.error(`"${itemToCustomize.name}" está esgotado no momento.`);
      return;
    }
    setCart((prev) => ({
      ...prev,
      [itemToCustomize.id]: {
        item: itemToCustomize,
        qty: customQty,
        note: customNote.trim() || undefined,
      },
    }));
    toast.success(`"${itemToCustomize.name}" atualizado na sua comanda!`);
    setItemToCustomize(null);
  };

  const handleDirectAskFromModal = () => {
    if (!itemToCustomize) return;
    if (onAskItem) {
      onAskItem(itemToCustomize, customNote.trim() || undefined);
    }
    setItemToCustomize(null);
  };

  const handleSendCartOrder = () => {
    if (cartItemsArray.length === 0) return;
    if (onStartOrderWithItems) {
      onStartOrderWithItems(cartItemsArray);
      setCart({});
      setIsCartOpen(false);
    } else if (onAskItem && order) {
      cartItemsArray.forEach(({ item, qty, note }) => {
        onAskItem(item, `${qty}x${note ? ` (${note})` : ""}`);
      });
      toast.success("Pedidos enviados para a equipe da sua mesa!");
      setCart({});
      setIsCartOpen(false);
    }
  };

  const handleAppendQuickNote = (tag: string) => {
    setCustomNote((prev) => {
      if (!prev) return tag;
      if (prev.includes(tag)) return prev;
      return `${prev}, ${tag}`;
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 🌟 CABEÇALHO & FILTROS DO CARDÁPIO */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-xs">
        {/* Linha de Título e Mesa */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UtensilsCrossed className="size-4" />
            </span>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-foreground leading-tight">
                Cardápio Digital
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Pratos autorais, bebidas e sobremesas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {tableNumber && (
              <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary">
                Mesa {tableNumber}
              </Badge>
            )}

            {/* Alternador de Modo de Visualização (Grid vs Lista Compacta) */}
            <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Modo Grade Completa"
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compact")}
                title="Modo Lista Compacta"
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "compact"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="mt-3 relative">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar prato, ingrediente, vinho, chopp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 pr-8 text-xs sm:text-sm bg-background rounded-xl border-border w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground bg-muted/60 rounded-full"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros Rápidos de Destaque */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedHighlight("todos")}
            className={cn(
              "px-2.5 py-1.5 rounded-xl border transition-colors whitespace-nowrap text-[11px] font-medium shrink-0",
              selectedHighlight === "todos"
                ? "bg-foreground text-background border-foreground font-semibold"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            Todos os pratos
          </button>
          <button
            type="button"
            onClick={() =>
              setSelectedHighlight(selectedHighlight === "mais_pedido" ? "todos" : "mais_pedido")
            }
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-xl border transition-colors whitespace-nowrap shrink-0",
              selectedHighlight === "mais_pedido"
                ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400 font-semibold"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            <Flame className="size-3 text-amber-500" />
            Mais Pedidos
          </button>
          <button
            type="button"
            onClick={() => setSelectedHighlight(selectedHighlight === "chef" ? "todos" : "chef")}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-xl border transition-colors whitespace-nowrap shrink-0",
              selectedHighlight === "chef"
                ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            <ChefHat className="size-3 text-primary" />
            Sugestão do Chef
          </button>
          <button
            type="button"
            onClick={() =>
              setSelectedHighlight(selectedHighlight === "vegetariano" ? "todos" : "vegetariano")
            }
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-xl border transition-colors whitespace-nowrap shrink-0",
              selectedHighlight === "vegetariano"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-semibold"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            <Leaf className="size-3 text-emerald-500" />
            Vegetariano
          </button>
        </div>
      </div>

      {/* 📌 BARRA DE CATEGORIAS STICKY (Fixa no topo da rolagem mobile) */}
      <div className="sticky top-[52px] sm:top-[60px] z-20 bg-background/95 backdrop-blur-md py-2 border-b border-border/60 -mx-3 px-3 sm:-mx-4 sm:px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("todos")}
            className={cn(
              "px-3 py-1.5 text-xs rounded-xl transition-all whitespace-nowrap font-medium shrink-0 flex items-center gap-1.5",
              selectedCategory === "todos"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50",
            )}
          >
            <span>Tudo</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                selectedCategory === "todos"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground",
              )}
            >
              {products.filter((i) => i.active !== false).length}
            </span>
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const count = products.filter((i) => i.active !== false && i.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-xl transition-all whitespace-nowrap font-medium shrink-0 flex items-center gap-1.5",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50",
                )}
              >
                <span>{CATEGORY_LABEL[cat]}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🍽️ GRID / LISTA DE PRATOS */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50 my-4">
          <Search className="size-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-foreground">Nenhum prato ou bebida encontrado</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Não encontramos resultados para "{search}". Tente buscar por outros termos ou redefina
            os filtros.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 text-xs rounded-xl"
            onClick={() => {
              setSearch("");
              setSelectedCategory("todos");
              setSelectedHighlight("todos");
            }}
          >
            Limpar Busca e Filtros
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* MODO GRADE: 1 Coluna em Mobile (<640px), 2 Colunas em Tablet, 3 Colunas em Desktop */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {filteredItems.map((item) => {
            const inCart = cart[item.id];
            const isOutOfStock = item.trackStock && item.stock <= 0;
            const isLowStock = item.trackStock && item.stock > 0 && item.stock <= item.minStock;

            return (
              <div
                key={item.id}
                onClick={() => !isOutOfStock && handleOpenCustomize(item)}
                className={cn(
                  "group rounded-2xl border border-border bg-card p-3.5 transition-all duration-200 flex flex-col justify-between hover:border-primary/50 hover:shadow-xs active:scale-[0.99] overflow-hidden",
                  isOutOfStock ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                  inCart && "border-primary/60 bg-primary/[0.025] ring-1 ring-primary/20",
                )}
              >
                <div>
                  {/* Foto do Prato */}
                  {item.image && (
                    <div className="relative mb-3 -mx-3.5 -mt-3.5 h-44 sm:h-48 overflow-hidden bg-muted/40 border-b border-border/60">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      {/* Badges sobre a foto */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                        {item.highlight === "mais_pedido" && !isOutOfStock && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 shadow-xs">
                            <Flame className="size-2.5" /> Mais pedido
                          </span>
                        )}
                        {item.highlight === "chef" && !isOutOfStock && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-xs">
                            <ChefHat className="size-2.5" /> Sugestão do Chef
                          </span>
                        )}
                        {item.highlight === "vegetariano" && !isOutOfStock && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                            <Leaf className="size-2.5" /> Veg
                          </span>
                        )}
                      </div>
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-500/90 text-white uppercase tracking-wider">
                            Esgotado
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Topo do Card: Nome, Tags e Preço */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-display font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                          {item.name}
                        </h4>
                        {isOutOfStock && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 whitespace-nowrap">
                            Esgotado
                          </span>
                        )}
                        {isLowStock && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            Últimas {item.stock} un
                          </span>
                        )}
                        {item.highlight === "mais_pedido" && !isOutOfStock && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            <Flame className="size-2.5" /> Mais pedido
                          </span>
                        )}
                        {item.highlight === "chef" && !isOutOfStock && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-primary/15 text-primary border border-primary/30 whitespace-nowrap">
                            <ChefHat className="size-2.5" /> Do Chef
                          </span>
                        )}
                        {item.highlight === "vegetariano" && !isOutOfStock && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            <Leaf className="size-2.5" /> Veg
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-foreground text-sm sm:text-base block">
                        {brl(item.price)}
                      </span>
                      {item.serves && (
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          {item.serves}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card: Categoria e Botões de Ação */}
                <div
                  className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-1.5 py-0.5"
                    >
                      {CATEGORY_LABEL[item.category]}
                    </Badge>
                    {inCart?.note && (
                      <span
                        className="text-[10px] text-primary flex items-center gap-0.5 max-w-[120px] truncate"
                        title={inCart.note}
                      >
                        <MessageSquare className="size-2.5 shrink-0" />
                        Obs: {inCart.note}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {inCart ? (
                      <div className="flex items-center gap-1 bg-muted/80 rounded-xl p-0.5 border border-border shadow-2xs">
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQty(item.id, -1, e)}
                          className="size-7 sm:size-8 flex items-center justify-center rounded-lg text-foreground hover:bg-background transition-colors active:scale-95"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs sm:text-sm font-mono font-bold text-foreground">
                          {inCart.qty}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleUpdateQty(item.id, 1, e)}
                          className="size-7 sm:size-8 flex items-center justify-center rounded-lg text-foreground hover:bg-background transition-colors active:scale-95"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant={isOutOfStock ? "outline" : "secondary"}
                        disabled={isOutOfStock}
                        className="h-8 text-xs gap-1.5 px-3 rounded-xl font-medium shadow-2xs hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={(e) => handleQuickAdd(item, e)}
                      >
                        {!isOutOfStock && <Plus className="size-3.5" />}
                        <span>{isOutOfStock ? "Esgotado" : "Adicionar"}</span>
                      </Button>
                    )}

                    {!isOutOfStock && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-muted-foreground hover:text-primary rounded-xl"
                        onClick={(e) => handleOpenCustomize(item, e)}
                        title="Ver detalhes ou adicionar observação"
                      >
                        <Info className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODO LISTA COMPACTA: Ideal para pedidos rápidos, bebidas e petiscos */
        <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
          {filteredItems.map((item) => {
            const inCart = cart[item.id];
            const isOutOfStock = item.trackStock && item.stock <= 0;
            const isLowStock = item.trackStock && item.stock > 0 && item.stock <= item.minStock;

            return (
              <div
                key={item.id}
                onClick={() => !isOutOfStock && handleOpenCustomize(item)}
                className={cn(
                  "p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors",
                  isOutOfStock
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-muted/30 cursor-pointer",
                  inCart && "bg-primary/[0.02]",
                )}
              >
                {/* Miniatura na lista compacta */}
                {item.image && (
                  <div className="size-14 sm:size-16 rounded-xl overflow-hidden bg-muted/40 shrink-0 border border-border">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                      {item.name}
                    </span>
                    {isOutOfStock && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-1.5 py-0.2 rounded border border-rose-500/30">
                        Esgotado
                      </span>
                    )}
                    {isLowStock && (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30">
                        Últimas {item.stock} un
                      </span>
                    )}
                    {item.highlight === "mais_pedido" && !isOutOfStock && (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        • Mais pedido
                      </span>
                    )}
                    {item.highlight === "vegetariano" && !isOutOfStock && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        • Veg
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                      {CATEGORY_LABEL[item.category]}
                    </span>
                    {item.serves && (
                      <span className="text-[10px] text-muted-foreground">• {item.serves}</span>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-2.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-mono font-bold text-xs sm:text-sm text-foreground">
                    {brl(item.price)}
                  </span>

                  {inCart ? (
                    <div className="flex items-center gap-1 bg-muted/80 rounded-lg p-0.5 border border-border">
                      <button
                        type="button"
                        onClick={(e) => handleUpdateQty(item.id, -1, e)}
                        className="size-6 sm:size-7 flex items-center justify-center rounded hover:bg-background transition-colors text-xs"
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-mono font-bold">
                        {inCart.qty}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleUpdateQty(item.id, 1, e)}
                        className="size-6 sm:size-7 flex items-center justify-center rounded hover:bg-background transition-colors text-xs"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant={isOutOfStock ? "outline" : "secondary"}
                      disabled={isOutOfStock}
                      className="h-7 text-xs px-2 rounded-lg"
                      onClick={(e) => handleQuickAdd(item, e)}
                    >
                      {!isOutOfStock && <Plus className="size-3" />}
                      <span className="ml-1">{isOutOfStock ? "Esgotado" : "Pedir"}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🛒 BARRA FLUTUANTE INFERIOR DO CARRINHO (Aparece quando há itens selecionados) */}
      {cartItemCount > 0 && (
        <aside
          aria-label="Resumo do pedido"
          className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[500px] z-40 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="bg-foreground text-background rounded-2xl p-2.5 sm:p-3 shadow-xl border border-foreground/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
            >
              <div className="relative size-10 rounded-xl bg-background/15 flex items-center justify-center shrink-0">
                <ShoppingBag className="size-5 text-background" />
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground font-mono font-bold text-[10px] size-5 rounded-full flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </span>
              </div>
              <div className="truncate">
                <div className="text-xs sm:text-sm font-bold text-background leading-tight">
                  {cartItemCount === 1
                    ? "1 item selecionado"
                    : `${cartItemCount} itens selecionados`}
                </div>
                <div className="text-[11px] text-background/70 font-mono">
                  Total: {brl(cartTotal)}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs px-2.5 bg-background/10 border-background/20 text-background hover:bg-background/20 rounded-xl"
                onClick={() => setIsCartOpen(true)}
              >
                Ver Pedido
              </Button>
              <Button
                size="sm"
                className="h-9 text-xs font-bold px-3.5 rounded-xl shadow-xs"
                onClick={handleSendCartOrder}
              >
                {order ? "Pedir ao Garçom" : "Abrir Mesa"}
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* 📦 MODAL / DRAWER DO CARRINHO (Revisão antes de enviar ao garçom) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
            {/* Cabeçalho do Carrinho */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag className="size-4" />
                </span>
                <div>
                  <h4 className="font-display font-bold text-base text-foreground">
                    Itens Selecionados
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {tableNumber ? `Mesa ${tableNumber} • ` : ""}
                    {cartItemCount} itens no pedido
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="size-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Lista de Itens no Carrinho com Ajuste de Quantidade e Observações */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-border/60">
              {cartItemsArray.map(({ item, qty, note }) => (
                <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-start justify-between gap-2.5">
                    {item.image && (
                      <div className="size-11 rounded-lg overflow-hidden shrink-0 border border-border bg-muted/30">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-sm text-foreground truncate">
                        {item.name}
                      </h5>
                      <span className="font-mono text-xs text-muted-foreground">
                        {brl(item.price)} cada
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-muted/80 rounded-xl p-0.5 border border-border">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="size-7 flex items-center justify-center rounded-lg hover:bg-background text-xs"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-mono font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="size-7 flex items-center justify-center rounded-lg hover:bg-background text-xs"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-sm w-16 text-right">
                        {brl(item.price * qty)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded"
                        title="Remover"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Campo de observação individual do prato */}
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-3 text-muted-foreground shrink-0" />
                    <Input
                      type="text"
                      placeholder="Observação (ex: bem gelada, sem cebola...)"
                      value={note || ""}
                      onChange={(e) => handleUpdateItemNote(item.id, e.target.value)}
                      className="h-8 text-xs bg-background rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé do Carrinho com Total e Envio */}
            <div className="p-4 border-t border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal dos itens</span>
                <span className="font-mono font-bold text-base text-foreground">
                  {brl(cartTotal)}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs h-10 rounded-xl"
                  onClick={() => setCart({})}
                >
                  Limpar Seleção
                </Button>
                <Button
                  className="flex-[2] text-xs font-bold h-10 rounded-xl gap-2 shadow-xs"
                  onClick={handleSendCartOrder}
                >
                  <UtensilsCrossed className="size-4" />
                  {order ? "Enviar ao Garçom" : "Confirmar & Abrir Mesa"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📝 MODAL DE PERSONALIZAÇÃO E DETALHES DO ITEM */}
      {itemToCustomize && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-200 overflow-hidden">
            {/* Foto Grande do Prato no Modal */}
            {itemToCustomize.image && (
              <div className="relative -mx-5 -mt-5 h-44 sm:h-52 overflow-hidden bg-muted/40 border-b border-border">
                <img
                  src={itemToCustomize.image}
                  alt={itemToCustomize.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => setItemToCustomize(null)}
                  className="absolute top-3 right-3 size-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-sm font-bold backdrop-blur-xs transition-colors shadow-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Topo */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                  {CATEGORY_LABEL[itemToCustomize.category]}
                </span>
                <h4 className="font-display font-bold text-lg text-foreground mt-0.5">
                  {itemToCustomize.name}
                </h4>
                {itemToCustomize.serves && (
                  <p className="text-xs text-muted-foreground">{itemToCustomize.serves}</p>
                )}
              </div>
              {!itemToCustomize.image && (
                <button
                  type="button"
                  onClick={() => setItemToCustomize(null)}
                  className="size-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground text-sm font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Descrição e Preço */}
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-medium text-muted-foreground">Preço unitário</span>
                <span className="font-mono font-bold text-primary text-base">
                  {brl(itemToCustomize.price)}
                </span>
              </div>
              {itemToCustomize.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {itemToCustomize.description}
                </p>
              )}
            </div>

            {/* Seletor de Quantidade */}
            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border/60">
              <span className="text-xs font-semibold text-foreground">Quantidade:</span>
              <div className="flex items-center gap-2 bg-background rounded-xl p-1 border border-border shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                  className="size-8 flex items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-mono font-bold">{customQty}</span>
                <button
                  type="button"
                  onClick={() => setCustomQty((q) => q + 1)}
                  className="size-8 flex items-center justify-center rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Observações Rápidas e Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Observação para o preparo:</span>
                <span className="text-[10px] text-muted-foreground font-normal">Opcional</span>
              </label>

              {/* Tags de Observações Rápidas para agilizar no celular */}
              {QUICK_NOTES[itemToCustomize.category] && (
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_NOTES[itemToCustomize.category].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAppendQuickNote(tag)}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}

              <Input
                type="text"
                placeholder="Ex: sem cebola, bem gelada, molho à parte..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {/* Botões de Ação */}
            <div className="pt-2 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-xs h-10 rounded-xl"
                onClick={() => setItemToCustomize(null)}
              >
                Voltar
              </Button>
              <Button
                className="flex-[2] text-xs font-semibold h-10 rounded-xl gap-1.5 shadow-xs"
                disabled={itemToCustomize.trackStock && itemToCustomize.stock <= 0}
                onClick={handleSaveCustomization}
              >
                <Plus className="size-4" />
                <span>
                  {itemToCustomize.trackStock && itemToCustomize.stock <= 0
                    ? "Item Esgotado"
                    : `Adicionar (${customQty}x • ${brl(itemToCustomize.price * customQty)})`}
                </span>
              </Button>
            </div>

            {onAskItem && order && (
              <button
                type="button"
                onClick={handleDirectAskFromModal}
                className="w-full text-center text-xs text-primary font-medium hover:underline pt-1"
              >
                Ou enviar este item imediatamente ao garçom {order.waiter}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
