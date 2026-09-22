import type { StockItem, StockMovement } from "../../domain/stock/types";
import { INITIAL_STOCK_ITEMS } from "../mock/stock.mock";

export interface IStockRepository {
  list(lojaId?: string): Promise<StockItem[]>;
  getById(id: string): Promise<StockItem | null>;
  create(item: StockItem): Promise<StockItem>;
  update(id: string, data: Partial<StockItem>): Promise<StockItem>;
  delete(id: string): Promise<boolean>;
  addMovement(stockId: string, movement: StockMovement): Promise<StockItem>;
}

export class MockStockRepository implements IStockRepository {
  private stock: StockItem[] = [];

  constructor(initialItems?: StockItem[]) {
    this.stock = initialItems ? [...initialItems] : [...INITIAL_STOCK_ITEMS];
  }

  async list(lojaId?: string): Promise<StockItem[]> {
    if (!lojaId) return [...this.stock];
    return this.stock.filter((s) => !s.loja_id || s.loja_id === lojaId);
  }

  async getById(id: string): Promise<StockItem | null> {
    const item = this.stock.find((s) => s.id === id);
    return item ? { ...item } : null;
  }

  async create(item: StockItem): Promise<StockItem> {
    this.stock.unshift(item);
    return { ...item };
  }

  async update(id: string, data: Partial<StockItem>): Promise<StockItem> {
    const idx = this.stock.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Item do estoque com ID ${id} não encontrado.`);
    this.stock[idx] = { ...this.stock[idx], ...data, updatedAt: Date.now() };
    return { ...this.stock[idx] };
  }

  async delete(id: string): Promise<boolean> {
    const len = this.stock.length;
    this.stock = this.stock.filter((s) => s.id !== id);
    return this.stock.length < len;
  }

  async addMovement(stockId: string, movement: StockMovement): Promise<StockItem> {
    const idx = this.stock.findIndex((s) => s.id === stockId);
    if (idx === -1) throw new Error(`Item do estoque com ID ${stockId} não encontrado.`);
    const item = this.stock[idx];
    const updatedMovements = [movement, ...item.movements];
    this.stock[idx] = {
      ...item,
      currentStock: movement.newStock,
      movements: updatedMovements,
      updatedAt: Date.now(),
    };
    return { ...this.stock[idx] };
  }
}

export const stockRepository: IStockRepository = new MockStockRepository();
