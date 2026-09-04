import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buildSeedCashFlow, buildSeedOrders, DEMO_ACCOUNTS, INITIAL_USERS } from "./mock-data";
import {
  STATUS_ORDER,
  orderTotal,
  type CashFlowCategory,
  type CashFlowEntry,
  type CashFlowType,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
  type Role,
  type UserAccount,
} from "./types";
import { MENU, type MenuItem, type NewProductInput } from "./menu";
import {
  INITIAL_STOCK_ITEMS,
  type NewStockItemInput,
  type StockItem,
  type StockMovement,
} from "./stock";

export interface NewUserInput {
  name: string;
  email: string;
  phone: string;
  role: Role;
  password?: string;
  avatarColor?: string;
}

export interface NewOrderInput {
  table: number;
  guests: number;
  items: {
    name: string;
    qty: number;
    price: number;
    category: OrderItem["category"];
    note?: string;
  }[];
  notes?: string;
  priority?: boolean;
  customerName?: string;
  customerPhone?: string;
  customerRegistered?: boolean;
}

export interface NewCashFlowInput {
  type: CashFlowType;
  category: CashFlowCategory;
  description: string;
  amount: number;
  method?: PaymentMethod | "transferencia" | "outro";
  notes?: string;
  author?: string;
}

interface Session {
  name: string;
  email: string;
  role: Role;
}

interface KeepServContext {
  session: Session | null;
  users: UserAccount[];
  login: (email: string, role: Role) => void;
  loginWithCredentials: (
    email: string,
    password: string,
  ) => { success: boolean; message?: string; role?: Role; name?: string };
  logout: () => void;
  addUser: (input: NewUserInput) => UserAccount;
  updateUser: (id: string, data: Partial<Omit<UserAccount, "id" | "createdAt">>) => void;
  changeUserPassword: (id: string, newPassword: string) => void;
  deleteUser: (id: string) => { success: boolean; message?: string };
  toggleUserStatus: (id: string) => void;
  orders: Order[];
  cashFlowEntries: CashFlowEntry[];
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
  addCashFlowEntry: (input: NewCashFlowInput) => CashFlowEntry;
  deleteCashFlowEntry: (id: string) => void;
  // Cardápio
  products: MenuItem[];
  addProduct: (input: NewProductInput) => MenuItem;
  updateProduct: (id: string, data: Partial<Omit<MenuItem, "id">>) => void;
  deleteProduct: (id: string) => { success: boolean; message?: string };
  adjustStock: (id: string, deltaOrExact: number, mode?: "delta" | "set") => void;
  toggleProductActive: (id: string) => void;
  resetProductsToDefault: () => void;
  // Estoque Separado (Matéria-prima e Prontos para Consumo)
  stockItems: StockItem[];
  addStockItem: (input: NewStockItemInput) => StockItem;
  updateStockItem: (id: string, data: Partial<Omit<StockItem, "id">>) => void;
  deleteStockItem: (id: string) => { success: boolean; message?: string };
  adjustStockItem: (
    id: string,
    deltaQty: number,
    reason: string,
    type?: "entrada" | "saida" | "ajuste",
  ) => void;
  resetStockToDefault: () => void;
}

const Ctx = createContext<KeepServContext | null>(null);

let counter = 0;
const uid = (p: string) => `${p}-live-${++counter}`;

let nextOrderNumber = 1043;
const nextOrderCode = () => `#${nextOrderNumber++}`;

export function KeepServProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cashFlowEntries, setCashFlowEntries] = useState<CashFlowEntry[]>([]);
  const [now, setNow] = useState(() => Date.now());

  // Cardápio sincronizado no localStorage
  const [products, setProducts] = useState<MenuItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("keepserv_products_v3");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Erro ao carregar produtos do localStorage", e);
      }
    }
    return MENU;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("keepserv_products_v3", JSON.stringify(products));
      } catch (e) {
        console.error("Erro ao salvar produtos no localStorage", e);
      }
    }
  }, [products]);

  // Estoque separado (matéria-prima e prontos para consumo)
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("keepserv_stock_v3");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Erro ao carregar estoque do localStorage", e);
      }
    }
    return INITIAL_STOCK_ITEMS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("keepserv_stock_v3", JSON.stringify(stockItems));
      } catch (e) {
        console.error("Erro ao salvar estoque no localStorage", e);
      }
    }
  }, [stockItems]);

  const [users, setUsers] = useState<UserAccount[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("keepserv_users_v2");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Erro ao carregar usuários do localStorage", e);
      }
    }
    return INITIAL_USERS;
  });

  // Salva no localStorage sempre que os usuários forem alterados
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("keepserv_users_v2", JSON.stringify(users));
      } catch (e) {
        console.error("Erro ao salvar usuários no localStorage", e);
      }
    }
  }, [users]);

  // Seed apenas no cliente para evitar divergência de tempo no SSR.
  useEffect(() => {
    const t = Date.now();
    setNow(t);
    const seedOrders = buildSeedOrders(t);
    setOrders(seedOrders);
    setCashFlowEntries(buildSeedCashFlow(t, seedOrders));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const addUser = useCallback((input: NewUserInput): UserAccount => {
    const defaultColorByRole: Record<Role, string> = {
      gestor: "bg-indigo-600",
      garcom: "bg-emerald-600",
      cozinha: "bg-amber-600",
      caixa: "bg-blue-600",
    };

    const newUser: UserAccount = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      role: input.role,
      password: input.password?.trim() || "keepserv",
      active: true,
      createdAt: Date.now(),
      lastPasswordChangeAt: Date.now(),
      avatarColor: input.avatarColor || defaultColorByRole[input.role] || "bg-primary",
    };

    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  }, []);

  const updateUser = useCallback(
    (id: string, data: Partial<Omit<UserAccount, "id" | "createdAt">>) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u;
          const updated = { ...u, ...data };
          if (data.email) updated.email = data.email.trim().toLowerCase();
          if (data.name) updated.name = data.name.trim();
          if (data.phone) updated.phone = data.phone.trim();
          return updated;
        }),
      );

      setSession((curr) => {
        if (!curr) return curr;
        const target = users.find((u) => u.id === id);
        if (target && target.email.toLowerCase() === curr.email.toLowerCase()) {
          return {
            ...curr,
            name: data.name?.trim() || curr.name,
            email: data.email?.trim().toLowerCase() || curr.email,
            role: data.role || curr.role,
          };
        }
        return curr;
      });
    },
    [users],
  );

  const changeUserPassword = useCallback((id: string, newPassword: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        return {
          ...u,
          password: newPassword.trim(),
          lastPasswordChangeAt: Date.now(),
        };
      }),
    );
  }, []);

  const deleteUser = useCallback(
    (id: string) => {
      const target = users.find((u) => u.id === id);
      if (!target) return { success: false, message: "Usuário não encontrado." };
      if (session && session.email.toLowerCase() === target.email.toLowerCase()) {
        return { success: false, message: "Você não pode remover seu próprio usuário logado." };
      }
      const activeManagers = users.filter((u) => u.role === "gestor" && u.active).length;
      if (target.role === "gestor" && activeManagers <= 1) {
        return {
          success: false,
          message: "É obrigatório manter ao menos um gestor ativo no sistema.",
        };
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
      return { success: true };
    },
    [users, session],
  );

  const toggleUserStatus = useCallback(
    (id: string) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u;
          if (session && session.email.toLowerCase() === u.email.toLowerCase() && u.active) {
            return u;
          }
          return { ...u, active: !u.active };
        }),
      );
    },
    [session],
  );

  const loginWithCredentials = useCallback(
    (email: string, pass: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();

      const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!found) {
        const demoEntry = Object.entries(DEMO_ACCOUNTS).find(
          ([, acc]) => acc.email.toLowerCase() === cleanEmail,
        );
        if (demoEntry) {
          const [role, acc] = demoEntry;
          setSession({ role: role as Role, email: acc.email, name: acc.name });
          return { success: true, role: role as Role, name: acc.name };
        }
        return { success: false, message: "E-mail não cadastrado na equipe do restaurante." };
      }

      if (!found.active) {
        return {
          success: false,
          message: "Este acesso está desativado pelo gestor. Solicite liberação.",
        };
      }

      if (found.password !== cleanPass) {
        return {
          success: false,
          message: "Senha incorreta. Solicite ao gestor a redefinição da sua senha.",
        };
      }

      setSession({
        role: found.role,
        email: found.email,
        name: found.name,
      });

      return { success: true, role: found.role, name: found.name };
    },
    [users],
  );

  const login = useCallback(
    (email: string, role: Role) => {
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setSession({ role: found.role, email: found.email, name: found.name });
        return;
      }
      const fallback = DEMO_ACCOUNTS[role]!;
      setSession({ role, email: email || fallback.email, name: fallback.name });
    },
    [users],
  );

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
        customerName: input.customerName?.trim() || undefined,
        customerPhone: input.customerPhone?.trim() || undefined,
        customerRegistered: input.customerRegistered,
        customerIdentifiedAt: input.customerName?.trim() ? t : undefined,
      };
      setOrders((prev) => [order, ...prev]);

      // Dá baixa automática no estoque conforme a relação configurada em cada produto
      setStockItems((prevStock) => {
        let updatedStock = [...prevStock];

        for (const orderedItem of input.items) {
          const prod = products.find(
            (p) => p.name.trim().toLowerCase() === orderedItem.name.trim().toLowerCase(),
          );
          if (!prod) continue;

          const consumption = prod.stockConsumption || (prod.trackStock ? "direct" : "none");

          // 1. Consumo Direto (ex: cerveja, refrigerante, vinho, garrafa)
          if (consumption === "direct") {
            const stockId = prod.linkedStockItemId;
            const directQty =
              (prod.directStockQty && prod.directStockQty > 0 ? prod.directStockQty : 1) *
              orderedItem.qty;

            updatedStock = updatedStock.map((s) => {
              if (s.id === stockId) {
                const newQ = Math.max(0, s.currentStock - directQty);
                const movement: StockMovement = {
                  id: uid("mov"),
                  type: "saida",
                  quantity: directQty,
                  previousStock: s.currentStock,
                  newStock: Number(newQ.toFixed(2)),
                  reason: `Venda Mesa ${input.table} · Comanda ${order.code} (${orderedItem.qty}x ${prod.name})`,
                  timestamp: t,
                  author: session?.name ?? "Garçom",
                  orderCode: order.code,
                };
                return {
                  ...s,
                  currentStock: Number(newQ.toFixed(2)),
                  movements: [movement, ...(s.movements || [])],
                  updatedAt: t,
                };
              }
              return s;
            });
          }
          // 2. Consumo de Matéria-Prima / Receita
          else if (consumption === "recipe" && prod.recipeIngredients?.length) {
            for (const ing of prod.recipeIngredients) {
              const neededQty = Number((ing.quantity * orderedItem.qty).toFixed(3));
              updatedStock = updatedStock.map((s) => {
                if (s.id === ing.stockItemId) {
                  const newQ = Math.max(0, s.currentStock - neededQty);
                  const movement: StockMovement = {
                    id: uid("mov"),
                    type: "saida",
                    quantity: neededQty,
                    previousStock: s.currentStock,
                    newStock: Number(newQ.toFixed(3)),
                    reason: `Consumo Insumo Mesa ${input.table} · Comanda ${order.code} (${orderedItem.qty}x ${prod.name})`,
                    timestamp: t,
                    author: session?.name ?? "Garçom",
                    orderCode: order.code,
                  };
                  return {
                    ...s,
                    currentStock: Number(newQ.toFixed(3)),
                    movements: [movement, ...(s.movements || [])],
                    updatedAt: t,
                  };
                }
                return s;
              });
            }
          }
        }

        return updatedStock;
      });

      // Atualiza também contagem legada nos produtos se houver
      setProducts((prev) =>
        prev.map((prod) => {
          if (!prod.trackStock || prod.stock === undefined) return prod;
          const orderedItem = input.items.find(
            (it) => it.name.trim().toLowerCase() === prod.name.trim().toLowerCase(),
          );
          if (!orderedItem) return prod;
          return {
            ...prod,
            stock: Math.max(0, prod.stock - orderedItem.qty),
            updatedAt: t,
          };
        }),
      );

      return order;
    },
    [session?.name, products],
  );

  const registerPayment = useCallback(
    (orderId: string, method: PaymentMethod, splitCount: number) => {
      const t = Date.now();
      let paidOrderInfo: { code: string; table: number; amount: number } | null = null;
      patch(orderId, (o) => {
        const amount = orderTotal(o);
        paidOrderInfo = { code: o.code, table: o.table, amount };
        return {
          ...o,
          status: "pago",
          statusChangedAt: t,
          payment: {
            method,
            amount,
            splitCount: Math.max(1, splitCount),
            at: t,
            cashier: session?.name ?? "Caixa",
            role: session?.role ?? "caixa",
          },
        };
      });

      if (paidOrderInfo) {
        const info = paidOrderInfo as { code: string; table: number; amount: number };
        setCashFlowEntries((prev) => [
          {
            id: uid("cf"),
            type: "entrada",
            category: "venda_comanda",
            description: `Recebimento da Comanda ${info.code} · Mesa ${info.table}`,
            amount: info.amount,
            method,
            timestamp: t,
            author: session?.name ?? "Caixa",
            orderCode: info.code,
            orderId,
            notes: `Recebido por ${session?.name ?? "Caixa"} (${splitCount > 1 ? `${splitCount}x pessoas` : "Pagamento único"})`,
          },
          ...prev,
        ]);
      }
    },
    [patch, session?.name, session?.role],
  );

  const addCashFlowEntry = useCallback(
    (input: NewCashFlowInput) => {
      const t = Date.now();
      const entry: CashFlowEntry = {
        id: uid("cf"),
        type: input.type,
        category: input.category,
        description: input.description,
        amount: Math.max(0.01, input.amount),
        method: input.method ?? (input.type === "entrada" ? "pix" : "dinheiro"),
        timestamp: t,
        author: input.author || session?.name || "Gestor",
        notes: input.notes,
      };
      setCashFlowEntries((prev) => [entry, ...prev]);
      return entry;
    },
    [session?.name],
  );

  const deleteCashFlowEntry = useCallback((id: string) => {
    setCashFlowEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const requestCleanup = useCallback(
    (orderId: string) => {
      const t = Date.now();
      patch(orderId, (o) => ({
        ...o,
        cleanupRequested: true,
        cleanupRequestedAt: t,
        messages: [
          ...o.messages,
          {
            id: uid("msg"),
            from: session?.role ?? "garcom",
            author: session?.name ?? "Sistema",
            text: "🧹 Solicitação de limpeza e higienização da mesa registrada.",
            at: t,
          },
        ],
      }));
    },
    [patch, session?.role, session?.name],
  );

  const completeCleanup = useCallback(
    (orderId: string) => {
      const t = Date.now();
      patch(orderId, (o) => ({
        ...o,
        cleanupRequested: false,
        cleanupRequestedAt: undefined,
        messages: [
          ...o.messages,
          {
            id: uid("msg"),
            from: session?.role ?? "garcom",
            author: session?.name ?? "Sistema",
            text: "✨ Higienização da mesa concluída pela equipe.",
            at: t,
          },
        ],
      }));
    },
    [patch, session?.role, session?.name],
  );

  const printBill = useCallback(
    (orderId: string) => {
      const t = Date.now();
      patch(orderId, (o) => ({
        ...o,
        billPrinted: true,
        billPrintedAt: t,
        messages: [
          ...o.messages,
          {
            id: uid("msg"),
            from: session?.role ?? "garcom",
            author: session?.name ?? "Sistema",
            text: "🖨️ Pré-conta impressa para conferência do cliente.",
            at: t,
          },
        ],
      }));
    },
    [patch, session?.role, session?.name],
  );

  const sendCustomerMessage = useCallback(
    (orderId: string, text: string) => {
      const t = Date.now();
      patch(orderId, (o) => {
        const clientIdentifier = o.customerName
          ? `Cliente (${o.customerName})`
          : `Cliente (Mesa ${o.table})`;
        return {
          ...o,
          priority: true,
          messages: [
            ...o.messages,
            {
              id: uid("msg"),
              from: "garcom",
              author: clientIdentifier,
              text,
              at: t,
            },
          ],
        };
      });
    },
    [patch],
  );

  const setCustomerInfo = useCallback(
    (orderId: string, data: { name?: string; phone?: string; register?: boolean }) => {
      const t = Date.now();
      patch(orderId, (o) => {
        // Até o fechamento da conta: se já estiver paga, não altera
        if (o.status === "pago") return o;

        const trimmedName = data.name?.trim() || undefined;
        const trimmedPhone = data.phone?.trim() || undefined;
        const isRegistered = !!data.register;

        const messageText = trimmedName
          ? `👤 Comanda identificada para: "${trimmedName}"${
              trimmedPhone ? ` · Telefone: ${trimmedPhone}` : ""
            }${isRegistered ? " (Solicitou cadastro no sistema)" : ""}`
          : "👤 Identificação do cliente removida da comanda.";

        return {
          ...o,
          customerName: trimmedName,
          customerPhone: trimmedPhone,
          customerRegistered: isRegistered,
          customerIdentifiedAt: t,
          messages: [
            ...o.messages,
            {
              id: uid("msg"),
              from: "garcom",
              author: trimmedName ? `Cliente (${trimmedName})` : `Cliente (Mesa ${o.table})`,
              text: messageText,
              at: t,
            },
          ],
        };
      });
    },
    [patch],
  );

  // MÉTODOS DE PRODUTOS DO CARDÁPIO
  const addProduct = useCallback((input: NewProductInput): MenuItem => {
    const slug = input.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const id = `${slug || "item"}-${Date.now().toString(36)}`;

    const newProduct: MenuItem = {
      id,
      name: input.name.trim(),
      price: Math.max(0, Number(input.price) || 0),
      category: input.category,
      description: input.description?.trim() || undefined,
      highlight: input.highlight,
      serves: input.serves?.trim() || undefined,
      active: input.active !== false,
      stockConsumption: input.stockConsumption || "none",
      linkedStockItemId: input.linkedStockItemId,
      directStockQty:
        input.directStockQty && input.directStockQty > 0 ? Number(input.directStockQty) : 1,
      recipeIngredients: input.recipeIngredients,
      stock: input.stock !== undefined ? Math.max(0, Math.round(Number(input.stock) || 0)) : undefined,
      minStock:
        input.minStock !== undefined ? Math.max(0, Math.round(Number(input.minStock) || 5)) : undefined,
      trackStock: input.stockConsumption !== "none",
      unit: input.unit?.trim() || "un",
      updatedAt: Date.now(),
    };

    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, data: Partial<Omit<MenuItem, "id">>) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          ...data,
          price: data.price !== undefined ? Math.max(0, Number(data.price) || 0) : item.price,
          stock:
            data.stock !== undefined
              ? Math.max(0, Math.round(Number(data.stock) || 0))
              : item.stock,
          minStock:
            data.minStock !== undefined
              ? Math.max(0, Math.round(Number(data.minStock) || 0))
              : item.minStock,
          trackStock:
            data.stockConsumption !== undefined
              ? data.stockConsumption !== "none"
              : item.trackStock,
          updatedAt: Date.now(),
        };
      }),
    );
  }, []);

  const deleteProduct = useCallback((id: string): { success: boolean; message?: string } => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return { success: true };
  }, []);

  const adjustStock = useCallback(
    (id: string, deltaOrExact: number, mode: "delta" | "set" = "delta") => {
      setProducts((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const newStock =
            mode === "delta" ? Math.max(0, (item.stock ?? 0) + deltaOrExact) : Math.max(0, deltaOrExact);
          return {
            ...item,
            stock: Math.round(newStock),
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [],
  );

  const toggleProductActive = useCallback((id: string) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active, updatedAt: Date.now() } : item,
      ),
    );
  }, []);

  const resetProductsToDefault = useCallback(() => {
    setProducts(MENU);
  }, []);

  // MÉTODOS DE GESTÃO DO ESTOQUE (MATÉRIA-PRIMA E PRONTOS PARA CONSUMO)
  const addStockItem = useCallback(
    (input: NewStockItemInput): StockItem => {
      const slug = input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const id = `stk-${slug || "item"}-${Date.now().toString(36)}`;
      const t = Date.now();

      const newItem: StockItem = {
        id,
        name: input.name.trim(),
        type: input.type,
        currentStock: Math.max(0, Number(input.currentStock) || 0),
        minStock: Math.max(0, Number(input.minStock) || 0),
        unit: input.unit.trim() || "un",
        costPrice: Math.max(0, Number(input.costPrice) || 0),
        supplier: input.supplier?.trim() || undefined,
        notes: input.notes?.trim() || undefined,
        movements: [
          {
            id: uid("mov"),
            type: "entrada",
            quantity: Math.max(0, Number(input.currentStock) || 0),
            previousStock: 0,
            newStock: Math.max(0, Number(input.currentStock) || 0),
            reason: "Cadastro inicial do item",
            timestamp: t,
            author: session?.name ?? "Gestor",
          },
        ],
        updatedAt: t,
      };

      setStockItems((prev) => [newItem, ...prev]);
      return newItem;
    },
    [session?.name],
  );

  const updateStockItem = useCallback((id: string, data: Partial<Omit<StockItem, "id">>) => {
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          ...data,
          currentStock:
            data.currentStock !== undefined
              ? Math.max(0, Number(data.currentStock))
              : item.currentStock,
          minStock:
            data.minStock !== undefined
              ? Math.max(0, Number(data.minStock))
              : item.minStock,
          costPrice:
            data.costPrice !== undefined
              ? Math.max(0, Number(data.costPrice))
              : item.costPrice,
          updatedAt: Date.now(),
        };
      }),
    );
  }, []);

  const deleteStockItem = useCallback(
    (id: string): { success: boolean; message?: string } => {
      const linkedProd = products.find(
        (p) =>
          (p.stockConsumption === "direct" && p.linkedStockItemId === id) ||
          (p.stockConsumption === "recipe" &&
            p.recipeIngredients?.some((ing) => ing.stockItemId === id)),
      );
      if (linkedProd) {
        return {
          success: false,
          message: `Este item está vinculado ao produto "${linkedProd.name}". Altere o vínculo no cardápio antes de excluí-lo.`,
        };
      }
      setStockItems((prev) => prev.filter((s) => s.id !== id));
      return { success: true };
    },
    [products],
  );

  const adjustStockItem = useCallback(
    (
      id: string,
      deltaQty: number,
      reason: string,
      type: "entrada" | "saida" | "ajuste" = "entrada",
    ) => {
      const t = Date.now();
      setStockItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          let newQ = item.currentStock;
          if (type === "entrada") {
            newQ = item.currentStock + deltaQty;
          } else if (type === "saida") {
            newQ = Math.max(0, item.currentStock - deltaQty);
          } else {
            newQ = Math.max(0, deltaQty);
          }
          newQ = Number(newQ.toFixed(3));

          const mov: StockMovement = {
            id: uid("mov"),
            type,
            quantity: deltaQty,
            previousStock: item.currentStock,
            newStock: newQ,
            reason:
              reason ||
              (type === "entrada"
                ? "Reposição de mercadoria"
                : type === "saida"
                  ? "Baixa de perda/consumo"
                  : "Ajuste manual de estoque"),
            timestamp: t,
            author: session?.name ?? "Gestor",
          };

          return {
            ...item,
            currentStock: newQ,
            movements: [mov, ...(item.movements || [])],
            updatedAt: t,
          };
        }),
      );
    },
    [session?.name],
  );

  const resetStockToDefault = useCallback(() => {
    setStockItems(INITIAL_STOCK_ITEMS);
  }, []);

  const value = useMemo(
    () => ({
      session,
      users,
      login,
      loginWithCredentials,
      logout,
      addUser,
      updateUser,
      changeUserPassword,
      deleteUser,
      toggleUserStatus,
      orders,
      cashFlowEntries,
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
      addCashFlowEntry,
      deleteCashFlowEntry,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      toggleProductActive,
      resetProductsToDefault,
      stockItems,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      adjustStockItem,
      resetStockToDefault,
    }),
    [
      session,
      users,
      login,
      loginWithCredentials,
      logout,
      addUser,
      updateUser,
      changeUserPassword,
      deleteUser,
      toggleUserStatus,
      orders,
      cashFlowEntries,
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
      addCashFlowEntry,
      deleteCashFlowEntry,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      toggleProductActive,
      resetProductsToDefault,
      stockItems,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      adjustStockItem,
      resetStockToDefault,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKeepServ() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKeepServ deve ser usado dentro de KeepServProvider");
  return ctx;
}
