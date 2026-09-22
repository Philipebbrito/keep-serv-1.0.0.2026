import { AlertTriangle, ChevronRight, Clock, MessageSquare, Receipt, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/state";
import { elapsedLabel, orderTotal, STATUS_ORDER, urgencyFor, type Order } from "@/domain";
import { cn } from "@/lib/utils";

const URGENCY_STYLE = {
  ontime: {
    ring: "border-l-ontime",
    chip: "bg-ontime-soft text-ontime-foreground",
    label: "No prazo",
  },
  warn: {
    ring: "border-l-warn",
    chip: "bg-warn-soft text-warn-foreground",
    label: "Atenção",
  },
  late: {
    ring: "border-l-late",
    chip: "bg-late-soft text-late-foreground",
    label: "Atrasado",
  },
} as const;

export function OrderCard({
  order,
  onOpen,
  canAdvance,
  onPay,
}: {
  order: Order;
  onOpen: () => void;
  canAdvance: boolean;
  onPay?: () => void;
}) {
  const { now, advance } = useOrders();
  const urgency = urgencyFor(order, now);
  const style = URGENCY_STYLE[urgency];
  const idx = STATUS_ORDER.indexOf(order.status);
  const next = STATUS_ORDER[idx + 1];
  const activeItems = order.items.filter((i) => !i.canceled);

  return (
    <article
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", order.id)}
      onClick={onOpen}
      className={cn(
        "card-elevated group cursor-pointer border-l-4 p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        style.ring,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-display text-lg leading-none font-semibold">Mesa {order.table}</p>
            {order.customerName && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 truncate max-w-[110px]"
                title={order.customerName}
              >
                {order.customerName}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {order.code} · {order.waiter}
          </p>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
            style.chip,
          )}
        >
          <Clock className="size-3" />
          {elapsedLabel(order.openedAt, now)}
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        {activeItems.slice(0, 3).map((i) => (
          <li key={i.id} className="flex gap-2 text-sm">
            <span className="font-semibold text-primary tabular-nums">{i.qty}x</span>
            <span className="flex-1 leading-snug">
              {i.name}
              {i.note ? (
                <span className="block text-xs text-accent-foreground/80 italic">{i.note}</span>
              ) : null}
            </span>
          </li>
        ))}
        {activeItems.length > 3 && (
          <li className="text-xs text-muted-foreground">+ {activeItems.length - 3} outros itens</li>
        )}
      </ul>

      {order.notes ? (
        <p className="mt-3 flex gap-1.5 rounded-lg bg-surface px-2.5 py-2 text-xs text-surface-foreground">
          <AlertTriangle className="mt-px size-3.5 shrink-0 text-accent" />
          {order.notes}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" /> {order.guests}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" /> {order.messages.length}
          </span>
          <span className="font-medium text-foreground tabular-nums">
            R$ {orderTotal(order).toFixed(2).replace(".", ",")}
          </span>
        </div>
        {order.priority && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
            PRIORIDADE
          </span>
        )}
      </div>

      {canAdvance && next ? (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 w-full justify-between"
          onClick={(e) => {
            e.stopPropagation();
            advance(order.id);
          }}
        >
          Avançar para{" "}
          {next === "preparo" ? "Em preparo" : next === "pronto" ? "Pronto" : "Entregue"}
          <ChevronRight className="size-4" />
        </Button>
      ) : null}

      {order.status === "entregue" && onPay ? (
        <Button
          variant="default"
          size="sm"
          className="mt-3 w-full justify-between bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
          onClick={(e) => {
            e.stopPropagation();
            onPay();
          }}
        >
          <span className="flex items-center gap-1.5">
            <Receipt className="size-4" />
            Receber pagamento
          </span>
          <ChevronRight className="size-4" />
        </Button>
      ) : null}
    </article>
  );
}
