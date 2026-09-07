import { Minus, Plus, Trash2, ChefHat } from "lucide-react";
import { useMemo, useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABEL, CATEGORY_ORDER, type MenuItem } from "@/lib/keepserv/menu";
import { getProductStockStatus } from "@/lib/keepserv/stock";
import { useKeepServ } from "@/lib/keepserv/store";
import type { OrderItem } from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

interface DraftItem {
  key: string;
  name: string;
  qty: number;
  price: number;
  category: OrderItem["category"];
  note?: string;
}

export function NewOrderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createOrder, products, stockItems } = useKeepServ();
  const [table, setTable] = useState<string>("");
  const [guests, setGuests] = useState<string>("2");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupedMenu = useMemo(() => {
    const byCategory: Record<OrderItem["category"], MenuItem[]> = {
      prato: [],
      entrada: [],
      bebida: [],
      sobremesa: [],
    };
    for (const item of products) {
      if (item.active !== false) {
        byCategory[item.category].push(item);
      }
    }
    return byCategory;
  }, [products]);

  const addItem = (menuItem: MenuItem) => {
    const stockStatus = getProductStockStatus(menuItem, stockItems);
    if (!stockStatus.available) {
      setError(`"${menuItem.name}" está esgotado no estoque.`);
      return;
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.name === menuItem.name);
      if (existing) {
        return prev.map((i) => (i.name === menuItem.name ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          key: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: menuItem.name,
          qty: 1,
          price: menuItem.price,
          category: menuItem.category,
        },
      ];
    });
    setError(null);
  };

  const updateQty = (key: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0),
    );
  };

  const updateNote = (key: string, note: string) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, note } : i)));
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const reset = () => {
    setTable("");
    setGuests("2");
    setItems([]);
    setNotes("");
    setPriority(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = () => {
    const tableNum = parseInt(table, 10);
    const guestsNum = parseInt(guests, 10);

    if (!table || Number.isNaN(tableNum) || tableNum <= 0) {
      setError("Informe o número da mesa.");
      return;
    }
    if (Number.isNaN(guestsNum) || guestsNum <= 0) {
      setError("Informe a quantidade de pessoas.");
      return;
    }
    if (items.length === 0) {
      setError("Adicione pelo menos um item ao pedido.");
      return;
    }

    const trimmedNotes = notes.trim();
    const orderInput = {
      table: tableNum,
      guests: guestsNum,
      items: items.map((i) => {
        const it = {
          name: i.name,
          qty: i.qty,
          price: i.price,
          category: i.category,
        };
        return i.note ? { ...it, note: i.note } : it;
      }),
      priority,
    };
    createOrder(trimmedNotes ? { ...orderInput, notes: trimmedNotes } : orderInput);

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border bg-surface px-6 py-4 text-left">
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <ChefHat className="size-5 text-accent" />
            Novo pedido
          </DialogTitle>
          <DialogDescription>
            Monte a comanda e envie para a cozinha. O pedido aparecerá na coluna Pendente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[74vh] grid-cols-1 overflow-y-auto md:grid-cols-2">
          <section className="border-border p-6 md:border-r">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="table">Mesa</Label>
                <Input
                  id="table"
                  type="number"
                  min={1}
                  placeholder="Ex: 8"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guests">Pessoas</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                />
              </div>
            </div>

            <h3 className="mt-6 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Cardápio
            </h3>
            <ScrollArea className="mt-3 h-[46vh] pr-3">
              <div className="space-y-5">
                {CATEGORY_ORDER.map((category) => {
                  const list = groupedMenu[category];
                  if (list.length === 0) return null;
                  return (
                    <div key={category}>
                      <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                        {CATEGORY_LABEL[category]}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {list.map((menuItem) => {
                          const selected = items.find((i) => i.name === menuItem.name);
                          const stockStatus = getProductStockStatus(menuItem, stockItems);
                          const isOutOfStock = !stockStatus.available;
                          const isLowStock = stockStatus.available && stockStatus.lowStock;

                          return (
                            <button
                              key={menuItem.id}
                              disabled={isOutOfStock}
                              onClick={() => addItem(menuItem)}
                              className={cn(
                                "flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left text-sm transition-colors hover:border-accent hover:bg-accent/5",
                                selected && "border-accent bg-accent/10",
                                isOutOfStock &&
                                  "opacity-50 cursor-not-allowed hover:border-border hover:bg-card",
                              )}
                            >
                              <div>
                                <p className="font-medium flex items-center gap-1.5">
                                  <span>{menuItem.name}</span>
                                  {isOutOfStock && (
                                    <span className="rounded bg-rose-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                      Esgotado
                                    </span>
                                  )}
                                  {isLowStock && (
                                    <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                      {stockStatus.maxPortions !== null
                                        ? `Restam ${stockStatus.maxPortions}`
                                        : "Estoque Baixo"}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>R$ {menuItem.price.toFixed(2).replace(".", ",")}</span>
                                  {stockStatus.available &&
                                    !isLowStock &&
                                    stockStatus.maxPortions !== null && (
                                      <span className="text-[11px] text-muted-foreground/70">
                                        · {stockStatus.maxPortions} disponíveis
                                      </span>
                                    )}
                                  {menuItem.stockConsumption === "recipe" && (
                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded">
                                      Receita
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {selected ? (
                                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                                    {selected.qty}x
                                  </span>
                                ) : null}
                                {!isOutOfStock && <Plus className="size-4 text-muted-foreground" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </section>

          <section className="flex min-h-[420px] flex-col bg-surface/60 p-6">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Resumo do pedido
            </h3>
            <ScrollArea className="mt-3 flex-1 pr-2">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Clique nos itens do cardápio para montar o pedido.
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((i) => (
                    <li key={i.key} className="rounded-lg border border-border bg-card p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{i.name}</p>
                          <p className="text-xs text-muted-foreground">
                            R$ {i.price.toFixed(2).replace(".", ",")} cada ·{" "}
                            {CATEGORY_LABEL[i.category].toLowerCase()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          aria-label="Remover item"
                          onClick={() => removeItem(i.key)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-6"
                          aria-label="Diminuir quantidade"
                          onClick={() => updateQty(i.key, -1)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center font-semibold tabular-nums">{i.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-6"
                          aria-label="Aumentar quantidade"
                          onClick={() => updateQty(i.key, 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                        <span className="ml-auto text-xs font-medium tabular-nums">
                          R$ {(i.price * i.qty).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <Input
                        value={i.note ?? ""}
                        onChange={(e) => updateNote(i.key, e.target.value)}
                        placeholder="Observação do item..."
                        className="mt-2 h-8 text-xs"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>

            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-xl font-semibold tabular-nums">
                  R$ {total.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Observações gerais</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: cliente alérgico, aniversário..."
                  className="min-h-[60px] resize-none text-sm"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div>
                  <p className="text-sm font-medium">Marcar como prioridade</p>
                  <p className="text-xs text-muted-foreground">Destaca o pedido no quadro</p>
                </div>
                <Switch checked={priority} onCheckedChange={setPriority} aria-label="Prioridade" />
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="border-t border-border bg-surface px-6 py-4">
          {error ? <p className="mr-auto text-sm font-medium text-destructive">{error}</p> : null}
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={items.length === 0}>
            Criar pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
