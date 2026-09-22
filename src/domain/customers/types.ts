export type CustomerStatus = "vip" | "frequente" | "padrao" | "inativo";

export interface CustomerPreferences {
  tableLocation?: string;
  dietaryRestrictions: string[];
  favoriteDrinks: string[];
  favoriteDishes: string[];
  cookingPreference?: string;
  preferredPayment?: "dinheiro" | "debito" | "credito" | "pix";
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
  paymentMethod?: "dinheiro" | "debito" | "credito" | "pix";
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
  document?: string;
  birthdate?: string;
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
  paymentMethod?: "dinheiro" | "debito" | "credito" | "pix";
  waiter: string;
  notes?: string;
  date?: number;
};

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

export const COMMON_DIETARY_RESTRICTIONS = [
  "Sem Glúten (Celíaco)",
  "Sem Lactose",
  "Alérgico a Frutos do Mar",
  "Alérgico a Amendoim/Nozes",
  "Vegetariano",
  "Vegano",
  "Sem Açúcar (Diabético)",
  "Hipertenso (Pouco Sal)",
];

export const TABLE_LOCATIONS = [
  "Mesa na Varanda (Área Externa)",
  "Salão Principal (Climatizado)",
  "Canto Silencioso / Reservado",
  "Próximo ao Telão / Bar",
  "Mesa Grande para Família",
  "Balcão do Bar",
];
