import { CheckCircle2, Phone, QrCode, Receipt, Send, Timer, Undo2, User, X } from "lucide-react";
import { useState } from "react";
import { QRCodeModal } from "@/components/keepserv/qr-code-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QUICK_MESSAGES_KITCHEN, QUICK_MESSAGES_WAITER } from "@/data";
import { useAuth, useOrders } from "@/state";
import {
  elapsedLabel,
  orderTotal,
  PAYMENT_LABEL,
  ROLE_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  type Order,
} from "@/domain";
import { cn } from "@/lib/utils";

function time(at: number) {
  return new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function OrderDialog({
  order,
  onClose,
  onPay,
}: {
  order: Order | null;
  onClose: () => void;
  onPay?: (order: Order) => void;
}) {
  const { now, sendMessage, moveTo, togglePriority, cancelItem } = useOrders();
  const { session } = useAuth();
  const [draft, setDraft] = useState("");
  const [qrOpen, setQrOpen] = useState(false);

  if (!order || !session) return null;
  const quick = session.role === "cozinha" ? QUICK_MESSAGES_KITCHEN : QUICK_MESSAGES_WAITER;
  const canPay = session.role === "garcom" || session.role === "caixa" || session.role === "gestor";

  const submit = (text: string) => {
    const value = text.trim();
    if (!value) return;
    sendMessage(order.id, value);
    setDraft("");
  };

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border bg-surface px-6 py-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="font-display text-2xl flex items-center gap-2 flex-wrap">
                  <span>
                    Mesa {order.table} · {order.code}
                  </span>
                  {order.customerName && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center gap-1 font-sans">
                      <User className="size-3" />
                      {order.customerName}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span>Garçom {order.waiter}</span>
                  <span className="flex items-center gap-1">
                    <Timer className="size-3.5" /> aberto há {elapsedLabel(order.openedAt, now)}
                  </span>
                  <span>{order.guests} pessoas</span>
                  {order.customerPhone && (
                    <span className="flex items-center gap-1 font-mono text-foreground font-medium text-xs">
                      <Phone className="size-3 text-primary" /> {order.customerPhone}
                      {order.customerRegistered && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1 py-0 rounded font-sans">
                          Cadastrado
                        </span>
                      )}
                    </span>
                  )}
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 shrink-0 hover:bg-primary/10 hover:border-primary/40 text-primary"
                onClick={() => setQrOpen(true)}
                title="Exibir QR Code para consulta da comanda pelo cliente"
              >
                <QrCode className="size-3.5" />
                <span className="hidden sm:inline">QR Code Cliente</span>
                <span className="sm:hidden">QR</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="grid max-h-[70vh] grid-cols-1 overflow-y-auto md:grid-cols-2">
            <section className="border-border p-6 md:border-r">
              <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Itens do pedido
              </h3>
              <ul className="mt-3 space-y-2">
                {order.items.map((i) => (
                  <li
                    key={i.id}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border border-border p-2.5 text-sm",
                      i.canceled && "opacity-50 line-through",
                    )}
                  >
                    <span className="font-semibold text-primary tabular-nums">{i.qty}x</span>
                    <div className="flex-1">
                      <p className="font-medium">{i.name}</p>
                      {i.note ? <p className="text-xs italic">{i.note}</p> : null}
                      <p className="text-xs text-muted-foreground capitalize">{i.category}</p>
                    </div>
                    <span className="text-xs tabular-nums">
                      R$ {(i.price * i.qty).toFixed(2).replace(".", ",")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={i.canceled ? "Reativar item" : "Cancelar item"}
                      onClick={() => cancelItem(order.id, i.id)}
                    >
                      {i.canceled ? <Undo2 className="size-3.5" /> : <X className="size-3.5" />}
                    </Button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-display text-lg font-semibold tabular-nums">
                  R$ {orderTotal(order).toFixed(2).replace(".", ",")}
                </span>
              </div>

              {order.status === "pago" ? (
                <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                  <p className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" /> Comanda Paga
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Recebido por{" "}
                    <strong className="text-foreground">{order.payment?.cashier}</strong> via{" "}
                    <strong className="text-foreground">
                      {order.payment?.method ? PAYMENT_LABEL[order.payment.method] : "—"}
                    </strong>
                    {order.payment?.splitCount && order.payment.splitCount > 1
                      ? ` (dividido em ${order.payment.splitCount}x)`
                      : ""}
                  </p>
                </div>
              ) : canPay && onPay ? (
                <Button
                  className="mt-3 w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                  onClick={() => {
                    onClose();
                    onPay(order);
                  }}
                >
                  <Receipt className="size-4" />
                  Receber pagamento da mesa {order.table}
                </Button>
              ) : null}

              <h3 className="mt-6 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Status
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {STATUS_ORDER.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={order.status === s ? "default" : "outline"}
                    onClick={() => moveTo(order.id, s)}
                  >
                    {STATUS_LABEL[s]}
                  </Button>
                ))}
              </div>
              <Button
                variant={order.priority ? "default" : "outline"}
                size="sm"
                className="mt-3 w-full"
                onClick={() => togglePriority(order.id)}
              >
                {order.priority ? "Remover prioridade" : "Marcar como prioridade"}
              </Button>
            </section>

            <section className="flex min-h-[380px] flex-col bg-surface/60 p-6">
              <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Mensagens garçom ↔ cozinha
              </h3>
              <ScrollArea className="mt-3 h-56 flex-1 pr-3">
                <div className="space-y-2">
                  {order.messages.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma mensagem ainda. Use um atalho abaixo.
                    </p>
                  )}
                  {order.messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[90%] rounded-xl px-3 py-2 text-sm",
                        m.from === session.role
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground shadow-[var(--shadow-card)]",
                      )}
                    >
                      <p className="text-[11px] opacity-75">
                        {m.author} · {ROLE_LABEL[m.from]} · {time(m.at)}
                      </p>
                      <p className="mt-0.5">{m.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground">Mensagens rápidas</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {quick.map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit(draft);
                  }}
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Escrever observação..."
                  />
                  <Button type="submit" size="icon" aria-label="Enviar mensagem">
                    <Send className="size-4" />
                  </Button>
                </form>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
      <QRCodeModal order={qrOpen ? order : null} onClose={() => setQrOpen(false)} />
    </>
  );
}
