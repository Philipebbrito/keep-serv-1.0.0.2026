import type { MenuItem } from "../../domain/menu/types";
import { MENU } from "../mock/menu.mock";

export interface IMenuRepository {
  list(lojaId?: string): Promise<MenuItem[]>;
  getById(id: string): Promise<MenuItem | null>;
  create(product: MenuItem): Promise<MenuItem>;
  update(id: string, data: Partial<MenuItem>): Promise<MenuItem>;
  delete(id: string): Promise<boolean>;
}

export class MockMenuRepository implements IMenuRepository {
  private products: MenuItem[] = [];

  constructor(initialProducts?: MenuItem[]) {
    this.products = initialProducts ? [...initialProducts] : [...MENU];
  }

  async list(lojaId?: string): Promise<MenuItem[]> {
    if (!lojaId) return [...this.products];
    return this.products.filter((p) => !p.loja_id || p.loja_id === lojaId);
  }

  async getById(id: string): Promise<MenuItem | null> {
    const item = this.products.find((p) => p.id === id);
    return item ? { ...item } : null;
  }

  async create(product: MenuItem): Promise<MenuItem> {
    this.products.unshift(product);
    return { ...product };
  }

  async update(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Item do cardápio com ID ${id} não encontrado.`);
    this.products[idx] = { ...this.products[idx], ...data, updatedAt: Date.now() };
    return { ...this.products[idx] };
  }

  async delete(id: string): Promise<boolean> {
    const len = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    return this.products.length < len;
  }
}

export const menuRepository: IMenuRepository = new MockMenuRepository();
