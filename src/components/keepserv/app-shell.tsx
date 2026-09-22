import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HeartHandshake,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Receipt,
  Shield,
  Store,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCustomerBirthdayInfo, ROLE_LABEL, urgencyFor } from "@/domain";
import { useAuth, useBilling, useCustomers, useMenu, useOrders, useStock } from "@/state";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof KanbanSquare;
  badge?: string | number | null;
  badgeVariant?: "default" | "secondary" | "destructive" | "warning";
  external?: boolean;
  show: boolean;
  search?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function AppShell({ children }: { children: ReactNode }) {
  const { session, activeLoja, logout, users } = useAuth();
  const { orders, now } = useOrders();
  const { stockItems } = useStock();
  const { products } = useMenu();
  const { bills } = useBilling();
  const { customers } = useCustomers();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Estado de colapso da sidebar persistido no localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("keepserv_sidebar_collapsed") === "true";
    }
    return false;
  });

  // Estado do drawer no mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Rastreia search params para abas internas
  const [currentSearch, setCurrentSearch] = useState<string>(() => {
    if (typeof window !== "undefined") return window.location.search;
    return "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleUrl = () => setCurrentSearch(window.location.search);
    window.addEventListener("popstate", handleUrl);
    return () => window.removeEventListener("popstate", handleUrl);
  }, [pathname]);

  // Rastreia busca da rota pelo router para reação imediata
  const routerLocation = useRouterState({ select: (s) => s.location });

  // Salva preferência no localStorage
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("keepserv_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  // Suporte a atalho de teclado Ctrl+B / Cmd+B para alternar menu lateral
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fecha o drawer mobile ao trocar de rota
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Redirecionamento por perfil e autenticação
  useEffect(() => {
    if (!session) {
      navigate({ to: "/" });
    } else if (session.nivel === "dev" && pathname !== "/dev/lojas") {
      navigate({ to: "/dev/lojas" });
    }
  }, [session, pathname, navigate]);

  if (!session) return null;

  const isDev = session.nivel === "dev";
  const isGestor =
    session.nivel === "gestor" || session.nivel === "dono_loja" || session.role === "gestor";
  const isGarcom = session.role === "garcom";

  // Métricas dinâmicas para os badges em tempo real
  const activeOrders = orders.filter((o) => o.status !== "entregue" && o.status !== "pago");
  const lateOrders = activeOrders.filter((o) => urgencyFor(o, now) === "late");
  const openOrdersToPay = orders.filter((o) => o.status !== "pago");
  const lowStockCount = stockItems.filter((s) => s.currentStock <= s.minStock).length;
  const occupiedTablesCount = new Set(activeOrders.map((o) => o.table)).size;
  const pendingBillsCount = bills.filter(
    (b) =>
      b.type === "pagar" &&
      (b.status === "pendente" || b.status === "agendado" || b.status === "vencido"),
  ).length;
  const overdueBillsCount = bills.filter(
    (b) => b.type === "pagar" && b.status !== "pago" && (b.status === "vencido" || b.dueDate < now),
  ).length;
  const birthdayCount = customers.filter((c) => getCustomerBirthdayInfo(c).isThisMonth).length;

  // Rastreia busca da rota pelo router para reação imediata
  const activeTabParam = ((routerLocation?.search as Record<string, unknown>)?.tab as string) || "";
  const effectiveSearch = activeTabParam
    ? `?tab=${activeTabParam}`
    : typeof window !== "undefined"
      ? window.location.search
      : "";

  // Agrupamento semântico de navegação
  const navGroups: NavGroup[] = [
    {
      title: "Operação & Salão",
      items: [
        {
          to: "/dashboard",
          search: "?tab=operacao",
          label: "Operação do Salão",
          icon: LayoutDashboard,
          badge: occupiedTablesCount > 0 ? `${occupiedTablesCount} mesas` : null,
          badgeVariant: lateOrders.length > 0 ? "destructive" : "secondary",
          show: !isDev && (isGestor || isGarcom),
        },
        {
          to: "/dashboard",
          search: "?tab=garcom",
          label: "Terminal do Garçom",
          icon: UserCheck,
          show: !isDev && (isGarcom || isGestor),
        },
        {
          to: "/pedidos",
          label: "Quadro de pedidos",
          icon: KanbanSquare,
          badge: activeOrders.length > 0 ? activeOrders.length : null,
          badgeVariant: lateOrders.length > 0 ? "destructive" : "secondary",
          show: !isDev,
        },
        {
          to: "/caixa",
          label: "Caixa & Balcão",
          icon: Wallet,
          badge: openOrdersToPay.length > 0 ? openOrdersToPay.length : null,
          badgeVariant: "secondary",
          show: !isDev && (isGestor || session.role === "caixa"),
        },
        {
          to: "/cliente",
          label: "Cardápio do Cliente",
          icon: QrCode,
          badge: "QR Code",
          badgeVariant: "secondary",
          external: true,
          show: !isDev,
        },
      ].filter((i) => i.show),
    },
    {
      title: "Gestão & PDV",
      items: [
        {
          to: "/dashboard",
          search: "?tab=cardapio",
          label: "Cardápio & Itens",
          icon: UtensilsCrossed,
          badge: products.length > 0 ? `${products.length} itens` : null,
          badgeVariant: "secondary",
          show: !isDev && isGestor,
        },
        {
          to: "/dashboard",
          search: "?tab=estoque",
          label: "Estoque & Insumos",
          icon: Boxes,
          badge: lowStockCount > 0 ? `${lowStockCount} baixo` : `${stockItems.length} itens`,
          badgeVariant: lowStockCount > 0 ? "warning" : "secondary",
          show: !isDev && isGestor,
        },
        {
          to: "/dashboard",
          search: "?tab=fluxo_caixa",
          label: "Fluxo de Caixa",
          icon: Wallet,
          badge: "Ao vivo",
          badgeVariant: "secondary",
          show: !isDev && isGestor,
        },
        {
          to: "/dashboard",
          search: "?tab=contas_pagar_receber",
          label: "Contas a Pagar & Receber",
          icon: Receipt,
          badge:
            overdueBillsCount > 0
              ? `${overdueBillsCount} vencidos`
              : pendingBillsCount > 0
                ? `${pendingBillsCount} títulos`
                : null,
          badgeVariant: overdueBillsCount > 0 ? "destructive" : "secondary",
          show: !isDev && isGestor,
        },
        {
          to: "/dashboard",
          search: "?tab=clientes_crm",
          label: "Clientes (CRM)",
          icon: HeartHandshake,
          badge:
            birthdayCount > 0
              ? `${birthdayCount} niver`
              : customers.length > 0
                ? `${customers.length} clientes`
                : null,
          badgeVariant: birthdayCount > 0 ? "warning" : "secondary",
          show: !isDev && isGestor,
        },
        {
          to: "/dashboard",
          search: "?tab=equipe",
          label: "Minha Equipe",
          icon: Users,
          badge: users.length > 0 ? `${users.length} membros` : null,
          badgeVariant: "secondary",
          show: !isDev && isGestor,
        },
      ].filter((i) => i.show),
    },
    {
      title: "Administração",
      items: [
        {
          to: "/dev/lojas",
          label: "Dev Multi-Lojas",
          icon: Shield,
          badge: "Master",
          badgeVariant: "default",
          show: isDev,
        },
      ].filter((i) => i.show),
    },
  ].filter((g) => g.items.length > 0);

  // Helper de checagem de rota ativa
  const isItemActive = (item: NavItem) => {
    if (item.external) return false;
    if (item.to === "/dashboard") {
      if (pathname !== "/dashboard") return false;
      const expectedTab = item.search?.replace("?tab=", "") || "operacao";
      const currentTab = activeTabParam || effectiveSearch.replace("?tab=", "") || "operacao";
      return currentTab === expectedTab;
    }
    return pathname === item.to;
  };

  // Título e ícone da seção atual para o Breadcrumb do Top Header
  const getCurrentSectionInfo = () => {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isItemActive(item)) {
          return { label: item.label, icon: item.icon, group: group.title };
        }
      }
    }
    if (pathname === "/caixa") {
      return { label: "Caixa & Fluxo Financeiro", icon: Wallet, group: "Operação & Salão" };
    }
    if (pathname === "/pedidos") {
      return { label: "Quadro de Pedidos", icon: KanbanSquare, group: "Operação & Salão" };
    }
    if (pathname === "/dashboard") {
      const currentTab = activeTabParam || effectiveSearch.replace("?tab=", "") || "operacao";
      if (currentTab === "operacao") {
        return { label: "Operação do Salão", icon: LayoutDashboard, group: "Operação & Salão" };
      }
      if (currentTab === "garcom") {
        return { label: "Terminal do Garçom", icon: UserCheck, group: "Operação & Salão" };
      }
      return { label: "Dashboard Operacional", icon: LayoutDashboard, group: "Gestão & PDV" };
    }
    if (pathname === "/equipe") {
      return { label: "Minha Equipe", icon: Users, group: "Gestão & PDV" };
    }
    if (pathname === "/dev/lojas") {
      return { label: "Gestão de Lojas Multi-tenant", icon: Shield, group: "Administração" };
    }
    return { label: "KeepServ", icon: ChefHat, group: "Sistema" };
  };

  const currentSection = getCurrentSectionInfo();
  const SectionIcon = currentSection.icon;

  // Iniciais do usuário para o avatar
  const userInitials = session.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Renderizador do Conteúdo da Sidebar (compartilhado entre Desktop e Mobile)
  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex h-full flex-col justify-between select-none">
      {/* Topo: Marca & Loja */}
      <div className="flex flex-col">
        {/* Cabeçalho da Marca */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-border/80 px-4 transition-all",
            collapsed ? "justify-center px-2" : "justify-between",
          )}
        >
          <Link
            to={isDev ? "/dev/lojas" : "/pedidos"}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <span className="bg-brand-gradient flex size-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform group-hover:scale-105">
              <ChefHat className="size-5 text-primary-foreground" />
            </span>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-display text-lg font-bold tracking-tight leading-none text-foreground">
                  Keep<span className="text-accent">Serv</span>
                </span>
                <span className="text-[11px] font-medium text-muted-foreground tracking-wide mt-0.5">
                  Bar & Restaurante
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Card do Estabelecimento (Tenant Ativo) */}
        {activeLoja && (
          <div className="p-3">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex size-10 mx-auto items-center justify-center rounded-xl border border-border/70 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                    <Store className="size-4 text-primary" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  <p className="font-semibold text-xs">{activeLoja.nome_fantasia}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {activeLoja.codigo_loja} · Em operação
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="rounded-xl border border-border/70 bg-muted/40 p-2.5 transition-colors hover:border-border">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Store className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground leading-snug">
                      {activeLoja.nome_fantasia}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {activeLoja.codigo_loja}
                      </span>
                      <span className="text-[10px] text-muted-foreground">· Aberto</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de Navegação por Grupos */}
        <nav className="flex-1 space-y-5 px-3 py-2 overflow-y-auto max-h-[calc(100vh-250px)]">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed ? (
                <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {group.title}
                </p>
              ) : (
                <div className="my-1.5 h-px bg-border/40" />
              )}

              <div className="space-y-1 pt-0.5">
                {group.items.map((item) => {
                  const active = isItemActive(item);
                  const Icon = item.icon;

                  const linkElement = (
                    <Link
                      to={item.to}
                      search={
                        item.search
                          ? ({ tab: item.search.replace("?tab=", "") } as Record<string, string>)
                          : undefined
                      }
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all",
                        collapsed ? "justify-center px-0 size-11 mx-auto" : "w-full",
                        active
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-transform group-hover:scale-110",
                          active
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />

                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge !== null && item.badge !== undefined && (
                            <span
                              className={cn(
                                "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                                active
                                  ? "bg-primary-foreground/20 text-primary-foreground"
                                  : item.badgeVariant === "destructive"
                                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
                                    : item.badgeVariant === "warning"
                                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                                      : "bg-muted text-muted-foreground",
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                          {item.external && <ExternalLink className="size-3 opacity-50 shrink-0" />}
                        </>
                      )}

                      {/* Notificação flutuante no modo colapsado */}
                      {collapsed && item.badge !== null && item.badge !== undefined && (
                        <span
                          className={cn(
                            "absolute top-1.5 right-1.5 size-2 rounded-full",
                            item.badgeVariant === "destructive"
                              ? "bg-rose-500 animate-pulse"
                              : item.badgeVariant === "warning"
                                ? "bg-amber-500 animate-pulse"
                                : "bg-primary",
                          )}
                        />
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.to + (item.search || "")}>
                        <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                        <TooltipContent
                          side="right"
                          sideOffset={12}
                          className="flex items-center gap-2"
                        >
                          <span className="font-semibold">{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.2 rounded font-mono">
                              {item.badge}
                            </span>
                          )}
                          {item.external && <ExternalLink className="size-3" />}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.to + (item.search || "")}>{linkElement}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Rodapé da Sidebar: Perfil do Usuário */}
      <div className="border-t border-border/80 p-3 space-y-2 bg-card/60">
        {/* Card do Usuário */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex size-10 mx-auto items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs cursor-pointer border border-primary/20">
                {userInitials}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              <p className="font-semibold text-xs">{session.name}</p>
              <p className="text-[10px] text-muted-foreground">{ROLE_LABEL[session.role]}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {session.nivel === "dev"
                  ? "Dev Super Admin"
                  : isGestor
                    ? "Gestor da Loja"
                    : "Colaborador"}
              </p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/40 p-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs border border-primary/20">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground leading-tight">
                {session.name}
              </p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {session.nivel === "dev" && (
                  <Badge className="bg-purple-600 text-white text-[9px] px-1.5 py-0">🛠️ Dev</Badge>
                )}
                {(session.nivel === "gestor" || session.nivel === "dono_loja") && (
                  <Badge className="bg-indigo-600 text-white text-[9px] px-1.5 py-0">
                    👑 Gestor
                  </Badge>
                )}
                {session.nivel === "colaborador" && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                    {ROLE_LABEL[session.role]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No modo colapsado, botão de logout individual */}
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen w-full bg-background text-foreground antialiased overflow-x-hidden">
        {/* ========================================================= */}
        {/* SIDEBAR DESKTOP (FIXA / RECOLHÍVEL NA LATERAL ESQUERDA)   */}
        {/* ========================================================= */}
        <aside
          className={cn(
            "hidden lg:flex flex-col shrink-0 border-r border-border bg-card/95 backdrop-blur-xs sticky top-0 h-screen z-30 transition-[width] duration-300 ease-in-out",
            isCollapsed ? "w-[72px]" : "w-64",
          )}
        >
          {renderSidebarContent(isCollapsed)}
        </aside>

        {/* ========================================================= */}
        {/* DRAWER MOBILE (SLIDE-OVER LATERAL ESQUERDO)               */}
        {/* ========================================================= */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Painel do Drawer */}
            <div className="relative flex w-72 flex-col bg-card border-r border-border h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250">
              <div className="absolute top-3 right-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X className="size-4" />
                </Button>
              </div>
              {renderSidebarContent(false)}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ÁREA PRINCIPAL: TOP HEADER + CONTEÚDO (MAIN)             */}
        {/* ========================================================= */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Barra Superior Integrada */}
          <header className="sticky top-0 z-20 h-15 border-b border-border/80 bg-background/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3">
            {/* Lado Esquerdo: Toggle Lateral & Breadcrumb Contextual */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Botão Mobile Hamburger */}
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden size-9 shrink-0"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Abrir menu de navegação"
              >
                <Menu className="size-4" />
              </Button>

              {/* Botão Toggle Desktop */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="hidden lg:flex size-9 shrink-0 text-muted-foreground hover:text-foreground"
                title={
                  isCollapsed ? "Expandir menu lateral (Ctrl+B)" : "Recolher menu lateral (Ctrl+B)"
                }
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </Button>

              {/* Indicador de Seção Atual (Breadcrumb visual) */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="hidden sm:flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <SectionIcon className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-wider hidden sm:block leading-none">
                    {currentSection.group}
                  </span>
                  <h2 className="text-sm sm:text-base font-semibold text-foreground truncate leading-tight mt-0.5">
                    {currentSection.label}
                  </h2>
                </div>
              </div>
            </div>

            {/* Lado Direito: Loja Ativa, Ações Rápidas & Perfil */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Status da Loja Ativa */}
              {activeLoja && (
                <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-foreground max-w-[130px] truncate">
                    {activeLoja.nome_fantasia}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground bg-background px-1.5 py-0.2 rounded border border-border">
                    {activeLoja.codigo_loja}
                  </span>
                </div>
              )}

              {/* Atalho: Visão do Cliente */}
              {!isDev && (
                <Link
                  to="/cliente"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shadow-2xs"
                  title="Abrir o cardápio digital do salão em nova aba"
                >
                  <QrCode className="size-3.5 text-primary" />
                  <span className="hidden xl:inline">Visão do Cliente</span>
                  <ExternalLink className="size-3 opacity-60" />
                </Link>
              )}

              {/* Perfil Compacto no Header */}
              <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-border/60">
                <div className="text-right leading-tight">
                  <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                    {session.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {session.nivel === "dev"
                      ? "Dev Super Admin"
                      : isGestor
                        ? "Gestor"
                        : ROLE_LABEL[session.role]}
                  </p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                  {userInitials}
                </div>
              </div>

              {/* Botão de Logout rápido */}
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:text-destructive"
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
          </header>

          {/* Conteúdo Dinâmico da Rota */}
          <main className="flex-1 w-full">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
