import type { Order, OrderItem, PaymentMethod } from "./types";

export type CustomerStatus = "vip" | "frequente" | "padrao" | "inativo";

export interface CustomerPreferences {
  tableLocation?: string; // ex: "Mesa na Varanda", "Mesa no Canto Silencioso", "Perto do Telão"
  dietaryRestrictions: string[]; // ex: ["Sem Glúten", "Sem Lactose", "Alérgico a Frutos do Mar", "Vegano"]
  favoriteDrinks: string[]; // ex: ["Chopp IPA 500ml", "Vinho Malbec", "Caipirinha de Maracujá"]
  favoriteDishes: string[]; // ex: ["Picanha na chapa", "Filé ao Poivre", "Salmão Grelhado"]
  cookingPreference?: string; // ex: "Carne ao ponto para mal", "Pouco sal", "Molho à parte"
  preferredPayment?: PaymentMethod | "pix" | "credito" | "debito" | "dinheiro";
}

export interface CustomerVisit {
  id: string;
  orderId?: string;
  orderCode: string;
  table: number;
  date: number; // timestamp
  amount: number;
  guests: number;
  itemsSummary: string;
  paymentMethod?: PaymentMethod;
  waiter: string;
  notes?: string;
}

export interface CustomerMetrics {
  totalVisits: number;
  totalSpent: number;
  averageTicket: number;
  maxTicket: number;
  firstVisitAt?: number;
  lastVisitAt?: number;
  visitFrequency:
    "Semanal" | "Quinzenal" | "Mensal" | "Bimestral" | "Ocasional" | "Primeira Visita";
  daysSinceLastVisit?: number;
}

export interface Customer {
  id: string;
  loja_id: string;
  name: string;
  phone: string;
  email?: string;
  document?: string; // CPF
  birthdate?: string; // Formato YYYY-MM-DD
  birthDay?: number;
  birthMonth?: number;
  address?: {
    street?: string;
    neighborhood?: string;
    city?: string;
  };
  status: CustomerStatus;
  tags: string[];
  notes?: string;
  preferences: CustomerPreferences;
  metrics: CustomerMetrics;
  topItems: { name: string; category: string; count: number; totalSpent: number }[];
  topCategories: { category: string; count: number; percentage: number }[];
  visits: CustomerVisit[];
  createdAt: number;
  updatedAt: number;
}

export type NewCustomerInput = {
  name: string;
  phone: string;
  email?: string;
  document?: string;
  birthdate?: string;
  status?: CustomerStatus;
  tags?: string[];
  notes?: string;
  loja_id?: string;
  preferences?: Partial<CustomerPreferences>;
  address?: {
    street?: string;
    neighborhood?: string;
    city?: string;
  };
};

export type NewCustomerVisitInput = {
  orderId?: string;
  orderCode: string;
  table: number;
  amount: number;
  guests: number;
  itemsSummary: string;
  paymentMethod?: PaymentMethod;
  waiter: string;
  notes?: string;
  date?: number;
};

export const COMMON_DIETARY_RESTRICTIONS = [
  "Sem Glúten (Celíaco)",
  "Sem Lactose",
  "Alergia a Frutos do Mar",
  "Alergia a Camarão",
  "Alergia a Amendoim/Nozes",
  "Vegano",
  "Vegetariano",
  "Diabético (Sem Açúcar)",
  "Hipertenso (Baixo Sódio)",
];

export const TABLE_LOCATIONS = [
  "Mesa na Varanda (Área Externa)",
  "Salão Principal (Climatizado)",
  "Canto Silencioso / Reservado",
  "Próximo ao Telão / Bar",
  "Mesa Grande para Família",
  "Balcão do Bar",
];

// Formatação monetária
export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = brl;

// Formatação de data
export function formatDateBR(timestamp: number | string | Date): string {
  const d =
    typeof timestamp === "number" || typeof timestamp === "string"
      ? new Date(timestamp)
      : timestamp;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Formatação de telefone
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

// Gera link para WhatsApp
export function getWhatsAppLink(phone: string, text?: string): string {
  const clean = phone.replace(/\D/g, "");
  const ddi = clean.startsWith("55") ? clean : `55${clean}`;
  const encoded = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${ddi}${encoded}`;
}

export interface BirthdayInfo {
  isToday: boolean;
  isThisWeek: boolean;
  isThisMonth: boolean;
  daysUntil: number | null;
  formattedDate: string;
  formattedDayMonth: string;
  age: number | null;
  displayDayMonth: string;
}

/**
 * Calcula o status de aniversário de um cliente em relação a uma data de referência
 */
export function getCustomerBirthdayInfo(
  input: Customer | string | undefined,
  refDate: Date = new Date(),
): BirthdayInfo {
  const birthdate = typeof input === "object" && input !== null ? input.birthdate : input;
  if (!birthdate) {
    return {
      isToday: false,
      isThisWeek: false,
      isThisMonth: false,
      daysUntil: null,
      formattedDate: "",
      formattedDayMonth: "",
      age: null,
      displayDayMonth: "",
    };
  }

  const parts = birthdate.split("-");
  if (parts.length < 2) {
    return {
      isToday: false,
      isThisWeek: false,
      isThisMonth: false,
      daysUntil: null,
      formattedDate: "",
      formattedDayMonth: "",
      age: null,
      displayDayMonth: "",
    };
  }

  const birthYear = parts.length === 3 ? parseInt(parts[0], 10) : undefined;
  const birthMonth = parseInt(parts[parts.length - 2], 10);
  const birthDay = parseInt(parts[parts.length - 1], 10);

  if (isNaN(birthMonth) || isNaN(birthDay)) {
    return {
      isToday: false,
      isThisWeek: false,
      isThisMonth: false,
      daysUntil: null,
      formattedDate: "",
      formattedDayMonth: "",
      age: null,
      displayDayMonth: "",
    };
  }

  const currentYear = refDate.getFullYear();
  const currentMonth = refDate.getMonth() + 1; // 1-12
  const currentDay = refDate.getDate();

  // Próximo aniversário neste ano ou no próximo
  const thisYearBirthday = new Date(currentYear, birthMonth - 1, birthDay);
  let nextBirthday = thisYearBirthday;

  const todayMidnight = new Date(currentYear, currentMonth - 1, currentDay);
  if (thisYearBirthday < todayMidnight) {
    nextBirthday = new Date(currentYear + 1, birthMonth - 1, birthDay);
  }

  const diffMs = nextBirthday.getTime() - todayMidnight.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isToday = currentMonth === birthMonth && currentDay === birthDay;
  const isThisWeek = daysUntil >= 0 && daysUntil <= 7;
  const isThisMonth = currentMonth === birthMonth;

  let age: number | null = null;
  if (birthYear && !isNaN(birthYear)) {
    age = currentYear - birthYear;
    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
      age -= 1;
    }
    if (isToday) {
      age = currentYear - birthYear;
    }
  }

  const monthsPt = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return {
    isToday,
    isThisWeek,
    isThisMonth,
    daysUntil,
    formattedDate: `${String(birthDay).padStart(2, "0")}/${String(birthMonth).padStart(2, "0")}${birthYear ? `/${birthYear}` : ""}`,
    formattedDayMonth: `${String(birthDay).padStart(2, "0")}/${String(birthMonth).padStart(2, "0")}`,
    age,
    displayDayMonth: `${birthDay} de ${monthsPt[birthMonth - 1]}`,
  };
}

/**
 * Recalcula métricas e estatísticas de consumo para um cliente com base em suas visitas
 */
export function calculateCustomerMetrics(visits: CustomerVisit[]): {
  totalVisits: number;
  totalSpent: number;
  averageTicket: number;
  maxTicket: number;
  firstVisitAt?: number;
  lastVisitAt?: number;
  visitFrequency: CustomerMetrics["visitFrequency"];
  daysSinceLastVisit?: number;
} {
  if (visits.length === 0) {
    return {
      totalVisits: 0,
      totalSpent: 0,
      averageTicket: 0,
      maxTicket: 0,
      visitFrequency: "Primeira Visita",
    };
  }

  const sorted = [...visits].sort((a, b) => b.date - a.date);
  const totalVisits = visits.length;
  const totalSpent = visits.reduce((acc, v) => acc + v.amount, 0);
  const averageTicket = totalVisits > 0 ? totalSpent / totalVisits : 0;
  const maxTicket = Math.max(...visits.map((v) => v.amount), 0);
  const lastVisitAt = sorted[0]?.date;
  const firstVisitAt = sorted[sorted.length - 1]?.date;

  const now = Date.now();
  const daysSinceLastVisit = lastVisitAt
    ? Math.floor((now - lastVisitAt) / (1000 * 60 * 60 * 24))
    : undefined;

  let visitFrequency: CustomerMetrics["visitFrequency"] = "Ocasional";
  if (totalVisits === 1) {
    visitFrequency = "Primeira Visita";
  } else if (firstVisitAt && lastVisitAt && totalVisits >= 2) {
    const spanDays = Math.max(1, (lastVisitAt - firstVisitAt) / (1000 * 60 * 60 * 24));
    const avgDaysBetween = spanDays / (totalVisits - 1);

    if (avgDaysBetween <= 10) visitFrequency = "Semanal";
    else if (avgDaysBetween <= 20) visitFrequency = "Quinzenal";
    else if (avgDaysBetween <= 40) visitFrequency = "Mensal";
    else if (avgDaysBetween <= 70) visitFrequency = "Bimestral";
    else visitFrequency = "Ocasional";
  }

  return {
    totalVisits,
    totalSpent,
    averageTicket,
    maxTicket,
    firstVisitAt,
    lastVisitAt,
    visitFrequency,
    daysSinceLastVisit,
  };
}

/**
 * Gera sementes de clientes ricas e contextualizadas com histórico realista de visitas
 */
export function buildSeedCustomers(now: number): Customer[] {
  const DAY = 24 * 60 * 60 * 1000;
  const HOUR = 60 * 60 * 1000;

  // Cliente 1: Eduardo Silveira - VIP & Aniversariante de Hoje (08/09)!
  const visitsEduardo: CustomerVisit[] = [
    {
      id: "v-ed-1",
      orderCode: "#1033",
      table: 6,
      date: now - 3 * HOUR,
      amount: 254.0,
      guests: 2,
      itemsSummary: "Bife de Chorizo 400g (2x), Batata frita trufada, Cerveja Artesanal IPA (2x)",
      paymentMethod: "pix",
      waiter: "Ana Paula",
      notes: "Celebração do aniversário com a esposa na varanda.",
    },
    {
      id: "v-ed-2",
      orderCode: "#994",
      table: 4,
      date: now - 6 * DAY,
      amount: 382.0,
      guests: 3,
      itemsSummary: "Picanha na chapa, Farofa de bacon, Garrafa Vinho Malbec, Chopp IPA (2x)",
      paymentMethod: "credito",
      waiter: "Carlos Mendes",
      notes: "Pediu carne ao ponto para mal.",
    },
    {
      id: "v-ed-3",
      orderCode: "#962",
      table: 4,
      date: now - 14 * DAY,
      amount: 310.0,
      guests: 2,
      itemsSummary: "Filé Mignon ao Poivre (2x), Vinho Cabernet, Petit Gâteau",
      paymentMethod: "credito",
      waiter: "Ana Paula",
    },
    {
      id: "v-ed-4",
      orderCode: "#920",
      table: 4,
      date: now - 22 * DAY,
      amount: 420.0,
      guests: 4,
      itemsSummary: "Picanha na chapa (2x), Batata rústica, Chopp IPA (4x)",
      paymentMethod: "pix",
      waiter: "Rafael Lima",
    },
    {
      id: "v-ed-5",
      orderCode: "#880",
      table: 4,
      date: now - 35 * DAY,
      amount: 295.0,
      guests: 2,
      itemsSummary: "Bife de Chorizo, Vinho Malbec, Batata trufada",
      paymentMethod: "credito",
      waiter: "Ana Paula",
    },
  ];

  // Cliente 2: Mariana Albuquerque - Frequente & Aniversariante desta semana (11/09)!
  const visitsMariana: CustomerVisit[] = [
    {
      id: "v-mar-1",
      orderCode: "#1035",
      table: 11,
      date: now - 2 * DAY,
      amount: 243.0,
      guests: 2,
      itemsSummary: "Salmão grelhado (2x), Petit gâteau sem lactose, Espresso duplo",
      paymentMethod: "pix",
      waiter: "Carlos Mendes",
      notes: "Cliente com intolerância severa a lactose. Elogiou atendimento.",
    },
    {
      id: "v-mar-2",
      orderCode: "#998",
      table: 11,
      date: now - 9 * DAY,
      amount: 198.0,
      guests: 2,
      itemsSummary: "Salmão grelhado, Risoto sem manteiga, Suco de Maracujá (2x)",
      paymentMethod: "debito",
      waiter: "Juliana Rocha",
    },
    {
      id: "v-mar-3",
      orderCode: "#950",
      table: 7,
      date: now - 18 * DAY,
      amount: 215.0,
      guests: 2,
      itemsSummary: "Moqueca de peixe (sem leite de vaca), Salada verde, Água com gás",
      paymentMethod: "pix",
      waiter: "Rafael Lima",
    },
    {
      id: "v-mar-4",
      orderCode: "#912",
      table: 11,
      date: now - 28 * DAY,
      amount: 180.0,
      guests: 2,
      itemsSummary: "Salmão grelhado, Caipirinha de maracujá, Batata rústica",
      paymentMethod: "pix",
      waiter: "Carlos Mendes",
    },
  ];

  // Cliente 3: Dr. Roberto Castilho - VIP Corporativo & Frequente
  const visitsRoberto: CustomerVisit[] = [
    {
      id: "v-rob-1",
      orderCode: "#1032",
      table: 1,
      date: now - 1 * DAY,
      amount: 536.0,
      guests: 4,
      itemsSummary: "Filé Mignon ao Poivre (2x), Risoto de Funghi (2x), Vinho Malbec, Panna Cotta",
      paymentMethod: "credito",
      waiter: "Juliana Rocha",
      notes: "Almoço de negócios com diretoria médica. Conta paga em cartão corporativo.",
    },
    {
      id: "v-rob-2",
      orderCode: "#1002",
      table: 12,
      date: now - 8 * DAY,
      amount: 680.0,
      guests: 6,
      itemsSummary: "Picanha na chapa (3x), Chopp Artesanal IPA (8x), Batata trufada (2x)",
      paymentMethod: "credito",
      waiter: "Rafael Lima",
    },
    {
      id: "v-rob-3",
      orderCode: "#970",
      table: 1,
      date: now - 15 * DAY,
      amount: 490.0,
      guests: 4,
      itemsSummary: "Costela no bafo, Filé ao Poivre, Vinho Cabernet, Sobremesas",
      paymentMethod: "credito",
      waiter: "Carlos Mendes",
    },
    {
      id: "v-rob-4",
      orderCode: "#935",
      table: 12,
      date: now - 24 * DAY,
      amount: 720.0,
      guests: 6,
      itemsSummary: "Rodízio especial carnes, Garrafa Vinho Reserva, Chopp IPA (6x)",
      paymentMethod: "credito",
      waiter: "Juliana Rocha",
    },
    {
      id: "v-rob-5",
      orderCode: "#895",
      table: 1,
      date: now - 36 * DAY,
      amount: 510.0,
      guests: 4,
      itemsSummary: "Risoto de camarão (3x), Vinho Branco Sauvignon, Saladas especiais",
      paymentMethod: "credito",
      waiter: "Ana Paula",
    },
  ];

  // Cliente 4: Camila Fernandes - Vegana & Restrição ao Glúten
  const visitsCamila: CustomerVisit[] = [
    {
      id: "v-cam-1",
      orderCode: "#1025",
      table: 8,
      date: now - 4 * DAY,
      amount: 145.0,
      guests: 1,
      itemsSummary: "Risoto de cogumelos com azeite trufado (vegano), Caipirinha especial, Café",
      paymentMethod: "pix",
      waiter: "Ana Paula",
      notes: "Mesa no jardim. Elogiou as opções plant-based do cardápio.",
    },
    {
      id: "v-cam-2",
      orderCode: "#985",
      table: 8,
      date: now - 16 * DAY,
      amount: 168.0,
      guests: 2,
      itemsSummary: "Salada mediterrânea, Batata rústica, Suco de Maracujá (2x)",
      paymentMethod: "pix",
      waiter: "Carlos Mendes",
    },
    {
      id: "v-cam-3",
      orderCode: "#930",
      table: 8,
      date: now - 30 * DAY,
      amount: 138.0,
      guests: 1,
      itemsSummary: "Risoto vegano, Chá gelado de hibisco com limão siciliano",
      paymentMethod: "pix",
      waiter: "Ana Paula",
    },
  ];

  // Cliente 5: Lucas Guimarães - Jantar a Dois & Aniversariante do Mês (02/09)
  const visitsLucas: CustomerVisit[] = [
    {
      id: "v-luc-1",
      orderCode: "#1020",
      table: 2,
      date: now - 5 * DAY,
      amount: 312.0,
      guests: 2,
      itemsSummary: "Filé ao Poivre, Risoto de camarão, Vinho Tinto, Petit Gâteau com vela",
      paymentMethod: "credito",
      waiter: "Juliana Rocha",
      notes: "Comemoração atrasada do aniversário da esposa.",
    },
    {
      id: "v-luc-2",
      orderCode: "#965",
      table: 2,
      date: now - 20 * DAY,
      amount: 275.0,
      guests: 2,
      itemsSummary: "Salmão grelhado, Filé à parmegiana, Caipirinhas de maracujá (2x)",
      paymentMethod: "pix",
      waiter: "Rafael Lima",
    },
    {
      id: "v-luc-3",
      orderCode: "#905",
      table: 2,
      date: now - 42 * DAY,
      amount: 290.0,
      guests: 2,
      itemsSummary: "Picanha na chapa, Chopp Pilsen (4x), Sobremesa Panna Cotta",
      paymentMethod: "credito",
      waiter: "Carlos Mendes",
    },
  ];

  // Cliente 6: Thiago Ramos - Em Risco (sem visita há 46 dias)
  const visitsThiago: CustomerVisit[] = [
    {
      id: "v-thi-1",
      orderCode: "#850",
      table: 9,
      date: now - 46 * DAY,
      amount: 165.0,
      guests: 3,
      itemsSummary: "Hambúrguer artesanal (2x), Onion rings, Chopp Pilsen 500ml (3x)",
      paymentMethod: "debito",
      waiter: "Rafael Lima",
      notes: "Assistiu jogo de futebol perto do telão.",
    },
    {
      id: "v-thi-2",
      orderCode: "#810",
      table: 9,
      date: now - 62 * DAY,
      amount: 180.0,
      guests: 3,
      itemsSummary: "Batata frita trufada, Chopp Pilsen (6x)",
      paymentMethod: "debito",
      waiter: "Rafael Lima",
    },
  ];

  // Cliente 7: Fernanda Vasconcelos - Cliente Recente (Primeira Visita)
  const visitsFernanda: CustomerVisit[] = [
    {
      id: "v-fer-1",
      orderCode: "#1034",
      table: 3,
      date: now - 1 * DAY,
      amount: 256.0,
      guests: 3,
      itemsSummary: "Feijoada individual (3x), Caipirinha de maracujá (2x)",
      paymentMethod: "pix",
      waiter: "Ana Paula",
      notes: "Primeira visita ao bistrô recomendada por amigos.",
    },
  ];

  // Cliente 8: Gabriel Siqueira - Alérgico Severo a Frutos do Mar
  const visitsGabriel: CustomerVisit[] = [
    {
      id: "v-gab-1",
      orderCode: "#1041",
      table: 12,
      date: now - 3 * DAY,
      amount: 298.0,
      guests: 4,
      itemsSummary: "Costela no bafo, Batata rústica (2x), Chopp IPA (4x)",
      paymentMethod: "credito",
      waiter: "Rafael Lima",
      notes: "ALERTA SEVERO: Alérgico a camarão e frutos do mar! Usar utensílios exclusivos.",
    },
    {
      id: "v-gab-2",
      orderCode: "#980",
      table: 5,
      date: now - 17 * DAY,
      amount: 320.0,
      guests: 4,
      itemsSummary: "Picanha na chapa, Farofa de bacon, Cervejas Artesanais (4x)",
      paymentMethod: "credito",
      waiter: "Juliana Rocha",
    },
  ];

  const customers: Customer[] = [
    {
      id: "cust-1",
      loja_id: "loja-1",
      name: "Eduardo Silveira",
      phone: "11987654321",
      email: "eduardo.silveira@gmail.com",
      document: "123.456.789-00",
      birthdate: "1985-09-08", // Aniversário de HOJE! (08 de Setembro)
      birthDay: 8,
      birthMonth: 9,
      status: "vip",
      tags: ["VIP", "Aniversariante do Dia", "Apreciador de Vinhos", "Varanda"],
      notes: "Cliente VIP da casa há 3 anos. Aprecia mesa na varanda e vinhos encorpados.",
      preferences: {
        tableLocation: "Mesa na Varanda (Mesas 4 ou 6)",
        dietaryRestrictions: [],
        favoriteDrinks: ["Cerveja Artesanal IPA", "Vinho Tinto Malbec", "Chopp IPA 500ml"],
        favoriteDishes: ["Bife de Chorizo 400g", "Picanha na chapa", "Batata frita trufada"],
        cookingPreference: "Carne sempre ao ponto para mal.",
        preferredPayment: "pix",
      },
      metrics: calculateCustomerMetrics(visitsEduardo),
      topItems: [
        { name: "Bife de Chorizo 400g", category: "prato", count: 4, totalSpent: 344 },
        { name: "Cerveja Artesanal IPA", category: "bebida", count: 8, totalSpent: 176 },
        { name: "Garrafa Vinho Malbec", category: "bebida", count: 2, totalSpent: 280 },
        { name: "Batata frita trufada", category: "entrada", count: 3, totalSpent: 114 },
      ],
      topCategories: [
        { category: "Pratos Principais", count: 5, percentage: 42 },
        { category: "Bebidas & Vinhos", count: 12, percentage: 48 },
        { category: "Entradas", count: 3, percentage: 10 },
      ],
      visits: visitsEduardo,
      createdAt: now - 380 * DAY,
      updatedAt: now - 3 * HOUR,
    },
    {
      id: "cust-2",
      loja_id: "loja-1",
      name: "Mariana Albuquerque",
      phone: "11976543210",
      email: "mari.albuquerque@advocacia.com.br",
      document: "234.567.890-11",
      birthdate: "1990-09-11", // Aniversário nesta semana (11 de Setembro)!
      birthDay: 11,
      birthMonth: 9,
      status: "frequente",
      tags: ["Frequente", "Aniversariante da Semana", "Sem Lactose", "Almoço Executivo"],
      notes: "Intolerância severa à lactose. A cozinha sempre substitui manteiga por azeite.",
      preferences: {
        tableLocation: "Salão Principal Climatizado (Mesa 11)",
        dietaryRestrictions: ["Sem Lactose (Intolerância Severa)"],
        favoriteDrinks: ["Suco Natural de Maracujá", "Água com Gás e Limão", "Espresso Duplo"],
        favoriteDishes: ["Salmão grelhado", "Moqueca de peixe", "Salada Caesar"],
        cookingPreference: "Zero queijo, leite ou manteiga. Gosta de azeite extra virgem.",
        preferredPayment: "pix",
      },
      metrics: calculateCustomerMetrics(visitsMariana),
      topItems: [
        { name: "Salmão grelhado", category: "prato", count: 4, totalSpent: 384 },
        { name: "Suco de Maracujá", category: "bebida", count: 5, totalSpent: 70 },
        { name: "Moqueca de peixe", category: "prato", count: 1, totalSpent: 118 },
      ],
      topCategories: [
        { category: "Pratos Principais", count: 5, percentage: 55 },
        { category: "Bebidas Saudáveis", count: 7, percentage: 35 },
        { category: "Entradas Leves", count: 2, percentage: 10 },
      ],
      visits: visitsMariana,
      createdAt: now - 180 * DAY,
      updatedAt: now - 2 * DAY,
    },
    {
      id: "cust-3",
      loja_id: "loja-1",
      name: "Dr. Roberto Castilho",
      phone: "11998877665",
      email: "dr.roberto.castilho@clinica.med.br",
      document: "345.678.901-22",
      birthdate: "1972-09-24", // Aniversariante deste mês (24 de Setembro)!
      birthDay: 24,
      birthMonth: 9,
      status: "vip",
      tags: ["VIP", "Aniversariante do Mês", "Corporativo", "Família", "Mesa 12"],
      notes: "Membro do clube de carnes. Costuma trazer equipes médicas e família grande.",
      preferences: {
        tableLocation: "Mesa Grande 6+ Lugares (Mesa 1 ou 12)",
        dietaryRestrictions: [],
        favoriteDrinks: ["Chopp Artesanal IPA", "Garrafa Vinho Reserva", "Espresso"],
        favoriteDishes: [
          "Picanha na chapa (2 pessoas)",
          "Filé Mignon ao Poivre",
          "Costela no bafo",
        ],
        cookingPreference: "Carnes no ponto exato. Gosta de taças de vinho trocadas por rótulo.",
        preferredPayment: "credito",
      },
      metrics: calculateCustomerMetrics(visitsRoberto),
      topItems: [
        { name: "Picanha na chapa", category: "prato", count: 5, totalSpent: 749.5 },
        { name: "Chopp Artesanal IPA", category: "bebida", count: 18, totalSpent: 351 },
        { name: "Filé Mignon ao Poivre", category: "prato", count: 3, totalSpent: 282 },
        { name: "Garrafa Vinho Malbec", category: "bebida", count: 2, totalSpent: 280 },
      ],
      topCategories: [
        { category: "Pratos Nobres", count: 12, percentage: 60 },
        { category: "Chopps & Cervejas", count: 22, percentage: 32 },
        { category: "Sobremesas", count: 4, percentage: 8 },
      ],
      visits: visitsRoberto,
      createdAt: now - 450 * DAY,
      updatedAt: now - 1 * DAY,
    },
    {
      id: "cust-4",
      loja_id: "loja-1",
      name: "Camila Fernandes",
      phone: "11965432198",
      email: "camila.design@estudio.com",
      document: "456.789.012-33",
      birthdate: "1994-10-18",
      birthDay: 18,
      birthMonth: 10,
      status: "frequente",
      tags: ["Frequente", "Vegana", "Sem Glúten", "Mesa Calma", "Coquetéis"],
      notes: "Restrição estrita a carne, laticínios e derivados animais. Ama o jardim.",
      preferences: {
        tableLocation: "Mesa no Jardim / Canto Calmo (Mesa 8)",
        dietaryRestrictions: ["Vegano (Restrito)", "Sem Glúten"],
        favoriteDrinks: ["Caipirinha Especial", "Chá de Hibisco Gelado", "Água de Coco"],
        favoriteDishes: ["Risoto de cogumelos com azeite trufado", "Salada mediterrânea"],
        cookingPreference: "Preparo 100% vegetal com utensílios higienizados.",
        preferredPayment: "pix",
      },
      metrics: calculateCustomerMetrics(visitsCamila),
      topItems: [
        { name: "Risoto de cogumelos vegano", category: "prato", count: 3, totalSpent: 237 },
        { name: "Caipirinha especial", category: "bebida", count: 4, totalSpent: 96 },
        { name: "Salada mediterrânea", category: "prato", count: 2, totalSpent: 76 },
      ],
      topCategories: [
        { category: "Pratos Veganos", count: 5, percentage: 65 },
        { category: "Bebidas Artesanais", count: 6, percentage: 35 },
      ],
      visits: visitsCamila,
      createdAt: now - 120 * DAY,
      updatedAt: now - 4 * DAY,
    },
    {
      id: "cust-5",
      loja_id: "loja-1",
      name: "Lucas Guimarães & Beatriz",
      phone: "11954321098",
      email: "lucas.guimaraes@techcorp.io",
      document: "567.890.123-44",
      birthdate: "1988-09-02", // Aniversariante recente do mês de Setembro (02/09)
      birthDay: 2,
      birthMonth: 9,
      status: "frequente",
      tags: ["Frequente", "Aniversariante do Mês", "Casal Regular", "Sobremesas"],
      notes: "Costumam jantar toda semana às terças ou quintas à noite.",
      preferences: {
        tableLocation: "Mesa 2 (Canto Romântico com Iluminação Baixa)",
        dietaryRestrictions: [],
        favoriteDrinks: ["Caipirinha de Maracujá", "Vinho Tinto Suave", "Chopp Pilsen"],
        favoriteDishes: ["Filé ao Poivre", "Risoto de camarão", "Petit Gâteau duplo"],
        cookingPreference: "Sobremesa sempre servida logo após os pratos.",
        preferredPayment: "credito",
      },
      metrics: calculateCustomerMetrics(visitsLucas),
      topItems: [
        { name: "Filé ao Poivre", category: "prato", count: 3, totalSpent: 282 },
        { name: "Risoto de camarão", category: "prato", count: 2, totalSpent: 178 },
        { name: "Petit Gâteau", category: "sobremesa", count: 4, totalSpent: 112 },
      ],
      topCategories: [
        { category: "Pratos Principais", count: 6, percentage: 55 },
        { category: "Sobremesas", count: 4, percentage: 25 },
        { category: "Bebidas", count: 5, percentage: 20 },
      ],
      visits: visitsLucas,
      createdAt: now - 150 * DAY,
      updatedAt: now - 5 * DAY,
    },
    {
      id: "cust-6",
      loja_id: "loja-1",
      name: "Thiago Ramos",
      phone: "11943210987",
      email: "thiago.ramos@agencia.com.br",
      document: "678.901.234-55",
      birthdate: "1992-11-15",
      birthDay: 15,
      birthMonth: 11,
      status: "padrao",
      tags: ["Em Risco", "Happy Hour", "Futebol & Telão"],
      notes: "Não visita a casa há mais de 45 dias. Bom candidato para campanha de retorno.",
      preferences: {
        tableLocation: "Próximo ao Telão de Jogos (Mesa 9)",
        dietaryRestrictions: [],
        favoriteDrinks: ["Chopp Pilsen 500ml", "Refrigerante lata"],
        favoriteDishes: ["Hambúrguer artesanal 180g", "Batata frita trufada", "Onion rings"],
        cookingPreference: "Hambúrguer sem cebola crua.",
        preferredPayment: "debito",
      },
      metrics: calculateCustomerMetrics(visitsThiago),
      topItems: [
        { name: "Chopp Pilsen 500ml", category: "bebida", count: 9, totalSpent: 148.5 },
        { name: "Hambúrguer artesanal", category: "prato", count: 2, totalSpent: 92 },
        { name: "Batata frita trufada", category: "entrada", count: 2, totalSpent: 76 },
      ],
      topCategories: [
        { category: "Chopps & Cervejas", count: 9, percentage: 50 },
        { category: "Porções & Petiscos", count: 4, percentage: 30 },
        { category: "Burgers", count: 2, percentage: 20 },
      ],
      visits: visitsThiago,
      createdAt: now - 160 * DAY,
      updatedAt: now - 46 * DAY,
    },
    {
      id: "cust-7",
      loja_id: "loja-1",
      name: "Fernanda Vasconcelos",
      phone: "11932109876",
      email: "fernanda.vasconcelos@gmail.com",
      document: "789.012.345-66",
      birthdate: "1996-03-22",
      birthDay: 22,
      birthMonth: 3,
      status: "padrao",
      tags: ["Novo Cliente", "Feijoada", "Fim de Semana"],
      notes: "Veio pela primeira vez no fim de semana. Elogiou muito a feijoada da casa.",
      preferences: {
        tableLocation: "Mesa 3 (Salão Central)",
        dietaryRestrictions: [],
        favoriteDrinks: ["Caipirinha de maracujá"],
        favoriteDishes: ["Feijoada individual"],
        preferredPayment: "pix",
      },
      metrics: calculateCustomerMetrics(visitsFernanda),
      topItems: [
        { name: "Feijoada individual", category: "prato", count: 3, totalSpent: 204 },
        { name: "Caipirinha de maracujá", category: "bebida", count: 2, totalSpent: 52 },
      ],
      topCategories: [
        { category: "Pratos Típicos", count: 3, percentage: 75 },
        { category: "Bebidas", count: 2, percentage: 25 },
      ],
      visits: visitsFernanda,
      createdAt: now - 2 * DAY,
      updatedAt: now - 1 * DAY,
    },
    {
      id: "cust-8",
      loja_id: "loja-1",
      name: "Gabriel Siqueira",
      phone: "11921098765",
      email: "gabriel.siqueira@construtora.eng.br",
      document: "890.123.456-77",
      birthdate: "1983-12-05",
      birthDay: 5,
      birthMonth: 12,
      status: "frequente",
      tags: ["Alerta de Alergia", "Sem Frutos do Mar", "Carnes Nobres", "Frequente"],
      notes: "ALERTA SEVERO: Anafilaxia a camarão, peixes e crustáceos! Nunca misturar grelha.",
      preferences: {
        tableLocation: "Mesa 12 ou Mesa 5",
        dietaryRestrictions: ["Alergia Severa a Frutos do Mar (Camarão, Peixe, Marisco)"],
        favoriteDrinks: ["Chopp IPA 500ml", "Cervejas Artesanais"],
        favoriteDishes: ["Costela no bafo 700g", "Picanha na chapa", "Farofa de bacon"],
        cookingPreference: "Apenas carnes bovinas e suínas preparadas em chapa separada.",
        preferredPayment: "credito",
      },
      metrics: calculateCustomerMetrics(visitsGabriel),
      topItems: [
        { name: "Costela no bafo 700g", category: "prato", count: 2, totalSpent: 264 },
        { name: "Picanha na chapa", category: "prato", count: 1, totalSpent: 149.9 },
        { name: "Chopp IPA 500ml", category: "bebida", count: 6, totalSpent: 117 },
      ],
      topCategories: [
        { category: "Carnes Nobres", count: 3, percentage: 60 },
        { category: "Chopps & Bebidas", count: 6, percentage: 30 },
        { category: "Acompanhamentos", count: 2, percentage: 10 },
      ],
      visits: visitsGabriel,
      createdAt: now - 200 * DAY,
      updatedAt: now - 3 * DAY,
    },
  ];

  return customers;
}
