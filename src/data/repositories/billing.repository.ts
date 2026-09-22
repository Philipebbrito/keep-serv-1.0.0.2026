import type { BankStatementItem, BillItem, CashFlowEntry } from "../../domain/billing/types";
import { INITIAL_BANK_STATEMENTS, INITIAL_BILLS, buildSeedCashFlow } from "../mock/billing.mock";
import { buildSeedOrders } from "../mock/orders.mock";

export interface IBillingRepository {
  listCashFlow(lojaId?: string): Promise<CashFlowEntry[]>;
  addCashFlow(entry: CashFlowEntry): Promise<CashFlowEntry>;
  deleteCashFlow(id: string): Promise<boolean>;

  listBills(lojaId?: string): Promise<BillItem[]>;
  createBill(bill: BillItem): Promise<BillItem>;
  updateBill(id: string, data: Partial<BillItem>): Promise<BillItem>;
  deleteBill(id: string): Promise<boolean>;

  listBankStatements(lojaId?: string): Promise<BankStatementItem[]>;
  updateStatement(id: string, data: Partial<BankStatementItem>): Promise<BankStatementItem>;
}

export class MockBillingRepository implements IBillingRepository {
  private cashFlow: CashFlowEntry[] = [];
  private bills: BillItem[] = [];
  private statements: BankStatementItem[] = [];

  constructor() {
    const seedOrders = buildSeedOrders(Date.now());
    this.cashFlow = buildSeedCashFlow(Date.now(), seedOrders);
    this.bills = [...INITIAL_BILLS];
    this.statements = [...INITIAL_BANK_STATEMENTS];
  }

  async listCashFlow(lojaId?: string): Promise<CashFlowEntry[]> {
    if (!lojaId) return [...this.cashFlow];
    return this.cashFlow.filter((cf) => cf.loja_id === lojaId);
  }

  async addCashFlow(entry: CashFlowEntry): Promise<CashFlowEntry> {
    this.cashFlow.unshift(entry);
    return { ...entry };
  }

  async deleteCashFlow(id: string): Promise<boolean> {
    const len = this.cashFlow.length;
    this.cashFlow = this.cashFlow.filter((cf) => cf.id !== id);
    return this.cashFlow.length < len;
  }

  async listBills(lojaId?: string): Promise<BillItem[]> {
    if (!lojaId) return [...this.bills];
    return this.bills.filter((b) => b.loja_id === lojaId);
  }

  async createBill(bill: BillItem): Promise<BillItem> {
    this.bills.unshift(bill);
    return { ...bill };
  }

  async updateBill(id: string, data: Partial<BillItem>): Promise<BillItem> {
    const idx = this.bills.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error(`Conta com ID ${id} não encontrada.`);
    this.bills[idx] = { ...this.bills[idx], ...data };
    return { ...this.bills[idx] };
  }

  async deleteBill(id: string): Promise<boolean> {
    const len = this.bills.length;
    this.bills = this.bills.filter((b) => b.id !== id);
    return this.bills.length < len;
  }

  async listBankStatements(lojaId?: string): Promise<BankStatementItem[]> {
    if (!lojaId) return [...this.statements];
    return this.statements.filter((s) => s.loja_id === lojaId);
  }

  async updateStatement(id: string, data: Partial<BankStatementItem>): Promise<BankStatementItem> {
    const idx = this.statements.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Extrato com ID ${id} não encontrado.`);
    this.statements[idx] = { ...this.statements[idx], ...data };
    return { ...this.statements[idx] };
  }
}

export const billingRepository: IBillingRepository = new MockBillingRepository();
