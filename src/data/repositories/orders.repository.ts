import type { Order, OrderStatus } from "../../domain/orders/types";
import { buildSeedOrders } from "../mock/orders.mock";

export interface IOrderRepository {
  list(lojaId?: string): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
  create(order: Order): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  delete(id: string): Promise<boolean>;
}

export class MockOrderRepository implements IOrderRepository {
  private orders: Order[] = [];

  constructor(initialOrders?: Order[]) {
    this.orders = initialOrders ?? buildSeedOrders(Date.now());
  }

  async list(lojaId?: string): Promise<Order[]> {
    if (!lojaId) return [...this.orders];
    return this.orders.filter((o) => o.loja_id === lojaId);
  }

  async getById(id: string): Promise<Order | null> {
    const found = this.orders.find((o) => o.id === id);
    return found ? { ...found } : null;
  }

  async create(order: Order): Promise<Order> {
    this.orders.unshift(order);
    return { ...order };
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    const idx = this.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error(`Pedido com ID ${id} não encontrado.`);
    this.orders[idx] = { ...this.orders[idx], ...data };
    return { ...this.orders[idx] };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.update(id, { status, statusChangedAt: Date.now() });
  }

  async delete(id: string): Promise<boolean> {
    const initialLen = this.orders.length;
    this.orders = this.orders.filter((o) => o.id !== id);
    return this.orders.length < initialLen;
  }
}

export const ordersRepository: IOrderRepository = new MockOrderRepository();
