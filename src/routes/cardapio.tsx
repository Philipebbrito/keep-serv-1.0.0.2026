import { createFileRoute, Link } from "@tanstack/react-router";
import { ChefHat, ArrowLeft } from "lucide-react";
import { DigitalMenuView } from "@/components/keepserv/digital-menu-view";

export const Route = createFileRoute("/cardapio")({
  head: () => ({
    meta: [
      { title: "Cardápio Digital | Keep Serv Bistrô & Bar" },
      {
        name: "description",
        content:
          "Cardápio digital completo com fotos, descrições, alergênicos e valores atualizados.",
      },
      { property: "og:title", content: "Cardápio Digital | Keep Serv" },
      { property: "og:description", content: "Cardápio completo no celular." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CardapioPage,
});

function CardapioPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
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
                Cardápio Digital
              </span>
            </div>
          </Link>

          <Link
            to="/cliente"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Voltar para Mesas</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6">
        <DigitalMenuView />
      </main>
    </div>
  );
}
