import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  canSafelyRemoveTable,
  createInitialTables,
  TABLES_TOTAL,
  type DiningTable,
  type NewOrderInput,
  type Order,
  type OrderStatus,
  type PaymentMethod,
} from "../domain";
import { buildSeedOrders } from "../data/mock/orders.mock";
import { useAuth } from "./auth-store";

const STORAGE_ORDERS = "keepserv_orders_v4";
const STORAGE_TABLES = "keepserv_tables_v2";

export interface OrdersContextType {
  orders: Order[];
  allOrders: Order[];
  tables: DiningTable[];
  activeTables: DiningTable[];
  totalTablesCount: number;
  activeTablesCount: number;
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
  setTotalTables: (count: number) => { success: boolean; error?: string };
  toggleTableStatus: (tableId: number, reason?: string, customReason?: string) => void;
  addTable: (customId?: number, label?: string) => { success: boolean; error?: string };
  removeTable: (tableId: number) => { success: boolean; error?: string };
  isTableInOperation: (tableId: number) => boolean;
  getTable: (tableId: number) => DiningTable | undefined;
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

  const [tables, setTables] = useState<DiningTable[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TABLES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return createInitialTables(TABLES_TOTAL, "loja-1");
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
    } catch {
      // Ignora erro de localStorage
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TABLES, JSON.stringify(tables));
    } catch {
      // Ignora erro de localStorage
    }
  }, [tables]);

  const currentLojaId = useMemo(() => {
    if (session?.nivel === "dev") {
      return activeLoja?.id || null;
    }
    return session?.loja_id || "loja-1";
  }, [session, activeLoja]);

  const targetLoja = currentLojaId || "loja-1";

  const visibleTables = useMemo(() => {
    const list = tables.filter((t) =>
      t.loja_id ? t.loja_id === targetLoja : targetLoja === "loja-1",
    );
    if (list.length === 0) {
      return createInitialTables(TABLES_TOTAL, targetLoja);
    }
    return [...list].sort((a, b) => a.id - b.id);
  }, [tables, targetLoja]);

  const activeTables = useMemo(() => {
    return visibleTables.filter((t) => t.active);
  }, [visibleTables]);

  const setTotalTables = useCallback(
    (count: number) => {
      const normalizedCount = Math.round(count);
      if (normalizedCount < 1 || normalizedCount > 150) {
        const err = "A quantidade de mesas deve estar entre 1 e 150.";
        toast.error(err);
        return { success: false, error: err };
      }

      const currentList = visibleTables;
      const currentCount = currentList.length;

      if (normalizedCount === currentCount) {
        return { success: true };
      }

      if (normalizedCount > currentCount) {
        const maxId = currentList.reduce((max, t) => Math.max(max, t.id), 0);
        const toAdd: DiningTable[] = [];
        for (let i = 1; i <= normalizedCount - currentCount; i++) {
          const newId = maxId + i;
          toAdd.push({
            id: newId,
            loja_id: targetLoja,
            label: `Mesa ${newId}`,
            active: true,
            updatedAt: Date.now(),
            updatedBy: session?.nome || session?.name || "Operador",
          });
        }
        setTables((prev) => [...prev, ...toAdd]);
        toast.success(`Salão expandido: ${normalizedCount} mesas cadastradas.`);
        return { success: true };
      } else {
        const tablesToRemove = currentList.slice(normalizedCount);
        const occupied = tablesToRemove.filter((t) =>
          orders.some(
            (o) =>
              (o.loja_id ? o.loja_id === targetLoja : targetLoja === "loja-1") &&
              o.table === t.id &&
              o.status !== "pago",
          ),
        );

        if (occupied.length > 0) {
          const occupiedNumbers = occupied.map((t) => `Mesa ${t.id}`).join(", ");
          const err = `Não é possível reduzir para ${normalizedCount} mesas porque ${occupiedNumbers} possui comanda em aberto.`;
          toast.error(err);
          return { success: false, error: err };
        }

        const idsToRemove = new Set(tablesToRemove.map((t) => t.id));
        setTables((prev) =>
          prev.filter((t) => {
            const isTargetLoja = t.loja_id ? t.loja_id === targetLoja : targetLoja === "loja-1";
            if (isTargetLoja && idsToRemove.has(t.id)) {
              return false;
            }
            return true;
          }),
        );
        toast.success(`Capacidade ajustada para ${normalizedCount} mesas no salão.`);
        return { success: true };
      }
    },
    [visibleTables, orders, targetLoja, session],
  );

  const toggleTableStatus = useCallback(
    (tableId: number, reason?: string, customReason?: string) => {
      const existing = visibleTables.find((t) => t.id === tableId);
      const isCurrentlyActive = existing ? existing.active : true;
      const willBeActive = !isCurrentlyActive;
      const operatorName = session?.nome || session?.name || "Operador";

      setTables((prev) => {
        const isTargetLoja = (t: DiningTable) =>
          t.loja_id ? t.loja_id === targetLoja : targetLoja === "loja-1";
        const found = prev.some((t) => isTargetLoja(t) && t.id === tableId);

        if (!found) {
          return [
            ...prev,
            {
              id: tableId,
              loja_id: targetLoja,
              label: `Mesa ${tableId}`,
              active: willBeActive,
              statusReason: willBeActive ? undefined : reason || "manutencao",
              customReason: willBeActive ? undefined : customReason,
              updatedAt: Date.now(),
              updatedBy: operatorName,
            },
          ];
        }

        return prev.map((t) => {
          if (isTargetLoja(t) && t.id === tableId) {
            return {
              ...t,
              active: willBeActive,
              statusReason: willBeActive ? undefined : reason || "manutencao",
              customReason: willBeActive ? undefined : customReason,
              updatedAt: Date.now(),
              updatedBy: operatorName,
            };
          }
          return t;
        });
      });

      if (willBeActive) {
        toast.success(`Mesa ${tableId} reativada! Disponível para novos atendimentos.`);
      } else {
        const hasActiveOrder = orders.some(
          (o) =>
            (o.loja_id ? o.loja_id === targetLoja : targetLoja === "loja-1") &&
            o.table === tableId &&
            o.status !== "pago",
        );
        if (hasActiveOrder) {
          toast.warning(
            `Mesa ${tableId} pausada na operação. Atenção: há uma comanda em andamento nesta mesa.`,
          );
        } else {
          toast.info(`Mesa ${tableId} retirada temporariamente da operação.`);
        }
      }
    },
    [visibleTables, orders, targetLoja, session],
  );

  const addTable = useCallback(
    (customId?: number, label?: string) => {
      const nextId = customId ?? visibleTables.reduce((max, t) => Math.max(max, t.id), 0) + 1;

      if (visibleTables.some((t) => t.id === nextId)) {
        const err = `A Mesa ${nextId} já existe no salão.`;
        toast.error(err);
        return { success: false, error: err };
      }

      const newTable: DiningTable = {
        id: nextId,
        loja_id: targetLoja,
        label: label || `Mesa ${nextId}`,
        active: true,
        updatedAt: Date.now(),
        updatedBy: session?.nome || session?.name || "Operador",
      };

      setTables((prev) => [...prev, newTable]);
      toast.success(`Mesa ${nextId} adicionada com sucesso.`);
      return { success: true };
    },
    [visibleTables, targetLoja, session],
  );

  const removeTable = useCallback(
    (tableId: number) => {
      const targetOrders = orders.filter((o) =>
        o.loja_id ? o.loja_id === targetLoja : targetLoja === "loja-1",
      );
      const check = canSafelyRemoveTable(tableId, targetOrders);
      if (!check.allowed) {
        toast.error(check.reason);
        return { success: false, error: check.reason };
      }

      setTables((prev) =>
        prev.filter((t) => {
          const isTargetLoja = t.loja_id ? t.loja_id === targetLoja : targetLoja === "loja-1";
          return !(isTargetLoja && t.id === tableId);
        }),
      );
      toast.success(`Mesa ${tableId} removida do salão.`);
      return { success: true };
    },
    [orders, targetLoja],
  );

  const isTableInOperation = useCallback(
    (tableId: number) => {
      const t = visibleTables.find((table) => table.id === tableId);
      return t ? t.active : true;
    },
    [visibleTables],
  );

  const getTable = useCallback(
    (tableId: number) => {
      return visibleTables.find((t) => t.id === tableId);
    },
    [visibleTables],
  );

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
      tables: visibleTables,
      activeTables,
      totalTablesCount: visibleTables.length,
      activeTablesCount: activeTables.length,
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
      setTotalTables,
      toggleTableStatus,
      addTable,
      removeTable,
      isTableInOperation,
      getTable,
    }),
    [
      visibleOrders,
      orders,
      visibleTables,
      activeTables,
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
      setTotalTables,
      toggleTableStatus,
      addTable,
      removeTable,
      isTableInOperation,
      getTable,
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
