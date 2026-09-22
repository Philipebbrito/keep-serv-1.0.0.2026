import type { Customer, CustomerVisit } from "../../domain/customers/types";
import { buildSeedCustomers } from "../mock/customers.mock";

export interface ICustomerRepository {
  list(lojaId?: string): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
  create(customer: Customer): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<Customer>;
  delete(id: string): Promise<boolean>;
  addVisit(customerId: string, visit: CustomerVisit): Promise<Customer>;
}

export class MockCustomerRepository implements ICustomerRepository {
  private customers: Customer[] = [];

  constructor() {
    this.customers = buildSeedCustomers();
  }

  async list(lojaId?: string): Promise<Customer[]> {
    if (!lojaId) return [...this.customers];
    return this.customers.filter((c) => c.loja_id === lojaId);
  }

  async getById(id: string): Promise<Customer | null> {
    const item = this.customers.find((c) => c.id === id);
    return item ? { ...item } : null;
  }

  async create(customer: Customer): Promise<Customer> {
    this.customers.unshift(customer);
    return { ...customer };
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Cliente com ID ${id} não encontrado.`);
    this.customers[idx] = { ...this.customers[idx], ...data, updatedAt: Date.now() };
    return { ...this.customers[idx] };
  }

  async delete(id: string): Promise<boolean> {
    const len = this.customers.length;
    this.customers = this.customers.filter((c) => c.id !== id);
    return this.customers.length < len;
  }

  async addVisit(customerId: string, visit: CustomerVisit): Promise<Customer> {
    const idx = this.customers.findIndex((c) => c.id === customerId);
    if (idx === -1) throw new Error(`Cliente com ID ${customerId} não encontrado.`);
    const customer = this.customers[idx];
    const visits = [visit, ...customer.visits];
    this.customers[idx] = {
      ...customer,
      visits,
      updatedAt: Date.now(),
    };
    return { ...this.customers[idx] };
  }
}

export const customersRepository: ICustomerRepository = new MockCustomerRepository();
