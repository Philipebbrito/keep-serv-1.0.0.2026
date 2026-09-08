export type BillType = "pagar" | "receber";

export type BillCategory =
  // Custos Fixos
  | "aluguel"
  | "energia"
  | "agua"
  | "internet_telefone"
  | "contabilidade"
  | "folha_pagamento"
  | "sistema_software"
  | "impostos"
  // Fornecedores & Insumos
  | "fornecedor_insumos"
  | "fornecedor_bebidas"
  | "fornecedor_carnes"
  | "fornecedor_embalagens"
  | "manutencao"
  // Contas a Receber
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
  isFixedCost: boolean; // Custo Fixo / Recorrente
  recurrence: Recurrence;
  amount: number;
  dueDate: number; // timestamp vencimento
  issueDate: number; // timestamp emissão
  status: BillStatus;
  barcode?: string; // Linha digitável ou código de barras do boleto
  boletoBank?: string; // Banco do boleto (ex: Itaú, Bradesco)
  invoiceNumber?: string; // Número NF ou pedido
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

export type NewBillInput = {
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
};

export interface BankStatementItem {
  id: string;
  loja_id: string;
  bankAccount: string;
  date: number;
  description: string;
  documentNumber?: string;
  amount: number; // positivo = crédito/recebimento, negativo = débito/pagamento
  conciliated: boolean;
  matchedBillId?: string;
  fitId: string;
}

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "itau-pj",
    name: "Itaú PJ - Operacional Principal",
    bank: "Banco Itaú (341)",
    agency: "0450",
    account: "12345-6",
    type: "corrente",
  },
  {
    id: "nubank-pj",
    name: "Nubank PJ - Reserva & Pix",
    bank: "Nu Pagamentos (260)",
    agency: "0001",
    account: "9876543-2",
    type: "digital",
  },
  {
    id: "stone-conta",
    name: "Stone Conta Digital - Adquirência",
    bank: "Stone IP (197)",
    agency: "0001",
    account: "554433-1",
    type: "digital",
  },
  {
    id: "caixa-pdv",
    name: "Caixa Físico / Gaveta PDV",
    bank: "Caixa Interno",
    agency: "0000",
    account: "BALCAO-01",
    type: "caixa_fisico",
  },
];

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

const DAY_MS = 86400000;
const HOUR_MS = 3600000;
const NOW = Date.now();

export const INITIAL_BILLS: BillItem[] = [
  // --- FORNECEDORES COM BOLETO ---
  {
    id: "bill-001",
    loja_id: "loja-1",
    type: "pagar",
    title: "Carnes Nobres - Picanha, Ancho e Maminha",
    entityName: "Frigorífico Boi Nobre Ltda",
    entityDocument: "14.892.401/0001-88",
    category: "fornecedor_carnes",
    isFixedCost: false,
    recurrence: "nenhuma",
    amount: 3450.0,
    dueDate: NOW + 2 * DAY_MS, // Vence em 2 dias
    issueDate: NOW - 12 * DAY_MS,
    status: "pendente",
    barcode: "34191.79001 01043.510047 91020.150008 5 95600000345000",
    boletoBank: "Banco Itaú (341)",
    invoiceNumber: "NF-e 88204",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "pendente",
    notes: "Entrega recebida pela cozinha. 45kg de picanha e 30kg de ancho com laudo de qualidade.",
    author: "Carlos Gerente",
    createdAt: NOW - 12 * DAY_MS,
  },
  {
    id: "bill-002",
    loja_id: "loja-1",
    type: "pagar",
    title: "Chopp Pilsen, IPA e Refrigerantes Lata",
    entityName: "Distribuidora Ambev / Femsa",
    entityDocument: "02.808.708/0001-07",
    category: "fornecedor_bebidas",
    isFixedCost: false,
    recurrence: "nenhuma",
    amount: 2180.5,
    dueDate: NOW + 5 * DAY_MS,
    issueDate: NOW - 9 * DAY_MS,
    status: "agendado",
    barcode: "23793.38128 60014.204018 14008.102341 1 95630000218050",
    boletoBank: "Bradesco (237)",
    invoiceNumber: "NF-e 390124",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "pendente",
    notes: "Agendamento automático via DDA bancário para o dia de vencimento.",
    author: "Carlos Gerente",
    createdAt: NOW - 9 * DAY_MS,
  },
  {
    id: "bill-003",
    loja_id: "loja-1",
    type: "pagar",
    title: "Vegetais Frescos, Frutas e Ervas da Semana",
    entityName: "Hortifruti São Bento & Cia",
    entityDocument: "22.341.902/0001-44",
    category: "fornecedor_insumos",
    isFixedCost: false,
    recurrence: "nenhuma",
    amount: 875.0,
    dueDate: NOW - 1 * DAY_MS, // Vencido ontem (para testar alerta)
    issueDate: NOW - 7 * DAY_MS,
    status: "vencido",
    barcode: "03399.82103 40012.304019 50102.100412 8 95570000087500",
    boletoBank: "Santander (033)",
    invoiceNumber: "NF-e 14592",
    bankAccount: "Nubank PJ - Reserva & Pix",
    conciliationStatus: "pendente",
    notes: "Prioridade para pagamento imediato via Pix ou boleto atualizado.",
    author: "Carlos Gerente",
    createdAt: NOW - 7 * DAY_MS,
  },
  {
    id: "bill-004",
    loja_id: "loja-1",
    type: "pagar",
    title: "Queijos Nobres, Manteiga e Nata Fresca",
    entityName: "Laticínios Serra da Canastra",
    entityDocument: "19.482.119/0001-31",
    category: "fornecedor_insumos",
    isFixedCost: false,
    recurrence: "nenhuma",
    amount: 1250.0,
    dueDate: NOW - 3 * DAY_MS,
    issueDate: NOW - 15 * DAY_MS,
    status: "pago",
    paidAt: NOW - 3 * DAY_MS,
    paidAmount: 1250.0,
    paymentMethod: "pix",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "conciliado",
    conciliatedAt: NOW - 2 * DAY_MS,
    conciliationRef: "PIX-LAT-948201",
    notes: "Pago com comprovante arquivado. Desconto de 3% por pagamento pontual concedido.",
    author: "Juliana Reis (Caixa)",
    createdAt: NOW - 15 * DAY_MS,
  },
  {
    id: "bill-005",
    loja_id: "loja-1",
    type: "pagar",
    title: "Embalagens Delivery e Descartáveis Eco",
    entityName: "Totalpack Embalagens Sustentáveis",
    entityDocument: "08.192.774/0001-63",
    category: "fornecedor_embalagens",
    isFixedCost: false,
    recurrence: "nenhuma",
    amount: 640.0,
    dueDate: NOW + 10 * DAY_MS,
    issueDate: NOW - 4 * DAY_MS,
    status: "pendente",
    barcode: "00190.00009 01041.230419 12040.102341 9 95680000064000",
    boletoBank: "Banco do Brasil (001)",
    invoiceNumber: "NF-e 77312",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "pendente",
    notes: "Embalagens kraft para hambúrguer e copos biodegradáveis.",
    author: "Carlos Gerente",
    createdAt: NOW - 4 * DAY_MS,
  },

  // --- CUSTOS FIXOS RECORRENTES (ALUGUEL, ENERGIA, ETC) ---
  {
    id: "bill-006",
    loja_id: "loja-1",
    type: "pagar",
    title: "Aluguel Salão Comercial & IPTU",
    entityName: "Imobiliária Morumbi & Locações",
    entityDocument: "61.389.201/0001-12",
    category: "aluguel",
    isFixedCost: true,
    recurrence: "mensal",
    amount: 5500.0,
    dueDate: NOW + 8 * DAY_MS,
    issueDate: NOW - 10 * DAY_MS,
    status: "pendente",
    barcode: "23793.38128 60014.204018 14008.102341 1 95660000550000",
    boletoBank: "Bradesco (237)",
    invoiceNumber: "REC-ALUG-03/26",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "pendente",
    notes:
      "Aluguel mensal do ponto comercial. Inclui taxa condominial e cota de IPTU proporcional.",
    author: "Carlos Gerente",
    createdAt: NOW - 10 * DAY_MS,
  },
  {
    id: "bill-007",
    loja_id: "loja-1",
    type: "pagar",
    title: "Energia Elétrica Comercial",
    entityName: "Enel Distribuição São Paulo",
    entityDocument: "02.429.980/0001-40",
    category: "energia",
    isFixedCost: true,
    recurrence: "mensal",
    amount: 1840.3,
    dueDate: NOW + 4 * DAY_MS,
    issueDate: NOW - 15 * DAY_MS,
    status: "agendado",
    barcode: "83670.00001 84030.010203 04050.607080 1 000000184030",
    boletoBank: "Concessionária Energia (Enel)",
    invoiceNumber: "FAT-ENEL-92810",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "pendente",
    notes: "Consumo das coifas, iluminação e câmara fria.",
    author: "Carlos Gerente",
    createdAt: NOW - 15 * DAY_MS,
  },
  {
    id: "bill-008",
    loja_id: "loja-1",
    type: "pagar",
    title: "Água & Esgoto Comercial",
    entityName: "Sabesp - Cia Saneamento Básico SP",
    entityDocument: "43.776.517/0001-80",
    category: "agua",
    isFixedCost: true,
    recurrence: "mensal",
    amount: 512.4,
    dueDate: NOW - 5 * DAY_MS,
    issueDate: NOW - 20 * DAY_MS,
    status: "pago",
    paidAt: NOW - 5 * DAY_MS,
    paidAmount: 512.4,
    paymentMethod: "debito_automatico",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "conciliado",
    conciliatedAt: NOW - 4 * DAY_MS,
    conciliationRef: "DEB-AUT-SABESP-4102",
    notes: "Débito automático em conta corrente.",
    author: "Carlos Gerente",
    createdAt: NOW - 20 * DAY_MS,
  },
  {
    id: "bill-009",
    loja_id: "loja-1",
    type: "pagar",
    title: "Internet Fibra Dedicada 600MB & Telefonia",
    entityName: "Claro Telecom Empresas",
    entityDocument: "40.432.544/0001-47",
    category: "internet_telefone",
    isFixedCost: true,
    recurrence: "mensal",
    amount: 289.9,
    dueDate: NOW + 12 * DAY_MS,
    issueDate: NOW - 6 * DAY_MS,
    status: "pendente",
    barcode: "84600.00000 28990.010203 04050.607080 3 000000028990",
    boletoBank: "Concessionária Telecom",
    invoiceNumber: "FAT-CLARO-8812",
    bankAccount: "Nubank PJ - Reserva & Pix",
    conciliationStatus: "pendente",
    notes: "Link para comanda eletrônica, Wi-Fi clientes e maquininhas.",
    author: "Carlos Gerente",
    createdAt: NOW - 6 * DAY_MS,
  },
  {
    id: "bill-010",
    loja_id: "loja-1",
    type: "pagar",
    title: "Assessoria Contábil & Fiscal",
    entityName: "Exata Contabilidade Estratégica",
    entityDocument: "28.910.334/0001-92",
    category: "contabilidade",
    isFixedCost: true,
    recurrence: "mensal",
    amount: 980.0,
    dueDate: NOW + 7 * DAY_MS,
    issueDate: NOW - 8 * DAY_MS,
    status: "pendente",
    barcode: "34191.79001 01043.510047 91020.150008 5 95650000098000",
    boletoBank: "Banco Itaú (341)",
    invoiceNumber: "NF-e 1024",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "pendente",
    notes: "Emissão de folha, apuração do Simples Nacional e balancete.",
    author: "Carlos Gerente",
    createdAt: NOW - 8 * DAY_MS,
  },
  {
    id: "bill-011",
    loja_id: "loja-1",
    type: "pagar",
    title: "Manutenção Preventiva Coifas e Sistema de Gás",
    entityName: "TecnoChapa Manutenções Gastronômicas",
    entityDocument: "31.450.912/0001-18",
    category: "manutencao",
    isFixedCost: false,
    recurrence: "nenhuma",
    amount: 650.0,
    dueDate: NOW + 15 * DAY_MS,
    issueDate: NOW - 2 * DAY_MS,
    status: "pendente",
    invoiceNumber: "OS 4491",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "pendente",
    notes: "Limpeza química das coifas e teste de estanqueidade do GLP.",
    author: "Carlos Gerente",
    createdAt: NOW - 2 * DAY_MS,
  },

  // --- CONTAS A RECEBER (RECEITAS FUTURAS & ADQUIRENTES) ---
  {
    id: "bill-012",
    loja_id: "loja-1",
    type: "receber",
    title: "Repasse Semanal Adquirência Stone (Débito & Crédito)",
    entityName: "Stone Pagamentos S.A.",
    entityDocument: "16.501.555/0001-57",
    category: "recebivel_cartao",
    isFixedCost: false,
    recurrence: "quinzenal",
    amount: 8420.0,
    dueDate: NOW + 1 * DAY_MS, // Cai amanhã
    issueDate: NOW - 6 * DAY_MS,
    status: "agendado",
    bankAccount: "Stone Conta Digital - Adquirência",
    conciliationStatus: "pendente",
    notes: "Vendas presenciais no salão processadas nos terminais POS.",
    author: "Sistema Stone",
    createdAt: NOW - 6 * DAY_MS,
  },
  {
    id: "bill-013",
    loja_id: "loja-1",
    type: "receber",
    title: "Repasse Quinzenal Ticket & Pluxee Refeição",
    entityName: "Edenred / Pluxee Brasil Vouchers",
    entityDocument: "47.866.934/0001-74",
    category: "voucher_refeicao",
    isFixedCost: false,
    recurrence: "quinzenal",
    amount: 2150.0,
    dueDate: NOW + 6 * DAY_MS,
    issueDate: NOW - 10 * DAY_MS,
    status: "pendente",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "pendente",
    notes: "Compensação de pagamentos recebidos em vales refeição e alimentação.",
    author: "Sistema Vouchers",
    createdAt: NOW - 10 * DAY_MS,
  },
  {
    id: "bill-014",
    loja_id: "loja-1",
    type: "receber",
    title: "Reserva Salão Privativo - Jantar Corporativo Nexa Tech",
    entityName: "Nexa Tech Soluções em Nuvem Ltda",
    entityDocument: "38.102.491/0001-05",
    category: "evento_corporativo",
    isFixedCost: false,
    recurrence: "nenhuma",
    amount: 4500.0,
    dueDate: NOW + 9 * DAY_MS,
    issueDate: NOW - 3 * DAY_MS,
    status: "pendente",
    invoiceNumber: "FAT-EVT-004",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "pendente",
    notes:
      "Evento fechado para 35 pessoas com menu degustação e open chopp. Sinal de 50% já recebido.",
    author: "Carlos Gerente",
    createdAt: NOW - 3 * DAY_MS,
  },
  {
    id: "bill-015",
    loja_id: "loja-1",
    type: "receber",
    title: "Repasse Vendas iFood Delivery Semanal",
    entityName: "iFood Agência de Restaurantes Online",
    entityDocument: "14.380.200/0001-21",
    category: "recebivel_cartao",
    isFixedCost: false,
    recurrence: "quinzenal",
    amount: 3240.0,
    dueDate: NOW - 2 * DAY_MS,
    issueDate: NOW - 9 * DAY_MS,
    status: "pago",
    paidAt: NOW - 2 * DAY_MS,
    paidAmount: 3240.0,
    paymentMethod: "transferencia",
    bankAccount: "Itaú PJ - Operacional Principal",
    conciliationStatus: "conciliado",
    conciliatedAt: NOW - 1 * DAY_MS,
    conciliationRef: "TED-IFOOD-88129",
    notes: "Repasse creditado na conta Itaú com taxa de comissão descontada.",
    author: "Carlos Gerente",
    createdAt: NOW - 9 * DAY_MS,
  },
];

export const INITIAL_BANK_STATEMENTS: BankStatementItem[] = [
  {
    id: "ext-01",
    loja_id: "loja-1",
    bankAccount: "Itaú PJ - Operacional Principal",
    date: NOW - 3 * DAY_MS,
    description: "PIX ENVIADO - LATICINIOS SERRA DA CANASTRA",
    documentNumber: "PIX-LAT-948201",
    amount: -1250.0,
    conciliated: true,
    matchedBillId: "bill-004",
    fitId: "ITAU-2026-03-05-9921",
  },
  {
    id: "ext-02",
    loja_id: "loja-1",
    bankAccount: "Itaú PJ - Operacional Principal",
    date: NOW - 5 * DAY_MS,
    description: "DEBITO AUTOMATICO SABESP CONCESSIONARIA",
    documentNumber: "DEB-AUT-SABESP-4102",
    amount: -512.4,
    conciliated: true,
    matchedBillId: "bill-008",
    fitId: "ITAU-2026-03-03-1102",
  },
  {
    id: "ext-03",
    loja_id: "loja-1",
    bankAccount: "Itaú PJ - Operacional Principal",
    date: NOW - 2 * DAY_MS,
    description: "TED RECEBIDA IFOOD RESTAURANTES AG",
    documentNumber: "TED-IFOOD-88129",
    amount: 3240.0,
    conciliated: true,
    matchedBillId: "bill-015",
    fitId: "ITAU-2026-03-06-7734",
  },
  // Lançamentos no extrato bancário ainda pendentes de conciliação
  {
    id: "ext-04",
    loja_id: "loja-1",
    bankAccount: "Stone Conta Digital - Adquirência",
    date: NOW - 1 * DAY_MS,
    description: "CRÉDITO ADQUIRÊNCIA STONE TEF VENDAS SALÃO",
    documentNumber: "STONE-TEF-89410",
    amount: 8420.0,
    conciliated: false,
    matchedBillId: "bill-012",
    fitId: "STONE-2026-03-07-4401",
  },
  {
    id: "ext-05",
    loja_id: "loja-1",
    bankAccount: "Itaú PJ - Operacional Principal",
    date: NOW - 1 * DAY_MS,
    description: "PAGTO BOLETO ELETRONICO DDA - AMBEV FEMSA",
    documentNumber: "BOL-AMBEV-390124",
    amount: -2180.5,
    conciliated: false,
    matchedBillId: "bill-002",
    fitId: "ITAU-2026-03-07-8819",
  },
  {
    id: "ext-06",
    loja_id: "loja-1",
    bankAccount: "Nubank PJ - Reserva & Pix",
    date: NOW - 6 * HOUR_MS,
    description: "PIX RECEBIDO - SINAL EVENTO EMPRESARIAL",
    documentNumber: "PIX-E77192",
    amount: 2250.0,
    conciliated: false,
    fitId: "NU-2026-03-08-1120",
  },
  {
    id: "ext-07",
    loja_id: "loja-1",
    bankAccount: "Itaú PJ - Operacional Principal",
    date: NOW - 18 * HOUR_MS,
    description: "TARIFA PACOTE CONTA CORRENTE PJ",
    documentNumber: "TAR-ITAU-0326",
    amount: -79.9,
    conciliated: false,
    fitId: "ITAU-2026-03-08-0402",
  },
];
