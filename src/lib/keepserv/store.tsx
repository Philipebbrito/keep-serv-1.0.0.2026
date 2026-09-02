import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buildSeedOrders, DEMO_ACCOUNTS } from "./mock-data";
import {
  STATUS_ORDER,
  orderTotal,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
  type Role,
} from "./types";

export interface NewOrderInput {
  table: number;
  guests: number;
  items: { name: string; qty: number; price: number; category: OrderItem["category"]; note?: string }[];
  notes?: string;
  priority?: boolean;
}

interface Session {
  name: string;
  email: string;
  role: Role;
}

interface KeepServContext {
  session: Session | null;
  login: (email: string, role: Role) => void;
  logout: () => void;
  orders: Order[];
  now: number;
  advance: (orderId: string) => void;
  moveTo: (orderId: string, status: OrderStatus) => void;
  sendMessage: (orderId: string, text: string) => void;
  togglePriority: (orderId: string) => void;
  cancelItem: (orderId: string, itemId: string) => void;
  createOrder: (input: NewOrderInput) => Order;
  registerPayment: (orderId: string, method: PaymentMethod, splitCount: number) => void;
}

const Ctx = createContext<KeepServContext | null>(null);

let counter = 0;
const uid = (p: string) => `${p}-live-${++counter}`;

let nextOrderNumber = 1043;
const nextOrderCode = () => `#${nextOrderNumber++}`;

export function KeepServProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState(() => Date.now());

  // Seed apenas no cliente para evitar divergência de tempo no SSR.
  useEffect(() => {
    const t = Date.now();
    setNow(t);
    setOrders(buildSeedOrders(t));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const login = useCallback((email: string, role: Role) => {
    const fallback = DEMO_ACCOUNTS[role]!;
    setSession({ role, email: email || fallback.email, name: fallback.name });
  }, []);

  const logout = useCallback(() => setSession(null), []);

  const patch = useCallback((orderId: string, fn: (o: Order) => Order) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? fn(o) : o)));
  }, []);

  const moveTo = useCallback(
    (orderId: string, status: OrderStatus) => {
      patch(orderId, (o) => ({ ...o, status, statusChangedAt: Date.now() }));
    },
    [patch],
  );

  const advance = useCallback(
    (orderId: string) => {
      patch(orderId, (o) => {
        const idx = STATUS_ORDER.indexOf(o.status);
        if (idx >= STATUS_ORDER.length - 1) return o;
        return { ...o, status: STATUS_ORDER[idx + 1]!, statusChangedAt: Date.now() };
      });
    },
    [patch],
  );

  const sendMessage = useCallback(
    (orderId: string, text: string) => {
      if (!session) return;
      patch(orderId, (o) => ({
        ...o,
        priority: text.toLowerCase().includes("prioridade") ? true : o.priority,
        messages: [
          ...o.messages,
          {
            id: uid("msg"),
            from: session.role,
            author: session.name,
            text,
            at: Date.now(),
          },
        ],
      }));
    },
    [patch, session],
  );

  const togglePriority = useCallback(
    (orderId: string) => patch(orderId, (o) => ({ ...o, priority: !o.priority })),
    [patch],
  );

  const cancelItem = useCallback(
    (orderId: string, itemId: string) =>
      patch(orderId, (o) => ({
        ...o,
        items: o.items.map((i) => (i.id === itemId ? { ...i, canceled: !i.canceled } : i)),
      })),
    [patch],
  );

  const createOrder = useCallback(
    (input: NewOrderInput) => {
      const t = Date.now();
      const order: Order = {
        id: uid("ord"),
        code: nextOrderCode(),
        table: input.table,
        guests: input.guests,
        waiter: session?.name ?? "Garçom",
        status: "pendente",
        openedAt: t,
        statusChangedAt: t,
        items: input.items.map((it) => ({
          id: uid("it"),
          name: it.name,
          qty: it.qty,
          price: it.price,
          category: it.category,
          note: it.note,
        })),
        notes: input.notes,
        priority: input.priority ?? false,
        messages: [],
      };
      setOrders((prev) => [order, ...prev]);
      return order;
    },
    [session?.name],
  );

  const registerPayment = useCallback(
    (orderId: string, method: PaymentMethod, splitCount: number) => {
      const t = Date.now();
      patch(orderId, (o) => ({
        ...o,
        status: "pago",
        statusChangedAt: t,
        payment: {
          method,
          amount: orderTotal(o),
          splitCount: Math.max(1, splitCount),
          at: t,
          cashier: session?.name ?? "Caixa",
        },
      }));
    },
    [patch, session?.name],
  );

  const value = useMemo(
    () => ({
      session,
      login,
      logout,
      orders,
      now,
      advance,
      moveTo,
      sendMessage,
      togglePriority,
      cancelItem,
      createOrder,
      registerPayment,
    }),
    [
      session,
      login,
      logout,
      orders,
      now,
      advance,
      moveTo,
      sendMessage,
      togglePriority,
      cancelItem,
      createOrder,
      registerPayment,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKeepServ() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKeepServ deve ser usado dentro de KeepServProvider");
  return ctx;
}
