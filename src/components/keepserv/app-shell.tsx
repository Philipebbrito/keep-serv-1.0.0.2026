import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChefHat,
  ExternalLink,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  QrCode,
  Wallet,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useKeepServ } from "@/lib/keepserv/store";
import { ROLE_LABEL } from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, logout } = useKeepServ();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!session) navigate({ to: "/" });
  }, [session, navigate]);

  if (!session) return null;

  const nav = [
    { to: "/pedidos", label: "Quadro de pedidos", icon: KanbanSquare, show: true },
    {
      to: "/caixa",
      label: "Caixa",
      icon: Wallet,
      show: session.role === "gestor" || session.role === "caixa" || session.role === "garcom",
    },
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: session.role === "gestor" || session.role === "garcom",
    },
  ].filter((n) => n.show);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-6 px-4 sm:px-6">
          <Link to="/pedidos" className="flex items-center gap-2.5">
            <span className="bg-brand-gradient flex size-9 items-center justify-center rounded-xl">
              <ChefHat className="size-5 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Keep<span className="text-accent">Serv</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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

          <div className="ml-auto flex items-center gap-2.5">
            <Link
              to="/cliente"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shadow-2xs"
              title="Abrir autoatendimento do cliente em nova aba"
            >
              <QrCode className="size-3.5 text-primary" />
              <span className="hidden md:inline">Visão do Cliente</span>
              <ExternalLink className="size-3 opacity-60" />
            </Link>

            <div className="hidden text-right leading-tight sm:block pl-1">
              <p className="text-sm font-semibold">{session.name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABEL[session.role]}</p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Sair" onClick={logout}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
