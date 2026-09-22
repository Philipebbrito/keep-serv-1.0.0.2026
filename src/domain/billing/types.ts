import type { PaymentMethod, Payment } from "../orders/types";

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

export interface NewCashFlowInput {
  type: CashFlowType;
  category: CashFlowCategory;
  description: string;
  amount: number;
  method?: PaymentMethod | "transferencia" | "outro";
  notes?: string;
  author?: string;
  loja_id?: string;
  timestamp?: number;
}

export type BillType = "pagar" | "receber";

export type BillCategory =
  | "aluguel"
  | "energia"
  | "agua"
  | "internet_telefone"
  | "contabilidade"
  | "folha_pagamento"
  | "sistema_software"
  | "impostos"
  | "fornecedor_insumos"
  | "fornecedor_bebidas"
  | "fornecedor_carnes"
  | "fornecedor_embalagens"
  | "manutencao"
  | "recebivel_cartao"
  | "evento_corporativo"
  | "reserva_faturada"
  | "voucher_refeicao"
  | "outro";

export type BillStatus = "pendente" | "agendado" | "pago" | "vencido" | "cancelado";

export type Recurrence = "nenhuma" | "mensal" | "quinzenal" | "anual";

export type BankConciliationStatus = "pendente" | "conciliado";

export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  agency: string;
  account: string;
  type: "corrente" | "digital" | "caixa_fisico";
}

export interface BillItem {
  id: string;
  loja_id: string;
  type: BillType;
  title: string;
  entityName: string; // Fornecedor, Beneficiário, Cliente ou Adquirente
  entityDocument?: string; // CNPJ ou CPF
  category: BillCategory;
  isFixedCost: boolean;
  recurrence: Recurrence;
  amount: number;
  dueDate: number;
  issueDate: number;
  status: BillStatus;
  barcode?: string;
  boletoBank?: string;
  invoiceNumber?: string;
  paidAt?: number;
  paidAmount?: number;
  paymentMethod?: string;
  bankAccount?: string;
  conciliationStatus: BankConciliationStatus;
  conciliatedAt?: number;
  conciliationRef?: string;
  notes?: string;
  author: string;
  createdAt: number;
}

export interface NewBillInput {
  loja_id?: string;
  type: BillType;
  title: string;
  entityName: string;
  entityDocument?: string;
  category: BillCategory;
  isFixedCost?: boolean;
  recurrence?: Recurrence;
  amount: number;
  dueDate: number;
  issueDate?: number;
  barcode?: string;
  boletoBank?: string;
  invoiceNumber?: string;
  notes?: string;
  bankAccount?: string;
}

export interface BankStatementItem {
  id: string;
  loja_id: string;
  bankAccount: string;
  date: number;
  description: string;
  documentNumber?: string;
  amount: number;
  conciliated: boolean;
  matchedBillId?: string;
  fitId: string;
}

export const BILL_CATEGORY_CONFIG: Record<
  BillCategory,
  { label: string; group: "custo_fixo" | "fornecedor" | "recebivel" | "outro"; color: string }
> = {
  aluguel: { label: "Aluguel do Imóvel", group: "custo_fixo", color: "text-amber-500" },
  energia: { label: "Energia Elétrica", group: "custo_fixo", color: "text-yellow-500" },
  agua: { label: "Água & Esgoto", group: "custo_fixo", color: "text-sky-500" },
  internet_telefone: {
    label: "Internet & Telefonia",
    group: "custo_fixo",
    color: "text-blue-500",
  },
  contabilidade: {
    label: "Honorários Contábeis",
    group: "custo_fixo",
    color: "text-purple-500",
  },
  folha_pagamento: {
    label: "Folha & Pró-labore",
    group: "custo_fixo",
    color: "text-indigo-500",
  },
  sistema_software: {
    label: "Sistemas & Licenças (SaaS)",
    group: "custo_fixo",
    color: "text-emerald-500",
  },
  impostos: { label: "Tributos & DAS Simples", group: "custo_fixo", color: "text-rose-500" },

  fornecedor_insumos: {
    label: "Fornecedor: Insumos Gerais",
    group: "fornecedor",
    color: "text-orange-500",
  },
  fornecedor_bebidas: {
    label: "Fornecedor: Bebidas & Chopp",
    group: "fornecedor",
    color: "text-amber-600",
  },
  fornecedor_carnes: {
    label: "Fornecedor: Carnes & Proteínas",
    group: "fornecedor",
    color: "text-red-500",
  },
  fornecedor_embalagens: {
    label: "Fornecedor: Descartáveis & Embalagens",
    group: "fornecedor",
    color: "text-stone-500",
  },
  manutencao: {
    label: "Manutenção & Equipamentos",
    group: "fornecedor",
    color: "text-cyan-500",
  },

  recebivel_cartao: {
    label: "Repasse de Cartão / Adquirente",
    group: "recebivel",
    color: "text-emerald-600",
  },
  evento_corporativo: {
    label: "Evento Corporativo / Banquete",
    group: "recebivel",
    color: "text-teal-600",
  },
  reserva_faturada: {
    label: "Reserva Faturada a Prazo",
    group: "recebivel",
    color: "text-blue-600",
  },
  voucher_refeicao: {
    label: "Repasse VR / Ticket Refeição",
    group: "recebivel",
    color: "text-lime-600",
  },
  outro: { label: "Outros Lançamentos", group: "outro", color: "text-gray-500" },
};

export const BILL_STATUS_LABEL: Record<
  BillStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pendente: { label: "A Vencer", variant: "secondary" },
  agendado: { label: "Agendado (DDA)", variant: "outline" },
  pago: { label: "Liquidado", variant: "default" },
  vencido: { label: "Vencido", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "secondary" },
};
