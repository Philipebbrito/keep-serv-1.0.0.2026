import {
  SLA_MINUTES,
  STATUS_ORDER,
  type NewOrderInput,
  type Order,
  type OrderItem,
  type OrderStatus,
  type UrgencyLevel,
} from "./types";

/**
 * Calcula o valor total de uma comanda/pedido desconsiderando itens cancelados.
 */
export function calcularTotal(order: Order): number {
  return calcularSubtotal(order.items);
}

export const orderTotal = calcularTotal;

/**
 * Calcula o subtotal de uma lista de itens de comanda.
 */
export function calcularSubtotal(items: OrderItem[]): number {
  return items
    .filter((item) => !item.canceled)
    .reduce((sum, item) => sum + item.price * item.qty, 0);
}

/**
 * Determina o nível de urgência com base no tempo decorrido no status atual e SLA configurado.
 */
export function urgencyFor(order: Order, now: number): UrgencyLevel {
  const mins = (now - order.statusChangedAt) / 60000;
  const sla = SLA_MINUTES[order.status];
  if (!sla) return "ontime";
  if (mins >= sla.late) return "late";
  if (mins >= sla.warn) return "warn";
  return "ontime";
}

/**
 * Verifica se um pedido está estourando o SLA de atraso crítico.
 */
export function isAtrasado(order: Order, now: number): boolean {
  return urgencyFor(order, now) === "late";
}

/**
 * Retorna se o pedido ainda pode avançar no fluxo operacional da cozinha / salão.
 */
export function podeAvancarStatus(status: OrderStatus): boolean {
  const currentIndex = STATUS_ORDER.indexOf(status);
  return currentIndex >= 0 && currentIndex < STATUS_ORDER.length - 1;
}

/**
 * Retorna o próximo status operacional do pedido (pendente -> preparo -> pronto -> entregue).
 */
export function proximoStatus(currentStatus: OrderStatus): OrderStatus | null {
  const idx = STATUS_ORDER.indexOf(currentStatus);
  if (idx < 0 || idx >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
}

/**
 * Formata o tempo decorrido de forma amigável (ex: "14min 20s" ou "1h 10min").
 */
export function elapsedLabel(from: number, now: number): string {
  const total = Math.max(0, Math.floor((now - from) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}min`;
  return `${m}min ${String(s).padStart(2, "0")}s`;
}

/**
 * Validação pura de entrada de novos pedidos.
 */
export function validarNovoPedido(input: NewOrderInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.table || input.table <= 0) {
    errors.push("O número da mesa deve ser maior que zero.");
  }
  if (!input.guests || input.guests <= 0) {
    errors.push("O número de clientes na mesa deve ser de pelo menos 1 pessoa.");
  }
  if (!input.items || input.items.length === 0) {
    errors.push("O pedido deve conter pelo menos um item.");
  } else {
    for (const it of input.items) {
      if (!it.name || !it.name.trim()) {
        errors.push("Todos os itens devem ter um nome definido.");
      }
      if (!it.qty || it.qty <= 0) {
        errors.push(`A quantidade do item "${it.name || "Sem nome"}" deve ser maior que zero.`);
      }
      if (it.price < 0) {
        errors.push(`O preço do item "${it.name || "Sem nome"}" não pode ser negativo.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Cria a lista inicial de mesas ativas para uma loja.
 */
export function createInitialTables(
  count: number = 24,
  lojaId: string = "loja-1",
): import("./types").DiningTable[] {
  return Array.from({ length: Math.max(1, count) }, (_, i) => ({
    id: i + 1,
    loja_id: lojaId,
    label: `Mesa ${i + 1}`,
    active: true,
  }));
}

/**
 * Verifica se uma mesa pode ser excluída do salão sem violar comandas abertas.
 */
export function canSafelyRemoveTable(
  tableId: number,
  orders: Order[],
): { allowed: boolean; reason?: string } {
  const activeOrder = orders.find((o) => o.table === tableId && o.status !== "pago");
  if (activeOrder) {
    return {
      allowed: false,
      reason: `A Mesa ${tableId} possui comanda aberta (#${activeOrder.code}) em andamento. Feche ou cancele o atendimento antes de removê-la.`,
    };
  }
  return { allowed: true };
}
