import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChefHat,
  ExternalLink,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  QrCode,
  Shield,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useKeepServ } from "@/lib/keepserv/store";
import { ROLE_LABEL } from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, activeLoja, logout } = useKeepServ();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!session) navigate({ to: "/" });
  }, [session, navigate]);

  if (!session) return null;

  const isDev = session.nivel === "dev";
  const isGestor =
    session.nivel === "gestor" || session.nivel === "dono_loja" || session.role === "gestor";

  const nav = [
    { to: "/pedidos", label: "Quadro de pedidos", icon: KanbanSquare, show: true },
    {
      to: "/caixa",
      label: "Caixa",
      icon: Wallet,
      show: isDev || isGestor || session.role === "caixa",
    },
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: isDev || isGestor,
    },
    {
      to: "/equipe",
      label: "Minha Equipe",
      icon: Users,
      show: isGestor && !isDev, // Exclusivo para Gestor da Loja (Dev gerencia apenas lojas cadastradas)
    },
    {
      to: "/dev/lojas",
      label: "Dev Lojas",
      icon: Shield,
      show: isDev, // Exclusivo para Desenvolvedor
    },
  ].filter((n) => n.show);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          {/* Logo & Tenant Info */}
          <Link to="/pedidos" className="flex items-center gap-2.5 shrink-0">
            <span className="bg-brand-gradient flex size-9 items-center justify-center rounded-xl shadow-xs">
              <ChefHat className="size-5 text-primary-foreground" />
            </span>
            <div>
              <span className="font-display text-lg font-semibold tracking-tight">
                Keep<span className="text-accent">Serv</span>
              </span>
            </div>
          </Link>

          {/* Badge da Loja Atual (Tenant) */}
          {activeLoja && (
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs">
              <Store className="size-3.5 text-primary" />
              <span className="font-semibold text-foreground max-w-[140px] truncate">
                {activeLoja.nome_fantasia}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground bg-background px-1.5 py-0.2 rounded border border-border">
                {activeLoja.codigo_loja}
              </span>
            </div>
          )}

          {/* Navegação Principal */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors shrink-0",
                  pathname === n.to
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <n.icon className="size-4" />
                <span className="hidden sm:inline">{n.label}</span>
              </Link>
            ))}
          </nav>

          {/* Área do Usuário & Ações */}
          <div className="ml-auto flex items-center gap-2.5 shrink-0">
            <Link
              to="/cliente"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shadow-2xs"
              title="Abrir autoatendimento do cliente em nova aba"
            >
              <QrCode className="size-3.5 text-primary" />
              <span className="hidden lg:inline">Visão do Cliente</span>
              <ExternalLink className="size-3 opacity-60" />
            </Link>

            {/* Perfil & Nível de Acesso */}
            <div className="hidden text-right leading-tight sm:block pl-1">
              <p className="text-sm font-semibold">{session.name}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {session.nivel === "dev" && (
                  <Badge className="bg-purple-600 text-white text-[9px] px-1.5 py-0">
                    🛠️ Dev Super Admin
                  </Badge>
                )}
                {(session.nivel === "gestor" || session.nivel === "dono_loja") && (
                  <Badge className="bg-indigo-600 text-white text-[9px] px-1.5 py-0">
                    👑 Gestor da Loja
                  </Badge>
                )}
                {session.nivel === "colaborador" && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                    Colaborador · {ROLE_LABEL[session.role]}
                  </Badge>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Sair do sistema"
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              title="Sair da conta"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
