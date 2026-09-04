import { useState } from "react";
import { OrderCard } from "./order-card";
import { OrderDialog } from "./order-dialog";
import { PaymentDialog } from "./payment-dialog";
import { useKeepServ } from "@/lib/keepserv/store";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  urgencyFor,
  type Order,
  type OrderStatus,
} from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

const COLUMN_ACCENT: Record<OrderStatus, string> = {
  pago: "border-t-ontime",
  pendente: "bg-accent",
  preparo: "bg-primary",
  pronto: "bg-ontime",
  entregue: "bg-muted-foreground",
};

export function Kanban() {
  const { orders, session, moveTo, now } = useKeepServ();
  const [openId, setOpenId] = useState<string | null>(null);
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [dragOver, setDragOver] = useState<OrderStatus | null>(null);

  const role = session?.role ?? "garcom";
  const openOrder = orders.find((o) => o.id === openId) ?? null;
  const canPay = role === "garcom" || role === "caixa" || role === "gestor";

  const canAdvanceIn = (status: OrderStatus) => {
    if (role === "gestor") return true;
    if (role === "cozinha") return status === "pendente" || status === "preparo";
    return status === "pronto";
  };

  const sortOrders = (list: Order[]) =>
    [...list].sort((a, b) =>
      a.priority === b.priority ? a.statusChangedAt - b.statusChangedAt : a.priority ? -1 : 1,
    );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATUS_ORDER.map((status) => {
          const list = sortOrders(orders.filter((o) => o.status === status));
          const late = list.filter((o) => urgencyFor(o, now) === "late").length;
          return (
            <section
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(status);
              }}
              onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveTo(id, status);
                setDragOver(null);
              }}
              className={cn(
                "flex min-h-[60vh] flex-col rounded-2xl border border-border bg-surface/70 p-3 transition-colors",
                dragOver === status && "border-primary bg-primary/5",
              )}
            >
              <header className="flex items-center gap-2 px-1 pb-3">
                <span className={cn("size-2.5 rounded-full", COLUMN_ACCENT[status])} />
                <h2 className="font-display text-sm font-semibold tracking-wide uppercase">
                  {STATUS_LABEL[status]}
                </h2>
                <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {list.length}
                </span>
                {late > 0 && (
                  <span className="ml-auto rounded-full bg-late-soft px-2 py-0.5 text-[11px] font-bold text-late-foreground">
                    {late} atrasado{late > 1 ? "s" : ""}
                  </span>
                )}
              </header>

              <div className="flex flex-1 flex-col gap-3">
                {list.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onOpen={() => setOpenId(order.id)}
                    canAdvance={canAdvanceIn(status)}
                    onPay={canPay ? () => setPayOrder(order) : undefined}
                  />
                ))}
                {list.length === 0 && (
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Nenhum pedido aqui
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <OrderDialog
        order={openOrder}
        onClose={() => setOpenId(null)}
        onPay={canPay ? (o) => setPayOrder(o) : undefined}
      />
      <PaymentDialog order={payOrder} onClose={() => setPayOrder(null)} />
    </>
  );
}
