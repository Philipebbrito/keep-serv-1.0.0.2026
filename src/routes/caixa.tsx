import { createFileRoute } from "@tanstack/react-router";
import {
  Banknote,
  CreditCard,
  QrCode,
  Receipt,
  Wallet,
  Landmark,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/keepserv/app-shell";
import { PaymentDialog } from "@/components/keepserv/payment-dialog";
import { CashFlowManager } from "@/components/keepserv/cash-flow-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/state";
import { orderTotal, PAYMENT_LABEL, STATUS_LABEL, type Order, type PaymentMethod } from "@/domain";

export const Route = createFileRoute("/caixa")({
  head: () => ({
    meta: [
      { title: "Caixa & Fluxo Financeiro | Keep Serv" },
      {
        name: "description",
        content:
          "Receba pagamentos no balcão e consulte o histórico de fluxo de caixa com seletor de data e conciliação por dia.",
      },
      { property: "og:title", content: "Caixa & Fluxo Financeiro | Keep Serv" },
      {
        property: "og:description",
        content: "Feche comandas do bar no balcão e acesse o fluxo de caixa histórico dia a dia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <CaixaPage />
    </AppShell>
  ),
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const METHOD_ICON: Record<PaymentMethod, typeof Banknote> = {
  dinheiro: Banknote,
  debito: CreditCard,
  credito: CreditCard,
  pix: QrCode,
};

function CaixaPage() {
  const { orders } = useOrders();
  const [activeTab, setActiveTab] = useState<"fluxo" | "comandas">("fluxo");
  const [selected, setSelected] = useState<Order | null>(null);

  const open = orders.filter((o) => o.status !== "pago");
  const paid = orders.filter((o) => o.status === "pago");

  const received = paid.reduce((s, o) => s + (o.payment?.amount ?? 0), 0);
  const byMethod = (["dinheiro", "debito", "credito", "pix"] as PaymentMethod[]).map((m) => ({
    method: m,
    total: paid
      .filter((o) => o.payment?.method === m)
      .reduce((s, o) => s + (o.payment?.amount ?? 0), 0),
  }));

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Caixa & Operações Financeiras</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o fluxo de caixa com histórico por calendário ou realize o fechamento de
            comandas no balcão.
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("fluxo")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "fluxo"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="size-4 text-primary" />
            <span>Fluxo de Caixa & Histórico</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comandas")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "comandas"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="size-4 text-amber-500" />
            <span>Fechamento de Comandas ({open.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "fluxo" ? (
        <CashFlowManager />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card-elevated border-l-4 border-l-accent px-4 py-3.5">
              <p className="text-xs text-muted-foreground">Total recebido hoje</p>
              <p className="font-display text-2xl font-semibold tabular-nums">{brl(received)}</p>
            </div>
            <div className="card-elevated px-4 py-3.5">
              <p className="text-xs text-muted-foreground">Comandas fechadas</p>
              <p className="font-display text-2xl font-semibold tabular-nums">{paid.length}</p>
            </div>
            <div className="card-elevated px-4 py-3.5">
              <p className="text-xs text-muted-foreground">Comandas em aberto</p>
              <p className="font-display text-2xl font-semibold tabular-nums">{open.length}</p>
            </div>
            <div className="card-elevated px-4 py-3.5">
              <p className="mb-1.5 text-xs text-muted-foreground">Por forma de pagamento</p>
              <ul className="space-y-1">
                {byMethod.map(({ method, total }) => {
                  const Icon = METHOD_ICON[method];
                  return (
                    <li key={method} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon className="size-3.5" />
                        {PAYMENT_LABEL[method]}
                      </span>
                      <span className="font-medium tabular-nums">{brl(total)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <section className="mb-10">
            <h2 className="font-display mb-3 text-lg font-semibold">
              Aguardando pagamento
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({open.length})
              </span>
            </h2>
            {open.length === 0 ? (
              <div className="card-elevated flex flex-col items-center gap-2 px-6 py-12 text-center">
                <Wallet className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma comanda em aberto — tudo pago por aqui.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {open.map((o) => (
                  <article key={o.id} className="card-elevated flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-lg font-semibold">Mesa {o.table}</p>
                        <p className="text-xs text-muted-foreground">
                          {o.code} · {o.guests} pessoa(s) · {o.waiter}
                        </p>
                      </div>
                      <Badge variant="secondary">{STATUS_LABEL[o.status]}</Badge>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {o.items
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
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-display text-xl font-semibold tabular-nums">
                          {brl(orderTotal(o))}
                        </p>
                      </div>
                      <Button className="gap-2" onClick={() => setSelected(o)}>
                        <Receipt className="size-4" />
                        Receber
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {paid.length > 0 && (
            <section>
              <h2 className="font-display mb-3 text-lg font-semibold">Fechadas hoje</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {paid.map((o) => {
                  const Icon = METHOD_ICON[o.payment?.method ?? "pix"];
                  return (
                    <article
                      key={o.id}
                      className="card-elevated flex items-center justify-between gap-3 p-4"
                    >
                      <div>
                        <p className="font-semibold">
                          Mesa {o.table} · {o.code}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon className="size-3.5" />
                          {o.payment ? PAYMENT_LABEL[o.payment.method] : "—"}
                          {o.payment && o.payment.splitCount > 1
                            ? ` · dividido em ${o.payment.splitCount}`
                            : ""}
                        </p>
                      </div>
                      <p className="font-display text-lg font-semibold tabular-nums">
                        {brl(o.payment?.amount ?? 0)}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      <PaymentDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
