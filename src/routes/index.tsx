import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChefHat,
  ClipboardList,
  LineChart,
  Lock,
  Mail,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS } from "@/lib/keepserv/mock-data";
import { useKeepServ } from "@/lib/keepserv/store";
import type { Role } from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Keep Serv — Gestão de pedidos para bares e restaurantes" },
      {
        name: "description",
        content:
          "Keep Serv conecta garçons, cozinha e gestores em tempo real: quadro de pedidos kanban, mensagens rápidas e indicadores do salão.",
      },
      { property: "og:title", content: "Keep Serv — Gestão de pedidos em tempo real" },
      {
        property: "og:description",
        content:
          "Entre como garçom, cozinha ou gestor e acompanhe cada pedido do salão à praça quente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const ROLES: { id: Role; label: string; desc: string; icon: typeof ChefHat }[] = [
  {
    id: "garcom",
    label: "Garçom",
    desc: "Abre pedidos, acompanha o preparo e retira quando fica pronto.",
    icon: ClipboardList,
  },
  {
    id: "cozinha",
    label: "Cozinha",
    desc: "Recebe a fila, atualiza o preparo e avisa o salão.",
    icon: UtensilsCrossed,
  },
  {
    id: "gestor",
    label: "Gestor",
    desc: "Vê o salão inteiro, atrasos, tempo médio e indicadores.",
    icon: LineChart,
  },
  {
    id: "caixa",
    label: "Caixa",
    desc: "Fecha comandas, registra pagamentos e divide a conta.",
    icon: Wallet,
  },
];

function LoginPage() {
  const { login } = useKeepServ();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("garcom");
  const [email, setEmail] = useState(DEMO_ACCOUNTS["garcom"]!.email);
  const [password, setPassword] = useState("keepserv");

  const pickRole = (r: Role) => {
    setRole(r);
    setEmail(DEMO_ACCOUNTS[r]!.email);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, role);
    navigate({
      to: role === "gestor" ? "/dashboard" : role === "caixa" ? "/caixa" : "/pedidos",
    });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="bg-brand-gradient relative hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
            <ChefHat className="size-6 text-primary-foreground" />
          </span>
          <span className="font-display text-2xl font-semibold text-primary-foreground">
            Keep<span className="text-accent">Serv</span>
          </span>
        </div>

        <div className="max-w-lg">
          <h1 className="font-display text-5xl leading-[1.05] font-semibold text-primary-foreground">
            O salão e a cozinha falando a mesma língua.
          </h1>
          <p className="mt-5 text-lg text-primary-foreground/80">
            Quadro de pedidos em tempo real, alertas de atraso por cor e mensagens rápidas entre
            garçom e praça — tudo em uma tela só.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-primary-foreground/85">
            {[
              "Kanban Pendente → Preparo → Pronto → Entregue",
              "Cards que mudam de cor conforme o tempo de espera",
              "Mensagens rápidas pré-definidas por pedido",
              "Dashboard de mesas, atrasos e produtos mais vendidos",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-accent" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/60">
          Projeto Integrador · dados de demonstração
        </p>
      </aside>

      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="bg-brand-gradient flex size-10 items-center justify-center rounded-xl">
              <ChefHat className="size-5 text-primary-foreground" />
            </span>
            <span className="font-display text-xl font-semibold">
              Keep<span className="text-accent">Serv</span>
            </span>
          </div>

          <h2 className="font-display text-3xl font-semibold">Entrar no turno</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha seu perfil de acesso — cada um vê uma interface diferente.
          </p>

          <div className="mt-6 grid gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => pickRole(r.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                  role === r.id
                    ? "border-primary bg-primary/5 shadow-[var(--shadow-card)]"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    role === r.id ? "bg-primary text-primary-foreground" : "bg-secondary",
                  )}
                >
                  <r.icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.desc}</span>
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full">
              Entrar como {ROLES.find((r) => r.id === role)?.label}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Ambiente de demonstração: qualquer senha funciona.
          </p>
        </div>
      </div>
    </div>
  );
}
