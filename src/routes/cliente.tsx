import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ChefHat,
  Clock,
  QrCode,
  Search,
  Sparkles,
  Table2,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DigitalMenuView } from "@/components/keepserv/digital-menu-view";
import { useOrders } from "@/state";
import { orderTotal, TABLE_REASON_LABEL, type TableStatusReason } from "@/domain";

export const Route = createFileRoute("/cliente")({
  head: () => ({
    meta: [
      { title: "Área do Cliente | Keep Serv Bistrô & Bar" },
      {
        name: "description",
        content:
          "Cardápio digital, consulta de comanda em tempo real e pagamentos via Pix pelo celular.",
      },
      { property: "og:title", content: "Área do Cliente | Keep Serv" },
      {
        property: "og:description",
        content: "Acesse o cardápio e a comanda da sua mesa no Keep Serv.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ClientePage,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ClientePage() {
  const { orders, tables, activeTables } = useOrders();
  const navigate = useNavigate();
  const [comandaInput, setComandaInput] = useState("");
  const [activeTab, setActiveTab] = useState<"mesas" | "cardapio">("mesas");

  const handleOpenComanda = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = comandaInput.trim().replace("#", "");
    if (!clean) return;

    // Se for número de mesa existente
    const num = parseInt(clean, 10);
    const tableFound = !isNaN(num) ? tables.find((t) => t.id === num) : undefined;
    if (tableFound) {
      if (!tableFound.active) {
        const reasonText = tableFound.statusReason
          ? TABLE_REASON_LABEL[tableFound.statusReason as TableStatusReason] ||
            tableFound.statusReason
          : "Em Manutenção";
        toast.warning(`A Mesa ${num} está temporariamente fora de operação (${reasonText}).`);
      }
      navigate({ to: "/mesa/$tableId", params: { tableId: String(num) } });
      return;
    }

    // Caso contrário, busca por ID ou código da comanda
    const found = orders.find((o) => o.id === clean || o.code.replace("#", "") === clean);
    if (found) {
      navigate({ to: "/comanda/$orderId", params: { orderId: found.id } });
    } else {
      navigate({ to: "/comanda/$orderId", params: { orderId: clean } });
    }
  };

  const getTableActiveOrder = (tableNum: number) => {
    return orders.find((o) => o.table === tableNum && o.status !== "pago");
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header do Cliente */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/cliente" className="flex items-center gap-2.5">
            <span className="bg-brand-gradient flex size-9 items-center justify-center rounded-xl shadow-xs">
              <ChefHat className="size-5 text-primary-foreground" />
            </span>
            <div>
              <span className="font-display text-base sm:text-lg font-bold tracking-tight">
                Keep<span className="text-accent">Serv</span>
              </span>
              <span className="block text-[10px] text-muted-foreground font-medium -mt-1">
                Bistrô & Bar
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("mesas")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "mesas"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Table2 className="size-3.5" />
                <span>Mesas & Comanda</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("cardapio")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === "cardapio"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="size-3.5" />
                <span>Cardápio Digital</span>
              </button>
            </div>

            <Link
              to="/"
              className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors"
            >
              Área da Equipe
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6">
        {activeTab === "mesas" ? (
          <div className="space-y-6">
            {/* Banner de Boas-vindas */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-2">
                <Badge
                  variant="secondary"
                  className="text-[11px] gap-1 px-2.5 py-0.5 bg-primary/10 text-primary font-medium"
                >
                  <Sparkles className="size-3" />
                  Autoatendimento Digital
                </Badge>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Seja bem-vindo ao KeepServ!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Selecione a mesa abaixo ou digite o código da sua comanda para acompanhar os
                  pedidos em tempo real, ou pagar via Pix.
                </p>

                {/* Busca rápida de comanda */}
                <form
                  onSubmit={handleOpenComanda}
                  className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Nº da mesa (ex: 4) ou código da comanda..."
                      value={comandaInput}
                      onChange={(e) => setComandaInput(e.target.value)}
                      className="pl-9 h-10 text-xs sm:text-sm bg-background"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="default"
                    className="h-10 text-xs font-semibold gap-1.5"
                  >
                    <QrCode className="size-4" />
                    <span>Acessar</span>
                  </Button>
                </form>
              </div>
            </div>

            {/* Grid de Mesas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Table2 className="size-4 text-primary" />
                    Selecione a sua Mesa
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Toque na sua mesa para abrir o cardápio e ver os itens consumidos.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {activeTables.length} mesas em operação ({tables.length} no salão)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {tables.map((t) => {
                  const activeOrder = getTableActiveOrder(t.id);
                  const hasActive = !!activeOrder;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (!t.active) {
                          const reasonText = t.statusReason
                            ? TABLE_REASON_LABEL[t.statusReason as TableStatusReason] ||
                              t.statusReason
                            : "Em Manutenção";
                          toast.warning(
                            `A Mesa ${t.id} está temporariamente fora de operação (${reasonText}).`,
                          );
                        }
                        navigate({
                          to: "/mesa/$tableId",
                          params: { tableId: String(t.id) },
                        });
                      }}
                      className={`group relative flex flex-col items-center justify-between rounded-xl border p-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        !t.active
                          ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 opacity-85"
                          : hasActive
                            ? "border-primary/40 bg-card hover:border-primary shadow-xs"
                            : "border-border/80 bg-muted/20 hover:border-border hover:bg-card"
                      }`}
                    >
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center font-bold text-base mb-2 transition-colors ${
                          !t.active
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                            : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                        }`}
                      >
                        {t.id}
                      </div>

                      <span className="font-semibold text-xs text-foreground">
                        {t.label || `Mesa ${t.id}`}
                      </span>

                      <div className="mt-2 w-full">
                        {!t.active ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] w-full justify-center bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium"
                          >
                            Fora de Operação
                          </Badge>
                        ) : hasActive ? (
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] w-full justify-center bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            >
                              Comanda Aberta
                            </Badge>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] w-full justify-center text-muted-foreground font-normal"
                          >
                            Livre para Pedir
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <DigitalMenuView />
          </div>
        )}
      </main>
    </div>
  );
}
