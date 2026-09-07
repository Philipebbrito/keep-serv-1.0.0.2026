import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ShieldAlert, Store, Users } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/keepserv/app-shell";
import { TeamManagement } from "@/components/keepserv/team-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useKeepServ } from "@/lib/keepserv/store";

export const Route = createFileRoute("/equipe")({
  head: () => ({
    meta: [
      { title: "Minha Equipe — Gestão de Colaboradores | Keep Serv" },
      {
        name: "description",
        content: "Painel exclusivo para o Dono da Loja gerenciar sua equipe e definir acessos.",
      },
    ],
  }),
  component: EquipePage,
});

function EquipePage() {
  const { session, activeLoja } = useKeepServ();
  const navigate = useNavigate();

  // --- MIDDLEWARE DE PROTEÇÃO DE ROTA (Item 5 da especificação) ---
  // "Restrinja o acesso desta página APENAS para usuários com 'nivel === dono_loja'."
  // Permite também o 'dev' caso esteja em modo de suporte.
  useEffect(() => {
    if (!session) {
      toast.error("Acesso restrito: faça login para acessar o painel da equipe.");
      const t = setTimeout(() => navigate({ to: "/" }), 1200);
      return () => clearTimeout(t);
    }

    if (session.nivel === "colaborador") {
      toast.error(
        "Acesso negado: apenas o Dono da Loja (dono_loja) pode gerenciar a equipe de colaboradores.",
      );
      const t = setTimeout(() => navigate({ to: "/pedidos" }), 1500);
      return () => clearTimeout(t);
    }
  }, [session, navigate]);

  // Se for colaborador, bloqueia visualmente e oferece navegação de volta aos pedidos
  if (session && session.nivel === "colaborador") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-md">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <ShieldAlert className="size-8" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-destructive">
              Acesso Exclusivo ao Dono da Loja
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Você está conectado como <strong>{session.name}</strong> com perfil de{" "}
              <Badge variant="outline" className="text-xs">
                Colaborador
              </Badge>
              . A gestão de equipe e definição de acessos é reservada exclusivamente para o Dono da
              Loja (<code>nivel: dono_loja</code>).
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate({ to: "/pedidos" })} className="w-full font-semibold">
                Voltar ao Quadro de Pedidos
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        {/* Banner do Tenant Atual */}
        {activeLoja && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600">
                <Store className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-lg font-bold text-foreground">
                    {activeLoja.nome_fantasia}
                  </h1>
                  <Badge className="bg-indigo-600 text-white text-[10px]">
                    Código: {activeLoja.codigo_loja}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Painel de Gestão da Equipe · Os novos colaboradores cadastrados serão vinculados
                  automaticamente a este estabelecimento.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {session?.nivel === "dono_loja" ? "👑 Dono da Loja" : "🛠️ Super Admin (Dev)"}
              </Badge>
            </div>
          </div>
        )}

        {/* Componente de Gestão de Equipe */}
        <TeamManagement />
      </div>
    </AppShell>
  );
}
