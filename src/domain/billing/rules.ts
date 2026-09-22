import type { BillItem, BillStatus, CashFlowEntry } from "./types";

/**
 * Divide o valor total da comanda entre um número de clientes com arredondamento monetário (2 casas).
 */
export function dividirConta(total: number, quantidadePessoas: number): number {
  if (quantidadePessoas <= 1) return Math.max(0, total);
  return Number((Math.max(0, total) / quantidadePessoas).toFixed(2));
}

/**
 * Calcula a taxa de serviço (padrão 10% ou customizada).
 */
export function calcularTaxaServico(total: number, percentual = 0.1): number {
  if (total <= 0 || percentual <= 0) return 0;
  return Number((total * percentual).toFixed(2));
}

/**
 * Calcula o couvert artístico total da mesa.
 */
export function calcularCouvert(quantidadePessoas: number, valorCouvertUnitario: number): number {
  if (quantidadePessoas <= 0 || valorCouvertUnitario <= 0) return 0;
  return Number((quantidadePessoas * valorCouvertUnitario).toFixed(2));
}

/**
 * Calcula a composição final da conta incluindo adicionais, descontos e taxas opcionais.
 */
export function calcularTotalComAdicionais(
  subtotal: number,
  options?: {
    cobrarServico?: boolean;
    percentualServico?: number;
    quantidadeCouvert?: number;
    valorCouvertUnitario?: number;
    desconto?: number;
  },
): {
  subtotal: number;
  taxaServico: number;
  couvert: number;
  desconto: number;
  totalFinal: number;
} {
  const safeSubtotal = Math.max(0, subtotal);
  const percentualServico = options?.percentualServico ?? 0.1;
  const taxaServico = options?.cobrarServico
    ? calcularTaxaServico(safeSubtotal, percentualServico)
    : 0;
  const couvert = calcularCouvert(
    options?.quantidadeCouvert ?? 0,
    options?.valorCouvertUnitario ?? 0,
  );
  const desconto = Math.min(
    safeSubtotal + taxaServico + couvert,
    Math.max(0, options?.desconto ?? 0),
  );

  const totalFinal = Number((safeSubtotal + taxaServico + couvert - desconto).toFixed(2));

  return {
    subtotal: safeSubtotal,
    taxaServico,
    couvert,
    desconto,
    totalFinal,
  };
}

/**
 * Calcula o resumo consolidado de entradas, saídas e saldo líquido do fluxo de caixa.
 */
export function calcularResumoFinanceiro(entries: CashFlowEntry[]): {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
} {
  let totalEntradas = 0;
  let totalSaidas = 0;

  for (const entry of entries) {
    if (entry.type === "entrada") {
      totalEntradas += entry.amount;
    } else {
      totalSaidas += entry.amount;
    }
  }

  return {
    totalEntradas: Number(totalEntradas.toFixed(2)),
    totalSaidas: Number(totalSaidas.toFixed(2)),
    saldo: Number((totalEntradas - totalSaidas).toFixed(2)),
  };
}

/**
 * Verifica se uma conta está vencida em relação ao momento atual.
 */
export function isContaVencida(dueDate: number, now: number, status: BillStatus): boolean {
  if (status === "pago" || status === "cancelado") return false;
  return dueDate < now;
}

/**
 * Agrupa totais de contas a pagar e a receber.
 */
export function calcularMetricasContas(
  bills: BillItem[],
  now: number,
): {
  aPagarPendente: number;
  aPagarVencido: number;
  aReceberPendente: number;
} {
  let aPagarPendente = 0;
  let aPagarVencido = 0;
  let aReceberPendente = 0;

  for (const bill of bills) {
    if (
      bill.type === "pagar" &&
      (bill.status === "pendente" || bill.status === "agendado" || bill.status === "vencido")
    ) {
      if (isContaVencida(bill.dueDate, now, bill.status)) {
        aPagarVencido += bill.amount;
      } else {
        aPagarPendente += bill.amount;
      }
    } else if (bill.type === "receber" && bill.status === "pendente") {
      aReceberPendente += bill.amount;
    }
  }

  return {
    aPagarPendente: Number(aPagarPendente.toFixed(2)),
    aPagarVencido: Number(aPagarVencido.toFixed(2)),
    aReceberPendente: Number(aReceberPendente.toFixed(2)),
  };
}
