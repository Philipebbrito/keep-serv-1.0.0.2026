import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  BankAccount,
  BankStatementItem,
  BillItem,
  CashFlowEntry,
  NewBillInput,
  NewCashFlowInput,
} from "../domain/billing/types";
import {
  BANK_ACCOUNTS,
  INITIAL_BANK_STATEMENTS,
  INITIAL_BILLS,
  buildSeedCashFlow,
} from "../data/mock/billing.mock";
import { useAuth } from "./auth-store";
import { useOrders } from "./orders-store";

const STORAGE_CASHFLOW = "keepserv_cashflow_v4";
const STORAGE_BILLS = "keepserv_bills_v4";
const STORAGE_STATEMENTS = "keepserv_statements_v4";

export interface BillingContextType {
  cashFlowEntries: CashFlowEntry[];
  bills: BillItem[];
  allBills: BillItem[];
  bankAccounts: BankAccount[];
  bankStatements: BankStatementItem[];

  // Fluxo de Caixa
  addCashFlowEntry: (input: NewCashFlowInput) => CashFlowEntry;
  deleteCashFlowEntry: (id: string) => void;
  resetCashFlowToDefault: () => void;

  // Contas a Pagar & Receber
  addBill: (input: NewBillInput) => BillItem;
  updateBill: (id: string, data: Partial<Omit<BillItem, "id">>) => void;
  deleteBill: (id: string) => { success: boolean; message?: string };
  payBill: (
    id: string,
    options?: {
      paidAt?: number;
      paidAmount?: number;
      paymentMethod?: string;
      bankAccount?: string;
      syncWithCashFlow?: boolean;
    },
  ) => void;
  reconcileBill: (id: string, conciliated: boolean, ref?: string) => void;
  reconcileStatementItem: (statementId: string, billId?: string) => void;
  autoReconcileAll: () => { matchedCount: number; message: string };
  resetBillsToDefault: () => void;
}

const BillingContext = createContext<BillingContextType | null>(null);

let billCounter = 0;
const uid = (p: string) => `${p}-bill-${++billCounter}`;

export function BillingProvider({ children }: { children: ReactNode }) {
  const { session, activeLoja } = useAuth();
  const { allOrders, orders } = useOrders();

  const currentLojaId = useMemo(() => {
    if (session?.nivel === "dev") {
      return activeLoja?.id || null;
    }
    return session?.loja_id || "loja-1";
  }, [session, activeLoja]);

  // Fluxo de Caixa
  const [cashFlowEntries, setCashFlowEntries] = useState<CashFlowEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CASHFLOW);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return buildSeedCashFlow(Date.now(), allOrders);
  });

  // Contas a Pagar & Receber
  const [bills, setBills] = useState<BillItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BILLS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_BILLS;
  });

  // Extratos Bancários
  const [bankStatements, setBankStatements] = useState<BankStatementItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STATEMENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_BANK_STATEMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CASHFLOW, JSON.stringify(cashFlowEntries));
    } catch {
      // Ignora erro de localStorage
    }
  }, [cashFlowEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BILLS, JSON.stringify(bills));
    } catch {
      // Ignora erro de localStorage
    }
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STATEMENTS, JSON.stringify(bankStatements));
    } catch {
      // Ignora erro de localStorage
    }
  }, [bankStatements]);

  // Filtragem multi-tenant
  const visibleCashFlow = useMemo(() => {
    if (session?.nivel === "dev" && !currentLojaId) {
      return cashFlowEntries;
    }
    const target = currentLojaId || "loja-1";
    return cashFlowEntries.filter((cf) =>
      cf.loja_id ? cf.loja_id === target : target === "loja-1",
    );
  }, [cashFlowEntries, session, currentLojaId]);

  const visibleBills = useMemo(() => {
    if (session?.nivel === "dev" && !currentLojaId) {
      return bills;
    }
    const target = currentLojaId || "loja-1";
    return bills.filter((b) => (b.loja_id ? b.loja_id === target : target === "loja-1"));
  }, [bills, session, currentLojaId]);

  const visibleStatements = useMemo(() => {
    if (session?.nivel === "dev" && !currentLojaId) {
      return bankStatements;
    }
    const target = currentLojaId || "loja-1";
    return bankStatements.filter((s) => (s.loja_id ? s.loja_id === target : target === "loja-1"));
  }, [bankStatements, session, currentLojaId]);

  const addCashFlowEntry = useCallback(
    (input: NewCashFlowInput): CashFlowEntry => {
      const targetLojaId = input.loja_id || currentLojaId || "loja-1";
      const newEntry: CashFlowEntry = {
        id: uid("cf"),
        loja_id: targetLojaId,
        type: input.type,
        category: input.category,
        description: input.description.trim(),
        amount: input.amount,
        method: input.method,
        timestamp: input.timestamp || Date.now(),
        author: input.author || session?.nome || session?.name || "Operador",
        notes: input.notes,
      };

      setCashFlowEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    },
    [session, currentLojaId],
  );

  const deleteCashFlowEntry = useCallback((id: string) => {
    setCashFlowEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const resetCashFlowToDefault = useCallback(() => {
    const fresh = buildSeedCashFlow(Date.now(), orders);
    setCashFlowEntries(fresh);
    try {
      localStorage.removeItem(STORAGE_CASHFLOW);
    } catch {
      // Ignora erro de localStorage
    }
  }, [orders]);

  const addBill = useCallback(
    (input: NewBillInput): BillItem => {
      const nowTs = Date.now();
      const targetLojaId = input.loja_id || currentLojaId || "loja-1";
      const newBill: BillItem = {
        id: uid("bill"),
        loja_id: targetLojaId,
        type: input.type,
        title: input.title.trim(),
        entityName: input.entityName.trim(),
        entityDocument: input.entityDocument?.trim(),
        category: input.category,
        isFixedCost: Boolean(input.isFixedCost),
        recurrence: input.recurrence || "nenhuma",
        amount: input.amount,
        dueDate: input.dueDate,
        issueDate: input.issueDate || nowTs,
        status: input.dueDate < nowTs ? "vencido" : "pendente",
        barcode: input.barcode?.trim(),
        boletoBank: input.boletoBank?.trim(),
        invoiceNumber: input.invoiceNumber?.trim(),
        bankAccount: input.bankAccount,
        notes: input.notes?.trim(),
        conciliationStatus: "pendente",
        author: session?.nome || session?.name || "Gestor",
        createdAt: nowTs,
      };

      setBills((prev) => [newBill, ...prev]);
      return newBill;
    },
    [session, currentLojaId],
  );

  const updateBill = useCallback((id: string, data: Partial<Omit<BillItem, "id">>) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  }, []);

  const deleteBill = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
    return { success: true, message: "Lançamento excluído com sucesso." };
  }, []);

  const payBill = useCallback(
    (
      id: string,
      options?: {
        paidAt?: number;
        paidAmount?: number;
        paymentMethod?: string;
        bankAccount?: string;
        syncWithCashFlow?: boolean;
      },
    ) => {
      const targetBill = bills.find((b) => b.id === id);
      if (!targetBill) return;

      const paidAt = options?.paidAt || Date.now();
      const paidAmount = options?.paidAmount ?? targetBill.amount;

      setBills((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: "pago",
                paidAt,
                paidAmount,
                paymentMethod: options?.paymentMethod || b.paymentMethod || "pix",
                bankAccount: options?.bankAccount || b.bankAccount || "itau",
              }
            : b,
        ),
      );

      if (options?.syncWithCashFlow !== false) {
        addCashFlowEntry({
          loja_id: targetBill.loja_id,
          type: targetBill.type === "pagar" ? "saida" : "entrada",
          category: targetBill.type === "pagar" ? "insumos" : "outros",
          description: `Baixa de Conta: ${targetBill.title} (${targetBill.entityName})`,
          amount: paidAmount,
          method: "transferencia",
          notes: `Pago via ${options?.bankAccount || "Banco"} - Doc/NF: ${targetBill.invoiceNumber || "N/A"}`,
        });
      }
    },
    [bills, addCashFlowEntry],
  );

  const reconcileBill = useCallback((id: string, conciliated: boolean, ref?: string) => {
    setBills((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              conciliationStatus: conciliated ? "conciliado" : "pendente",
              conciliatedAt: conciliated ? Date.now() : undefined,
              conciliationRef: ref || b.conciliationRef,
            }
          : b,
      ),
    );
  }, []);

  const reconcileStatementItem = useCallback(
    (statementId: string, billId?: string) => {
      setBankStatements((prev) =>
        prev.map((s) =>
          s.id === statementId
            ? {
                ...s,
                conciliated: true,
                matchedBillId: billId || s.matchedBillId,
              }
            : s,
        ),
      );

      if (billId) {
        reconcileBill(billId, true, `Extrato #${statementId}`);
      }
    },
    [reconcileBill],
  );

  const autoReconcileAll = useCallback(() => {
    let matched = 0;
    const pendingBills = bills.filter(
      (b) => b.status === "pago" && b.conciliationStatus === "pendente",
    );

    setBankStatements((prev) =>
      prev.map((stmt) => {
        if (stmt.conciliated) return stmt;

        const match = pendingBills.find((b) => {
          const matchAmount = Math.abs(b.paidAmount || b.amount) === Math.abs(stmt.amount);
          return matchAmount;
        });

        if (match) {
          matched++;
          reconcileBill(match.id, true, `Extrato #${stmt.id}`);
          return {
            ...stmt,
            conciliated: true,
            matchedBillId: match.id,
          };
        }

        return stmt;
      }),
    );

    return {
      matchedCount: matched,
      message: `${matched} transações foram conciliadas automaticamente pelo valor exato.`,
    };
  }, [bills, reconcileBill]);

  const resetBillsToDefault = useCallback(() => {
    setBills(INITIAL_BILLS);
    setBankStatements(INITIAL_BANK_STATEMENTS);
    try {
      localStorage.removeItem(STORAGE_BILLS);
      localStorage.removeItem(STORAGE_STATEMENTS);
    } catch {
      // Ignora erro de localStorage
    }
  }, []);

  const value = useMemo(
    () => ({
      cashFlowEntries: visibleCashFlow,
      bills: visibleBills,
      allBills: bills,
      bankAccounts: BANK_ACCOUNTS,
      bankStatements: visibleStatements,
      addCashFlowEntry,
      deleteCashFlowEntry,
      resetCashFlowToDefault,
      addBill,
      updateBill,
      deleteBill,
      payBill,
      reconcileBill,
      reconcileStatementItem,
      autoReconcileAll,
      resetBillsToDefault,
    }),
    [
      visibleCashFlow,
      visibleBills,
      bills,
      visibleStatements,
      addCashFlowEntry,
      deleteCashFlowEntry,
      resetCashFlowToDefault,
      addBill,
      updateBill,
      deleteBill,
      payBill,
      reconcileBill,
      reconcileStatementItem,
      autoReconcileAll,
      resetBillsToDefault,
    ],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) {
    throw new Error("useBilling deve ser usado dentro de um BillingProvider");
  }
  return ctx;
}
