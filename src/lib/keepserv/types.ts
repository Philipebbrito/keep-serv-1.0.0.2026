export type Role = "garcom" | "cozinha" | "gestor" | "caixa";

// --- MULTI-TENANT & RBAC ---
export type NivelAcesso = "dev" | "dono_loja" | "gestor" | "colaborador";

export const NIVEL_LABEL: Record<NivelAcesso, string> = {
  dev: "Desenvolvedor (Super Admin)",
  dono_loja: "Gestor",
  gestor: "Gestor",
  colaborador: "Colaborador da Loja",
};

export const NIVEL_DESCRIPTION: Record<NivelAcesso, string> = {
  dev: "Acesso total e exclusivo ao cadastro e gestão de lojas cadastradas.",
  dono_loja: "Acesso total aos dados da sua própria loja e gestão exclusiva da sua equipe.",
  gestor: "Acesso total aos dados da sua própria loja e gestão exclusiva da sua equipe.",
  colaborador:
    "Acesso restrito apenas às operações rotineiras da loja (pedidos, cozinha ou caixa).",
};

export type StatusLoja = "ativo" | "inativo";

export interface Loja {
  id: string;
  nome_fantasia: string;
  codigo_loja: string; // único no sistema
  status: StatusLoja; // 'ativo' | 'inativo'
  created_at?: number;
  gestor_id?: string;
  dono_id?: string; // retrocompatibilidade
  cidade?: string;
  telefone?: string;
}

export type OrderStatus = "pendente" | "preparo" | "pronto" | "entregue" | "pago";

export type PaymentMethod = "dinheiro" | "debito" | "credito" | "pix";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
  pix: "Pix",
};

export interface Payment {
  method: PaymentMethod;
  amount: number;
  splitCount: number;
  at: number;
  cashier: string;
  role?: Role;
}

export type UrgencyLevel = "ontime" | "warn" | "late";

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  note?: string | undefined;
  category: "prato" | "entrada" | "bebida" | "sobremesa";
  price: number;
  canceled?: boolean;
}

export interface OrderMessage {
  id: string;
  from: Role;
  author: string;
  text: string;
  at: number;
}

export interface Order {
  id: string;
  loja_id: string; // Isolamento multi-tenant
  code: string;
  table: number;
  guests: number;
  waiter: string;
  status: OrderStatus;
  openedAt: number;
  statusChangedAt: number;
  items: OrderItem[];
  notes?: string | undefined;
  priority: boolean;
  messages: OrderMessage[];
  payment?: Payment | undefined;
  billPrinted?: boolean | undefined;
  billPrintedAt?: number | undefined;
  cleanupRequested?: boolean | undefined;
  cleanupRequestedAt?: number | undefined;
  customerName?: string | undefined;
  customerPhone?: string | undefined;
  customerRegistered?: boolean | undefined;
  customerIdentifiedAt?: number | undefined;
}

export const STATUS_ORDER: OrderStatus[] = ["pendente", "preparo", "pronto", "entregue"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pendente: "Pendente",
  preparo: "Em preparo",
  pronto: "Pronto",
  entregue: "Entregue",
  pago: "Pago",
};

export const ROLE_LABEL: Record<Role, string> = {
  garcom: "Garçom",
  cozinha: "Cozinha",
  gestor: "Gestor",
  caixa: "Caixa",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  garcom: "Lança pedidos, gerencia comandas no salão e chama atendimento.",
  cozinha: "Visualiza fila de pedidos, atualiza preparo e avisa o salão.",
  caixa: "Recebe pagamentos, divide contas e controla caixa da casa.",
  gestor: "Acesso irrestrito: dashboards operacionais, finanças e gestão de equipe.",
};

export interface UserAccount {
  id: string;
  loja_id: string | null; // Chave estrangeira para lojas.id (NULL para desenvolvedor 'dev')
  usuario: string; // Nome de usuário para login
  username: string; // alias para compatibilidade
  nome: string;
  name: string; // alias para retrocompatibilidade
  email: string;
  senha: string;
  password: string; // alias para retrocompatibilidade
  nivel: NivelAcesso; // 'dev' | 'gestor' | 'dono_loja' | 'colaborador'
  cargo?: Role; // Função operacional para colaboradores (garçom, cozinha, etc.)
  role: Role; // alias para compatibilidade com o sistema de pedidos
  phone: string;
  active: boolean;
  createdAt: number;
  lastPasswordChangeAt?: number;
  avatarColor?: string;
}

/** Limite (em minutos) por status antes de virar amarelo / vermelho. */
export const SLA_MINUTES: Record<OrderStatus, { warn: number; late: number }> = {
  pendente: { warn: 4, late: 8 },
  preparo: { warn: 15, late: 25 },
  pronto: { warn: 3, late: 6 },
  entregue: { warn: 999, late: 999 },
  pago: { warn: 999, late: 999 },
};

export function urgencyFor(order: Order, now: number): UrgencyLevel {
  const mins = (now - order.statusChangedAt) / 60000;
  const sla = SLA_MINUTES[order.status];
  if (mins >= sla.late) return "late";
  if (mins >= sla.warn) return "warn";
  return "ontime";
}

export function elapsedLabel(from: number, now: number): string {
  const total = Math.max(0, Math.floor((now - from) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}min`;
  return `${m}min ${String(s).padStart(2, "0")}s`;
}

export function orderTotal(order: Order): number {
  return order.items.filter((i) => !i.canceled).reduce((sum, i) => sum + i.price * i.qty, 0);
}

export type CashFlowType = "entrada" | "saida";

export type CashFlowCategory =
  | "venda_comanda"
  | "suprimento"
  | "sangria"
  | "insumos"
  | "pessoal_extra"
  | "manutencao"
  | "servicos"
  | "outros";

export const CASH_FLOW_CATEGORY_LABEL: Record<CashFlowCategory, string> = {
  venda_comanda: "Venda de Comanda",
  suprimento: "Suprimento de Troco",
  sangria: "Sangria de Caixa",
  insumos: "Compra de Insumos",
  pessoal_extra: "Diária de Extra / Freelancer",
  manutencao: "Manutenção & Reparos",
  servicos: "Serviços Operacionais",
  outros: "Outras Movimentações",
};

export interface CashFlowEntry {
  id: string;
  loja_id: string; // Isolamento multi-tenant
  type: CashFlowType;
  category: CashFlowCategory;
  description: string;
  amount: number;
  method?: PaymentMethod | "transferencia" | "outro";
  timestamp: number;
  author: string;
  orderCode?: string;
  orderId?: string;
  notes?: string;
}
