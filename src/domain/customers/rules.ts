import type {
  BirthdayInfo,
  Customer,
  CustomerMetrics,
  CustomerStatus,
  CustomerVisit,
  NewCustomerInput,
} from "./types";

const DAY_MS = 86400000;

/**
 * Calcula métricas de consumo e frequência de visitas do cliente.
 */
export function calcularMetricasCliente(
  visits: CustomerVisit[],
  now = Date.now(),
): CustomerMetrics {
  const totalVisits = visits.length;
  if (totalVisits === 0) {
    return {
      totalVisits: 0,
      totalSpent: 0,
      averageTicket: 0,
      maxTicket: 0,
      visitFrequency: "Primeira Visita",
    };
  }

  const sorted = [...visits].sort((a, b) => a.date - b.date);
  const totalSpent = Number(visits.reduce((acc, v) => acc + v.amount, 0).toFixed(2));
  const maxTicket = Number(Math.max(...visits.map((v) => v.amount)).toFixed(2));
  const averageTicket = Number((totalSpent / totalVisits).toFixed(2));

  const firstVisitAt = sorted[0].date;
  const lastVisitAt = sorted[sorted.length - 1].date;
  const daysSinceLastVisit = Math.max(0, Math.floor((now - lastVisitAt) / DAY_MS));

  let visitFrequency: CustomerMetrics["visitFrequency"] = "Ocasional";
  if (totalVisits === 1) {
    visitFrequency = "Primeira Visita";
  } else {
    const spanDays = Math.max(1, Math.floor((lastVisitAt - firstVisitAt) / DAY_MS));
    const avgDaysBetween = spanDays / (totalVisits - 1);

    if (avgDaysBetween <= 9) {
      visitFrequency = "Semanal";
    } else if (avgDaysBetween <= 18) {
      visitFrequency = "Quinzenal";
    } else if (avgDaysBetween <= 35) {
      visitFrequency = "Mensal";
    } else if (avgDaysBetween <= 65) {
      visitFrequency = "Bimestral";
    }
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

export const calculateCustomerMetrics = calcularMetricasCliente;

/**
 * Classifica automaticamente o cliente com base em visitas e valor gasto acumulado.
 */
export function calcularClassificacaoCliente(
  totalSpent: number,
  totalVisits: number,
): CustomerStatus {
  if (totalSpent >= 1500 || totalVisits >= 12) return "vip";
  if (totalSpent >= 500 || totalVisits >= 4) return "frequente";
  return "padrao";
}

/**
 * Retorna informações detalhadas sobre a proximidade do aniversário do cliente.
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
  }

  const formattedDate = birthYear
    ? `${String(birthDay).padStart(2, "0")}/${String(birthMonth).padStart(2, "0")}/${birthYear}`
    : `${String(birthDay).padStart(2, "0")}/${String(birthMonth).padStart(2, "0")}`;

  const formattedDayMonth = `${String(birthDay).padStart(2, "0")}/${String(birthMonth).padStart(2, "0")}`;

  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const displayDayMonth = `${birthDay} de ${monthNames[birthMonth - 1] || ""}`;

  return {
    isToday,
    isThisWeek,
    isThisMonth,
    daysUntil,
    formattedDate,
    formattedDayMonth,
    age,
    displayDayMonth,
  };
}

/**
 * Verifica se o cliente comemora aniversário no mês especificado (0 = janeiro, 11 = dezembro).
 */
export function isAniversarianteDoMes(
  birthMonth?: number,
  targetMonth = new Date().getMonth(),
): boolean {
  if (birthMonth === undefined || birthMonth === null) return false;
  return birthMonth === targetMonth;
}

/**
 * Validação dos dados do cliente.
 */
export function validarCliente(input: NewCustomerInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.name || !input.name.trim()) {
    errors.push("O nome do cliente é obrigatório.");
  }
  if (!input.phone || !input.phone.trim()) {
    errors.push("O telefone ou WhatsApp de contato é obrigatório.");
  }
  if (input.email && !input.email.includes("@")) {
    errors.push("O e-mail informado não é válido.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = brl;

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
