import type { CashFlowEntry, Loja, Order, OrderItem, UserAccount } from "./types";

const MIN = 60_000;

let seq = 0;
const uid = (p: string) => `${p}-${++seq}`;

function item(
  name: string,
  qty: number,
  price: number,
  category: OrderItem["category"],
  note?: string,
): OrderItem {
  return { id: uid("it"), name, qty, price, category, note };
}

/** Pedidos fake realistas com isolamento por loja_id */
export function buildSeedOrders(now: number): Order[] {
  const mk = (
    code: string,
    table: number,
    guests: number,
    waiter: string,
    status: Order["status"],
    openedMinAgo: number,
    statusMinAgo: number,
    items: OrderItem[],
    notes?: string,
    priority = false,
    loja_id = "loja-1",
  ): Order => ({
    id: uid("ord"),
    loja_id,
    code,
    table,
    guests,
    waiter,
    status,
    openedAt: now - openedMinAgo * MIN,
    statusChangedAt: now - statusMinAgo * MIN,
    items,
    notes,
    priority,
    messages: [],
  });

  const orders: Order[] = [
    mk("#1042", 4, 2, "Ana Paula", "pendente", 2, 2, [
      item("Picanha na chapa (2 pessoas)", 1, 149.9, "prato"),
      item("Farofa de bacon", 1, 18, "entrada"),
      item("Chopp Pilsen 500ml", 2, 16.5, "bebida"),
    ]),
    mk(
      "#1041",
      12,
      4,
      "Rafael Lima",
      "pendente",
      9,
      9,
      [
        item("Moqueca de peixe", 1, 118, "prato", "sem pimenta"),
        item("Bolinho de bacalhau (6un)", 1, 42, "entrada"),
        item("Suco de maracujá", 2, 14, "bebida"),
      ],
      "Cliente alérgico a camarão — atenção no preparo.",
      true,
    ),
    mk("#1040", 7, 3, "Ana Paula", "preparo", 21, 14, [
      item("Costela no bafo 700g", 1, 132, "prato"),
      item("Batata rústica", 2, 29, "entrada"),
      item("Refrigerante lata", 3, 9, "bebida"),
    ]),
    mk(
      "#1039",
      2,
      2,
      "Carlos Mendes",
      "preparo",
      38,
      27,
      [item("Risoto de camarão", 2, 89, "prato"), item("Taça de vinho tinto", 2, 32, "bebida")],
      "Mesa comemorando aniversário — servir sobremesa com vela.",
      true,
    ),
    mk("#1038", 15, 6, "Juliana Rocha", "preparo", 16, 8, [
      item("Rodízio de pizza (broto)", 6, 49.9, "prato"),
      item("Água com gás", 4, 8, "bebida"),
    ]),
    mk("#1037", 9, 2, "Rafael Lima", "pronto", 33, 2, [
      item("Hambúrguer artesanal 180g", 2, 46, "prato", "sem cebola"),
      item("Onion rings", 1, 26, "entrada"),
      item("Chopp IPA 500ml", 2, 19.5, "bebida"),
    ]),
    mk("#1036", 5, 4, "Juliana Rocha", "pronto", 41, 7, [
      item("Filé à parmegiana", 2, 92, "prato"),
      item("Caipirinha de limão", 3, 24, "bebida"),
    ]),
    mk("#1035", 11, 2, "Carlos Mendes", "entregue", 55, 12, [
      item("Salmão grelhado", 2, 96, "prato"),
      item("Petit gâteau", 2, 28, "sobremesa"),
      item("Espresso duplo", 2, 11, "bebida"),
    ]),
    mk("#1034", 3, 3, "Ana Paula", "entregue", 72, 25, [
      item("Feijoada individual", 3, 68, "prato"),
      item("Caipirinha de maracujá", 2, 26, "bebida"),
    ]),
    {
      ...mk("#1033", 6, 2, "Ana Paula", "pago", 52, 6, [
        item("Bife de Chorizo 400g", 2, 86, "prato"),
        item("Batata frita trufada", 1, 38, "entrada"),
        item("Cerveja Artesanal IPA", 2, 22, "bebida"),
      ]),
      payment: {
        method: "pix",
        amount: 254.0,
        splitCount: 2,
        at: now - 6 * MIN,
        cashier: "Ana Paula",
        role: "garcom",
      },
    },
    {
      ...mk("#1032", 1, 4, "Juliana Rocha", "pago", 85, 24, [
        item("Risoto de Funghi", 2, 78, "prato"),
        item("Filé Mignon ao Poivre", 2, 94, "prato"),
        item("Garrafa Vinho Malbec", 1, 140, "bebida"),
        item("Panna Cotta de Frutas Vermelhas", 2, 26, "sobremesa"),
      ]),
      payment: {
        method: "credito",
        amount: 536.0,
        splitCount: 4,
        at: now - 24 * MIN,
        cashier: "Juliana Rocha",
        role: "garcom",
      },
    },
    {
      ...mk("#1031", 8, 2, "Ana Paula", "pago", 110, 48, [
        item("Salada Caesar com Frango", 2, 46, "entrada"),
        item("Gnocchi aos Quatro Queijos", 2, 64, "prato"),
        item("Água Mineral sem Gás", 2, 8, "bebida"),
      ]),
      payment: {
        method: "debito",
        amount: 236.0,
        splitCount: 1,
        at: now - 48 * MIN,
        cashier: "Juliana Reis",
        role: "caixa",
      },
    },
    {
      ...mk("#1030", 14, 2, "Carlos Mendes", "pago", 130, 65, [
        item("Moqueca Mista", 1, 125, "prato"),
        item("Chopp Pilsen 500ml", 3, 16.5, "bebida"),
      ]),
      payment: {
        method: "dinheiro",
        amount: 174.5,
        splitCount: 1,
        at: now - 65 * MIN,
        cashier: "Carlos Mendes",
        role: "garcom",
      },
    },
  ];

  orders[1]!.messages = [
    {
      id: uid("msg"),
      from: "garcom",
      author: "Rafael Lima",
      text: "Prioridade: cliente com pressa",
      at: now - 7 * MIN,
    },
    {
      id: uid("msg"),
      from: "cozinha",
      author: "Praça quente",
      text: "Entendido, subimos na fila",
      at: now - 6 * MIN,
    },
  ];
  orders[5]!.messages = [
    {
      id: uid("msg"),
      from: "garcom",
      author: "Rafael Lima",
      text: "Sem cebola",
      at: now - 30 * MIN,
    },
    {
      id: uid("msg"),
      from: "cozinha",
      author: "Praça fria",
      text: "Pedido pronto para retirada",
      at: now - 2 * MIN,
    },
  ];

  return orders;
}

export const QUICK_MESSAGES_WAITER = [
  "Sem cebola",
  "Prioridade",
  "Cliente com pressa",
  "Ponto da carne: mal passado",
  "Cancelar item",
  "Servir sem talher",
];

export const QUICK_MESSAGES_KITCHEN = [
  "Pedido pronto para retirada",
  "Atraso de 10 min",
  "Item em falta",
  "Confirmado, subindo na fila",
  "Precisa confirmar o ponto",
];

/** Pedidos por hora do serviço de hoje (mock). */
export const ORDERS_BY_HOUR = [
  { hour: "11h", pedidos: 8 },
  { hour: "12h", pedidos: 24 },
  { hour: "13h", pedidos: 31 },
  { hour: "14h", pedidos: 17 },
  { hour: "15h", pedidos: 6 },
  { hour: "18h", pedidos: 12 },
  { hour: "19h", pedidos: 27 },
  { hour: "20h", pedidos: 38 },
  { hour: "21h", pedidos: 29 },
  { hour: "22h", pedidos: 15 },
];

export const TOP_PRODUCTS = [
  { produto: "Picanha na chapa", vendas: 34 },
  { produto: "Hambúrguer artesanal", vendas: 29 },
  { produto: "Chopp Pilsen 500ml", vendas: 27 },
  { produto: "Risoto de camarão", vendas: 21 },
  { produto: "Filé à parmegiana", vendas: 18 },
  { produto: "Petit gâteau", vendas: 14 },
];

export const AVG_TIME_BY_STATION = [
  { etapa: "Aceite", minutos: 3 },
  { etapa: "Preparo", minutos: 18 },
  { etapa: "Retirada", minutos: 4 },
  { etapa: "Entrega", minutos: 2 },
];

export const TABLES_TOTAL = 24;

export const INITIAL_LOJAS: Loja[] = [
  {
    id: "loja-1",
    nome_fantasia: "Bar & Restaurante Keep Serv (Matriz)",
    codigo_loja: "KEEPSERV01",
    status: "ativo",
    created_at: Date.now() - 60 * 86400000,
    dono_id: "usr-gestor-1",
    cidade: "São Paulo / SP",
    telefone: "(11) 3456-7890",
  },
  {
    id: "loja-2",
    nome_fantasia: "Pizzaria Bela Vista",
    codigo_loja: "PIZZA02",
    status: "ativo",
    created_at: Date.now() - 20 * 86400000,
    dono_id: "usr-dono-pizza",
    cidade: "Campinas / SP",
    telefone: "(19) 3876-5432",
  },
  {
    id: "loja-3",
    nome_fantasia: "Bistrô & Café Colonial (Exemplo Inativo)",
    codigo_loja: "INATIVO99",
    status: "inativo",
    created_at: Date.now() - 10 * 86400000,
    dono_id: "usr-dono-inativo",
    cidade: "Santos / SP",
    telefone: "(13) 3211-9988",
  },
];

export const INITIAL_USERS: UserAccount[] = [
  // 1. DESENVOLVEDOR DO SISTEMA (Super Admin - Acesso exclusivo ao cadastro de lojas cadastradas)
  {
    id: "usr-dev-1",
    loja_id: null, // NULL para 'dev' conforme especificação
    usuario: "dev",
    username: "dev",
    nome: "Desenvolvedor Root",
    name: "Desenvolvedor Root",
    email: "dev@keepserv.app",
    senha: "dev123",
    password: "dev123",
    nivel: "dev",
    cargo: "gestor",
    role: "gestor",
    phone: "(11) 99999-0000",
    active: true,
    createdAt: Date.now() - 90 * 86400000,
    avatarColor: "bg-purple-600",
  },
  // 2. GESTOR DA LOJA 1 (Cliente pagante da Loja Matriz)
  {
    id: "usr-gestor-1",
    loja_id: "loja-1",
    usuario: "gestor",
    username: "gestor",
    nome: "Marcos Tavares (Gestor)",
    name: "Marcos Tavares (Gestor)",
    email: "gestor@keepserv.app",
    senha: "keepserv",
    password: "keepserv",
    nivel: "gestor",
    cargo: "gestor",
    role: "gestor",
    phone: "(11) 98123-4567",
    active: true,
    createdAt: Date.now() - 60 * 86400000,
    avatarColor: "bg-indigo-600",
  },
  // 3. COLABORADORES DA LOJA 1
  {
    id: "usr-garcom-1",
    loja_id: "loja-1",
    usuario: "garcom",
    username: "garcom",
    nome: "Ana Paula",
    name: "Ana Paula",
    email: "garcom@keepserv.app",
    senha: "keepserv",
    password: "keepserv",
    nivel: "colaborador",
    cargo: "garcom",
    role: "garcom",
    phone: "(11) 99456-7890",
    active: true,
    createdAt: Date.now() - 45 * 86400000,
    avatarColor: "bg-emerald-600",
  },
  {
    id: "usr-garcom-2",
    loja_id: "loja-1",
    usuario: "rafael",
    username: "rafael",
    nome: "Rafael Lima",
    name: "Rafael Lima",
    email: "rafael@keepserv.app",
    senha: "keepserv",
    password: "keepserv",
    nivel: "colaborador",
    cargo: "garcom",
    role: "garcom",
    phone: "(11) 97321-6549",
    active: true,
    createdAt: Date.now() - 30 * 86400000,
    avatarColor: "bg-teal-600",
  },
  {
    id: "usr-cozinha-1",
    loja_id: "loja-1",
    usuario: "cozinha",
    username: "cozinha",
    nome: "Chef Carlos (Praça Quente)",
    name: "Chef Carlos (Praça Quente)",
    email: "cozinha@keepserv.app",
    senha: "keepserv",
    password: "keepserv",
    nivel: "colaborador",
    cargo: "cozinha",
    role: "cozinha",
    phone: "(11) 98765-4321",
    active: true,
    createdAt: Date.now() - 40 * 86400000,
    avatarColor: "bg-amber-600",
  },
  {
    id: "usr-caixa-1",
    loja_id: "loja-1",
    usuario: "caixa",
    username: "caixa",
    nome: "Juliana Reis",
    name: "Juliana Reis",
    email: "caixa@keepserv.app",
    senha: "keepserv",
    password: "keepserv",
    nivel: "colaborador",
    cargo: "caixa",
    role: "caixa",
    phone: "(11) 99888-7766",
    active: true,
    createdAt: Date.now() - 35 * 86400000,
    avatarColor: "bg-blue-600",
  },
  // 4. GESTOR DA LOJA 2 (Pizzaria Bela Vista - Demonstração Multi-Tenant)
  {
    id: "usr-dono-pizza",
    loja_id: "loja-2",
    usuario: "bruno",
    username: "bruno",
    nome: "Bruno Pizzaiolo (Gestor)",
    name: "Bruno Pizzaiolo (Gestor)",
    email: "bruno@pizzariabelavista.com",
    senha: "pizza123",
    password: "pizza123",
    nivel: "gestor",
    cargo: "gestor",
    role: "gestor",
    phone: "(19) 99123-8877",
    active: true,
    createdAt: Date.now() - 20 * 86400000,
    avatarColor: "bg-rose-600",
  },
  // 5. COLABORADOR DA LOJA 2
  {
    id: "usr-colab-pizza-1",
    loja_id: "loja-2",
    usuario: "lucas",
    username: "lucas",
    nome: "Lucas Forneiro",
    name: "Lucas Forneiro",
    email: "lucas@pizzariabelavista.com",
    senha: "pizza123",
    password: "pizza123",
    nivel: "colaborador",
    cargo: "cozinha",
    role: "cozinha",
    phone: "(19) 98765-1122",
    active: true,
    createdAt: Date.now() - 15 * 86400000,
    avatarColor: "bg-orange-600",
  },
  // 6. GESTOR DA LOJA 3 (Inativa para teste de segurança no login)
  {
    id: "usr-dono-inativo",
    loja_id: "loja-3",
    usuario: "claudio",
    username: "claudio",
    nome: "Claudio Santos (Gestor Bistrô)",
    name: "Claudio Santos (Gestor Bistrô)",
    email: "claudio@bistroinativo.com",
    senha: "123456",
    password: "123456",
    nivel: "gestor",
    cargo: "gestor",
    role: "gestor",
    phone: "(13) 98111-2233",
    active: true,
    createdAt: Date.now() - 10 * 86400000,
    avatarColor: "bg-stone-600",
  },
];

export const DEMO_ACCOUNTS: Record<
  string,
  { usuario: string; email: string; name: string; codigo_loja: string }
> = {
  dev: { usuario: "dev", email: "dev@keepserv.app", name: "Desenvolvedor Root", codigo_loja: "" },
  gestor: {
    usuario: "gestor",
    email: "gestor@keepserv.app",
    name: "Marcos Tavares (Gestor)",
    codigo_loja: "KEEPSERV01",
  },
  garcom: {
    usuario: "garcom",
    email: "garcom@keepserv.app",
    name: "Ana Paula",
    codigo_loja: "KEEPSERV01",
  },
  cozinha: {
    usuario: "cozinha",
    email: "cozinha@keepserv.app",
    name: "Chef Carlos",
    codigo_loja: "KEEPSERV01",
  },
  caixa: {
    usuario: "caixa",
    email: "caixa@keepserv.app",
    name: "Juliana Reis",
    codigo_loja: "KEEPSERV01",
  },
  gestor_pizza: {
    usuario: "bruno",
    email: "bruno@pizzariabelavista.com",
    name: "Bruno Pizzaiolo (Gestor)",
    codigo_loja: "PIZZA02",
  },
  dono_pizza: {
    usuario: "bruno",
    email: "bruno@pizzariabelavista.com",
    name: "Bruno Pizzaiolo (Gestor)",
    codigo_loja: "PIZZA02",
  },
  loja_inativa: {
    usuario: "claudio",
    email: "claudio@bistroinativo.com",
    name: "Claudio Santos",
    codigo_loja: "INATIVO99",
  },
};

export function buildSeedCashFlow(now: number, orders: Order[]): CashFlowEntry[] {
  let cfSeq = 0;
  const cfId = () => `cf-seed-${++cfSeq}`;

  const entries: CashFlowEntry[] = [
    {
      id: cfId(),
      loja_id: "loja-1",
      type: "entrada",
      category: "suprimento",
      description: "Fundo de Troco Inicial (Abertura de Caixa)",
      amount: 500.0,
      method: "dinheiro",
      timestamp: now - 180 * MIN,
      author: "Juliana Reis (Caixa)",
      notes: "Fundo de gaveta conferido na abertura do turno",
    },
    {
      id: cfId(),
      loja_id: "loja-1",
      type: "saida",
      category: "insumos",
      description: "Compra emergencial de gelo e hortifruti fresco",
      amount: 85.0,
      method: "dinheiro",
      timestamp: now - 145 * MIN,
      author: "Marcos Tavares (Gestor)",
      notes: "Nota fiscal avulsa nº 4122 - Distribuidora Central",
    },
    {
      id: cfId(),
      loja_id: "loja-1",
      type: "saida",
      category: "sangria",
      description: "Sangria de segurança para o cofre administrativo",
      amount: 400.0,
      method: "dinheiro",
      timestamp: now - 50 * MIN,
      author: "Juliana Reis (Caixa)",
      notes: "Retirada periódica para manter limite de gaveta seguro",
    },
    {
      id: cfId(),
      loja_id: "loja-1",
      type: "saida",
      category: "pessoal_extra",
      description: "Adiantamento / Diária de garçom extra (Turno almoço)",
      amount: 160.0,
      method: "pix",
      timestamp: now - 35 * MIN,
      author: "Marcos Tavares (Gestor)",
      notes: "Prestador Rodrigo Silva - Salão",
    },
    {
      id: cfId(),
      loja_id: "loja-1",
      type: "saida",
      category: "manutencao",
      description: "Reparo emergencial iluminação da bancada do bar",
      amount: 45.0,
      method: "dinheiro",
      timestamp: now - 20 * MIN,
      author: "Marcos Tavares (Gestor)",
      notes: "Fita isolante e lâmpada dicroica",
    },
  ];

  // Adiciona as comandas pagas existentes como entradas no fluxo de caixa
  const paidOrders = orders.filter((o) => o.status === "pago" && o.payment);
  for (const order of paidOrders) {
    if (order.payment) {
      entries.push({
        id: cfId(),
        loja_id: order.loja_id || "loja-1",
        type: "entrada",
        category: "venda_comanda",
        description: `Recebimento da Comanda ${order.code} · Mesa ${order.table}`,
        amount: order.payment.amount,
        method: order.payment.method,
        timestamp: order.payment.at,
        author: order.payment.cashier,
        orderCode: order.code,
        orderId: order.id,
        notes: `Fechamento de mesa (${order.payment.splitCount > 1 ? `${order.payment.splitCount}x pessoas` : "Pagamento único"})`,
      });
    }
  }

  // Ordena do mais recente para o mais antigo
  return entries.sort((a, b) => b.timestamp - a.timestamp);
}
