import { Send, Timer, Undo2, X } from "lucide-react";
import { useState } from "react";
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
import { QUICK_MESSAGES_KITCHEN, QUICK_MESSAGES_WAITER } from "@/lib/keepserv/mock-data";
import { useKeepServ } from "@/lib/keepserv/store";
import {
  elapsedLabel,
  orderTotal,
  ROLE_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  type Order,
} from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

function time(at: number) {
  return new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function OrderDialog({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const { session, now, sendMessage, moveTo, togglePriority, cancelItem } = useKeepServ();
  const [draft, setDraft] = useState("");

  if (!order || !session) return null;
  const quick = session.role === "cozinha" ? QUICK_MESSAGES_KITCHEN : QUICK_MESSAGES_WAITER;

  const submit = (text: string) => {
    const value = text.trim();
    if (!value) return;
    sendMessage(order.id, value);
    setDraft("");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border bg-surface px-6 py-4 text-left">
          <DialogTitle className="font-display text-2xl">
            Mesa {order.table} · {order.code}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Garçom {order.waiter}</span>
            <span className="flex items-center gap-1">
              <Timer className="size-3.5" /> aberto há {elapsedLabel(order.openedAt, now)}
            </span>
            <span>{order.guests} pessoas</span>
          </DialogDescription>
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
  );
}
