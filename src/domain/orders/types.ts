export type Role = "garcom" | "cozinha" | "gestor" | "caixa";

export type OrderStatus = "pendente" | "preparo" | "pronto" | "entregue" | "pago";

export type UrgencyLevel = "ontime" | "warn" | "late";

export type ProductCategory = "prato" | "entrada" | "bebida" | "sobremesa";

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  note?: string | undefined;
  category: ProductCategory;
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

export type PaymentMethod = "dinheiro" | "debito" | "credito" | "pix";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
  pix: "Pix",
};

export const TABLES_TOTAL = 24;

export interface OrderPaymentInfo {
  method: PaymentMethod;
  amount: number;
  splitCount: number;
  at: number;
  cashier: string;
  role?: Role;
}

export type Payment = OrderPaymentInfo;

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
  payment?: OrderPaymentInfo | undefined;
  billPrinted?: boolean | undefined;
  billPrintedAt?: number | undefined;
  cleanupRequested?: boolean | undefined;
  cleanupRequestedAt?: number | undefined;
  customerName?: string | undefined;
  customerPhone?: string | undefined;
  customerRegistered?: boolean | undefined;
  customerIdentifiedAt?: number | undefined;
}

export interface NewOrderInput {
  table: number;
  guests: number;
  items: {
    name: string;
    qty: number;
    price: number;
    category: ProductCategory;
    note?: string;
  }[];
  notes?: string;
  priority?: boolean;
  customerName?: string;
  customerPhone?: string;
  customerRegistered?: boolean;
  loja_id?: string;
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

export const SLA_MINUTES: Record<OrderStatus, { warn: number; late: number }> = {
  pendente: { warn: 4, late: 8 },
  preparo: { warn: 15, late: 25 },
  pronto: { warn: 3, late: 6 },
  entregue: { warn: 999, late: 999 },
  pago: { warn: 999, late: 999 },
};
