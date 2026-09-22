import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Customer, NewCustomerInput, NewCustomerVisitInput } from "../domain/customers/types";
import { calcularClassificacaoCliente, calcularMetricasCliente } from "../domain/customers/rules";
import { buildSeedCustomers } from "../data/mock/customers.mock";
import { useAuth } from "./auth-store";

const STORAGE_CUSTOMERS = "keepserv_customers_v4";

export interface CustomersContextType {
  customers: Customer[];
  allCustomers: Customer[];
  addCustomer: (input: NewCustomerInput) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => { success: boolean; message?: string };
  recordCustomerVisit: (customerId: string, visit: NewCustomerVisitInput) => void;
  findCustomerByPhoneOrName: (query: string) => Customer | undefined;
  resetCustomersToDefault: () => void;
}

const CustomersContext = createContext<CustomersContextType | null>(null);

let customerCounter = 0;
const uid = (p: string) => `${p}-cust-${++customerCounter}`;

export function CustomersProvider({ children }: { children: ReactNode }) {
  const { session, activeLoja } = useAuth();

  const currentLojaId = useMemo(() => {
    if (session?.nivel === "dev") {
      return activeLoja?.id || null;
    }
    return session?.loja_id || "loja-1";
  }, [session, activeLoja]);

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOMERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return buildSeedCustomers();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(customers));
    } catch {
      // Ignora erro de localStorage
    }
  }, [customers]);

  const visibleCustomers = useMemo(() => {
    if (session?.nivel === "dev" && !currentLojaId) {
      return customers;
    }
    const target = currentLojaId || "loja-1";
    return customers.filter((c) => (c.loja_id ? c.loja_id === target : true));
  }, [customers, session, currentLojaId]);

  const addCustomer = useCallback(
    (input: NewCustomerInput): Customer => {
      const nowTs = Date.now();
      const targetLojaId = input.loja_id || currentLojaId || "loja-1";
      const initialMetrics = calcularMetricasCliente([]);

      let bDay: number | undefined;
      let bMonth: number | undefined;
      if (input.birthdate) {
        const parts = input.birthdate.split("-");
        if (parts.length === 3) {
          bMonth = parseInt(parts[1], 10) - 1;
          bDay = parseInt(parts[2], 10);
        }
      }

      const newCust: Customer = {
        id: uid("cust"),
        loja_id: targetLojaId,
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim().toLowerCase(),
        document: input.document?.trim(),
        birthdate: input.birthdate,
        birthDay: bDay,
        birthMonth: bMonth,
        address: input.address,
        status: input.status || "padrao",
        tags: input.tags || ["Novo Cliente"],
        notes: input.notes?.trim(),
        preferences: {
          tableLocation: input.preferences?.tableLocation,
          dietaryRestrictions: input.preferences?.dietaryRestrictions || [],
          favoriteDrinks: input.preferences?.favoriteDrinks || [],
          favoriteDishes: input.preferences?.favoriteDishes || [],
          cookingPreference: input.preferences?.cookingPreference,
          preferredPayment: input.preferences?.preferredPayment,
        },
        metrics: initialMetrics,
        topItems: [],
        topCategories: [],
        visits: [],
        createdAt: nowTs,
        updatedAt: nowTs,
      };

      setCustomers((prev) => [newCust, ...prev]);
      return newCust;
    },
    [currentLojaId],
  );

  const updateCustomer = useCallback((id: string, data: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c)),
    );
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    return { success: true, message: "Cliente excluído com sucesso." };
  }, []);

  const recordCustomerVisit = useCallback(
    (customerId: string, visitInput: NewCustomerVisitInput) => {
      const nowTs = visitInput.date || Date.now();
      const newVisit = {
        id: uid("visit"),
        orderId: visitInput.orderId,
        orderCode: visitInput.orderCode,
        table: visitInput.table,
        date: nowTs,
        amount: visitInput.amount,
        guests: visitInput.guests,
        itemsSummary: visitInput.itemsSummary,
        paymentMethod: visitInput.paymentMethod,
        waiter: visitInput.waiter,
        notes: visitInput.notes,
      };

      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id !== customerId) return cust;
          const updatedVisits = [newVisit, ...cust.visits];
          const newMetrics = calcularMetricasCliente(updatedVisits);
          const autoStatus = calcularClassificacaoCliente(
            newMetrics.totalSpent,
            newMetrics.totalVisits,
          );

          return {
            ...cust,
            status: cust.status === "vip" ? "vip" : autoStatus,
            metrics: newMetrics,
            visits: updatedVisits,
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [],
  );

  const findCustomerByPhoneOrName = useCallback(
    (query: string) => {
      const clean = query.trim().toLowerCase();
      if (!clean) return undefined;
      const digitsOnly = clean.replace(/\D/g, "");

      return visibleCustomers.find((c) => {
        if (c.name.toLowerCase().includes(clean)) return true;
        const phoneDigits = c.phone.replace(/\D/g, "");
        if (digitsOnly && phoneDigits.includes(digitsOnly)) return true;
        return false;
      });
    },
    [visibleCustomers],
  );

  const resetCustomersToDefault = useCallback(() => {
    setCustomers(buildSeedCustomers());
    try {
      localStorage.removeItem(STORAGE_CUSTOMERS);
    } catch {
      // Ignora erro de localStorage
    }
  }, []);

  const value = useMemo(
    () => ({
      customers: visibleCustomers,
      allCustomers: customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      recordCustomerVisit,
      findCustomerByPhoneOrName,
      resetCustomersToDefault,
    }),
    [
      visibleCustomers,
      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      recordCustomerVisit,
      findCustomerByPhoneOrName,
      resetCustomersToDefault,
    ],
  );

  return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
}

export function useCustomers() {
  const ctx = useContext(CustomersContext);
  if (!ctx) {
    throw new Error("useCustomers deve ser usado dentro de um CustomersProvider");
  }
  return ctx;
}
