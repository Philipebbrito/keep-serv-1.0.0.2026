import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ShieldAlert, Store, Users } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/keepserv/app-shell";
import { TeamManagement } from "@/components/keepserv/team-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state";

export const Route = createFileRoute("/equipe")({
  head: () => ({
    meta: [
      { title: "Minha Equipe — Gestão de Colaboradores | Keep Serv" },
      {
        name: "description",
        content: "Painel exclusivo para o Gestor da Loja gerenciar sua equipe e definir acessos.",
      },
    ],
  }),
  component: EquipePage,
});

function EquipePage() {
  const { session, activeLoja } = useAuth();
  const navigate = useNavigate();

  // --- MIDDLEWARE DE PROTEÇÃO DE ROTA ---
  // Acesso exclusivo ao Gestor da Loja (nivel: gestor / dono_loja).
  // Desenvolvedor gerencia apenas lojas cadastradas e NÃO cadastra colaboradores.
  useEffect(() => {
    if (!session) {
      toast.error("Acesso restrito: faça login para acessar o painel da equipe.");
      const t = setTimeout(() => navigate({ to: "/" }), 1200);
      return () => clearTimeout(t);
    }

    if (session.nivel === "dev") {
      toast.error(
        "Acesso restrito: o Desenvolvedor gerencia apenas lojas cadastradas e não cadastra colaboradores.",
      );
      const t = setTimeout(() => navigate({ to: "/dev/lojas" }), 1500);
      return () => clearTimeout(t);
    }

    if (session.nivel === "colaborador") {
      toast.error(
        "Acesso negado: apenas o Gestor da Loja pode gerenciar a equipe de colaboradores.",
      );
      const t = setTimeout(() => navigate({ to: "/pedidos" }), 1500);
      return () => clearTimeout(t);
    }
  }, [session, navigate]);

  // Se for desenvolvedor, bloqueia visualmente informando a regra
  if (session && session.nivel === "dev") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 shadow-md">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-600">
              <ShieldAlert className="size-8" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
              Acesso Exclusivo ao Gestor da Loja
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Você está conectado como <strong>{session.name}</strong> com perfil de{" "}
              <Badge className="bg-purple-600 text-white text-xs">
                Desenvolvedor (Super Admin)
              </Badge>
              . O Desenvolvedor gerencia exclusivamente as <strong>lojas cadastradas</strong> e não
              cadastra colaboradores. A gestão da equipe é de competência do Gestor de cada loja.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => navigate({ to: "/dev/lojas" })}
                className="w-full font-semibold"
              >
                Ir para o Painel de Lojas Cadastradas
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

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
              Acesso Exclusivo ao Gestor da Loja
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Você está conectado como <strong>{session.name}</strong> com perfil de{" "}
              <Badge variant="outline" className="text-xs">
                Colaborador
              </Badge>
              . A gestão de equipe e definição de acessos é reservada exclusivamente para o Gestor
              da Loja (<code>nivel: gestor</code>).
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
                👑 Gestor da Loja
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
