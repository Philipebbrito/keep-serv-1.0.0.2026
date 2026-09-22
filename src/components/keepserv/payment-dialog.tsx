import { Banknote, CreditCard, Minus, Plus, QrCode, Receipt, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth, useOrders } from "@/state";
import { orderTotal, ROLE_LABEL, type Order, type PaymentMethod } from "@/domain";
import { cn } from "@/lib/utils";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const METHODS: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "debito", label: "Débito", icon: CreditCard },
  { id: "credito", label: "Crédito", icon: Smartphone },
  { id: "pix", label: "Pix", icon: QrCode },
];

export function PaymentDialog({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { registerPayment } = useOrders();
  const { session } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [split, setSplit] = useState(1);

  useEffect(() => {
    if (order) {
      setMethod("pix");
      setSplit(Math.max(1, order.guests));
    }
  }, [order]);

  if (!order) return null;

  const total = orderTotal(order);
  const perPerson = total / Math.max(1, split);

  const confirm = () => {
    registerPayment(order.id, method, split);
    onClose();
  };

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            Fechar comanda {order.code} · Mesa {order.table}
          </DialogTitle>
          <DialogDescription>
            Confira os itens, escolha a forma de pagamento e divida a conta se necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 text-xs">
          <span className="text-muted-foreground">Responsável pelo recebimento:</span>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-emerald-500" />
            {session?.name ?? "Operador"} ({ROLE_LABEL[session?.role ?? "garcom"]})
          </span>
        </div>

        <ul className="space-y-1.5 text-sm">
          {order.items
            .filter((i) => !i.canceled)
            .map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.qty}× {i.name}
                </span>
                <span className="tabular-nums">{brl(i.price * i.qty)}</span>
              </li>
            ))}
        </ul>

        <Separator />

        <div>
          <p className="mb-2 text-sm font-medium">Forma de pagamento</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all",
                  method === m.id
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                <m.icon className="size-4.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Dividir a conta</p>
              <p className="text-xs text-muted-foreground">Total dividido por pessoa</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Menos pessoas"
                onClick={() => setSplit((s) => Math.max(1, s - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-8 text-center font-display text-lg font-semibold tabular-nums">
                {split}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Mais pessoas"
                onClick={() => setSplit((s) => s + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          {split > 1 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {split}× de <span className="font-semibold text-foreground">{brl(perPerson)}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
          <span className="text-sm font-medium">Total da comanda</span>
          <span className="font-display text-2xl font-semibold tabular-nums">{brl(total)}</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            onClick={confirm}
          >
            <Receipt className="size-4" />
            Confirmar recebimento ({brl(total)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
