import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/keepserv/app-shell";
import { Kanban } from "@/components/keepserv/kanban";
import { NewOrderDialog } from "@/components/keepserv/new-order-dialog";
import { Button } from "@/components/ui/button";
import { useKeepServ } from "@/lib/keepserv/store";
import { urgencyFor } from "@/lib/keepserv/types";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Quadro de pedidos em tempo real | Keep Serv" },
      {
        name: "description",
        content:
          "Kanban de pedidos do salão: pendente, em preparo, pronto e entregue, com alerta visual de atraso e mensagens rápidas.",
      },
      { property: "og:title", content: "Quadro de pedidos em tempo real | Keep Serv" },
      {
        property: "og:description",
        content: "Acompanhe cada comanda do bar e restaurante do pedido à entrega.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <PedidosPage />
    </AppShell>
  ),
});

const ROLE_HINT = {
  garcom: "Você acompanha o preparo e avança os pedidos prontos para entregue.",
  cozinha: "Você aceita a fila e move os pedidos de preparo até pronto.",
  gestor: "Visão completa do salão — você pode mover qualquer pedido.",
  caixa: "Acompanhe o salão e feche as contas na seção Caixa.",
} as const;

function PedidosPage() {
  const { orders, session, now } = useKeepServ();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  if (!session) return null;

  const canCreateOrder = session.role === "garcom" || session.role === "gestor";
  const late = orders.filter(
    (o) => o.status !== "entregue" && urgencyFor(o, now) === "late",
  ).length;
  const active = orders.filter((o) => o.status !== "entregue").length;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Quadro de pedidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ROLE_HINT[session.role]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canCreateOrder && (
            <Button onClick={() => setNewOrderOpen(true)} className="gap-2">
              <Plus className="size-4" />
              Novo pedido
            </Button>
          )}
          <div className="card-elevated px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Pedidos ativos</p>
            <p className="font-display text-xl font-semibold tabular-nums">{active}</p>
          </div>
          <div className="card-elevated border-l-4 border-l-late px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Em atraso</p>
            <p className="font-display text-xl font-semibold text-late-foreground tabular-nums">
              {late}
            </p>
          </div>
        </div>
      </div>
      <Kanban />
      <NewOrderDialog open={newOrderOpen} onClose={() => setNewOrderOpen(false)} />
    </div>
  );
}
