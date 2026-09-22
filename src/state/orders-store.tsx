import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NewOrderInput, Order, OrderStatus, PaymentMethod } from "../domain/orders/types";
import { buildSeedOrders } from "../data/mock/orders.mock";
import { useAuth } from "./auth-store";

const STORAGE_ORDERS = "keepserv_orders_v4";

export interface OrdersContextType {
  orders: Order[];
  allOrders: Order[];
  now: number;
  advance: (orderId: string) => void;
  moveTo: (orderId: string, status: OrderStatus) => void;
  sendMessage: (orderId: string, text: string) => void;
  togglePriority: (orderId: string) => void;
  cancelItem: (orderId: string, itemId: string) => void;
  createOrder: (input: NewOrderInput) => Order;
  registerPayment: (orderId: string, method: PaymentMethod, splitCount: number) => void;
  requestCleanup: (orderId: string) => void;
  completeCleanup: (orderId: string) => void;
  printBill: (orderId: string) => void;
  sendCustomerMessage: (orderId: string, text: string) => void;
  setCustomerInfo: (
    orderId: string,
    data: { name?: string; phone?: string; register?: boolean },
  ) => void;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

let orderCounter = 0;
const uid = (p: string) => `${p}-ord-${++orderCounter}`;

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { session, activeLoja } = useAuth();
  const [now, setNow] = useState(Date.now());

  // Relógio com atualização a cada segundo para cálculo de SLAs e timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ORDERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return buildSeedOrders(Date.now());
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
    } catch {
      // Ignora erro de localStorage
    }
  }, [orders]);

  const currentLojaId = useMemo(() => {
    if (session?.nivel === "dev") {
      return activeLoja?.id || null;
    }
    return session?.loja_id || "loja-1";
  }, [session, activeLoja]);

  const visibleOrders = useMemo(() => {
    if (session?.nivel === "dev" && !currentLojaId) {
      return orders;
    }
    const target = currentLojaId || "loja-1";
    return orders.filter((o) => (o.loja_id ? o.loja_id === target : target === "loja-1"));
  }, [orders, session, currentLojaId]);

  const advance = useCallback((orderId: string) => {
    const nextStatus: Record<OrderStatus, OrderStatus | null> = {
      pendente: "preparo",
      preparo: "pronto",
      pronto: "entregue",
      entregue: null,
      pago: null,
    };
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const nxt = nextStatus[o.status];
        if (!nxt) return o;
        return { ...o, status: nxt, statusChangedAt: Date.now() };
      }),
    );
  }, []);

  const moveTo = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, statusChangedAt: Date.now() } : o)),
    );
  }, []);

  const sendMessage = useCallback(
    (orderId: string, text: string) => {
      const t = text.trim();
      if (!t) return;
      const role = session?.cargo || session?.role || "garcom";
      const author = session?.nome || session?.name || "Operador";
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            messages: [
              ...o.messages,
              {
                id: uid("msg"),
                from: role,
                author,
                text: t,
                at: Date.now(),
              },
            ],
          };
        }),
      );
    },
    [session],
  );

  const togglePriority = useCallback((orderId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, priority: !o.priority } : o)));
  }, []);

  const cancelItem = useCallback((orderId: string, itemId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((it) => (it.id === itemId ? { ...it, canceled: true } : it)),
        };
      }),
    );
  }, []);

  const createOrder = useCallback(
    (input: NewOrderInput): Order => {
      const maxCode = orders.reduce((acc, o) => {
        const num = parseInt(o.code.replace("#", ""), 10);
        return Number.isNaN(num) ? acc : Math.max(acc, num);
      }, 1000);
      const code = `#${maxCode + 1}`;
      const nowTs = Date.now();
      const targetLojaId = input.loja_id || currentLojaId || "loja-1";

      const newOrd: Order = {
        id: uid("ord"),
        loja_id: targetLojaId,
        code,
        table: input.table,
        guests: input.guests,
        waiter: session?.nome || session?.name || "Garçom",
        status: "pendente",
        openedAt: nowTs,
        statusChangedAt: nowTs,
        items: input.items.map((it) => ({
          id: uid("it"),
          name: it.name,
          qty: it.qty,
          price: it.price,
          category: it.category,
          note: it.note,
        })),
        notes: input.notes,
        priority: Boolean(input.priority),
        messages: [],
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerRegistered: input.customerRegistered,
        customerIdentifiedAt: input.customerName || input.customerPhone ? nowTs : undefined,
      };

      setOrders((prev) => [newOrd, ...prev]);
      return newOrd;
    },
    [orders, session, currentLojaId],
  );

  const registerPayment = useCallback(
    (orderId: string, method: PaymentMethod, splitCount: number) => {
      const nowTs = Date.now();
      const cashierName = session?.nome || session?.name || "Operador";
      const currentRole = session?.cargo || session?.role || "caixa";

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const total = o.items
            .filter((it) => !it.canceled)
            .reduce((sum, it) => sum + it.price * it.qty, 0);

          return {
            ...o,
            status: "pago" as OrderStatus,
            statusChangedAt: nowTs,
            payment: {
              method,
              amount: total,
              splitCount: Math.max(1, splitCount),
              at: nowTs,
              cashier: cashierName,
              role: currentRole,
            },
          };
        }),
      );
    },
    [session],
  );

  const requestCleanup = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, cleanupRequested: true, cleanupRequestedAt: Date.now() } : o,
      ),
    );
  }, []);

  const completeCleanup = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, cleanupRequested: false, cleanupRequestedAt: undefined } : o,
      ),
    );
  }, []);

  const printBill = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, billPrinted: true, billPrintedAt: Date.now() } : o,
      ),
    );
  }, []);

  const sendCustomerMessage = useCallback(
    (orderId: string, text: string) => {
      const t = text.trim();
      if (!t) return;
      sendMessage(orderId, `[Cliente] ${t}`);
    },
    [sendMessage],
  );

  const setCustomerInfo = useCallback(
    (orderId: string, data: { name?: string; phone?: string; register?: boolean }) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            customerName: data.name ?? o.customerName,
            customerPhone: data.phone ?? o.customerPhone,
            customerRegistered: data.register ?? o.customerRegistered,
            customerIdentifiedAt: Date.now(),
          };
        }),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      orders: visibleOrders,
      allOrders: orders,
      now,
      advance,
      moveTo,
      sendMessage,
      togglePriority,
      cancelItem,
      createOrder,
      registerPayment,
      requestCleanup,
      completeCleanup,
      printBill,
      sendCustomerMessage,
      setCustomerInfo,
    }),
    [
      visibleOrders,
      orders,
      now,
      advance,
      moveTo,
      sendMessage,
      togglePriority,
      cancelItem,
      createOrder,
      registerPayment,
      requestCleanup,
      completeCleanup,
      printBill,
      sendCustomerMessage,
      setCustomerInfo,
    ],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error("useOrders deve ser usado dentro de um OrdersProvider");
  }
  return ctx;
}
