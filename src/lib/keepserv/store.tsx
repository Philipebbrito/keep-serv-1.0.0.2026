import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildSeedCashFlow,
  buildSeedOrders,
  DEMO_ACCOUNTS,
  INITIAL_LOJAS,
  INITIAL_USERS,
} from "./mock-data";
import {
  STATUS_ORDER,
  orderTotal,
  type CashFlowCategory,
  type CashFlowEntry,
  type CashFlowType,
  type Loja,
  type NivelAcesso,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
  type Role,
  type StatusLoja,
  type UserAccount,
} from "./types";
import { MENU, type MenuItem, type NewProductInput } from "./menu";
import {
  INITIAL_STOCK_ITEMS,
  type NewStockItemInput,
  type StockItem,
  type StockMovement,
} from "./stock";

export interface NewLojaInput {
  nome_fantasia: string;
  codigo_loja: string;
  status?: StatusLoja;
  cidade?: string;
  telefone?: string;
}

export interface NewGestorInput {
  nome: string;
  usuario: string; // Nome de usuário para login
  senha: string;
  email?: string;
  phone?: string;
}

export type NewDonoInput = NewGestorInput;

export interface NewUserInput {
  name: string;
  usuario?: string;
  username?: string;
  email?: string;
  phone: string;
  role: Role; // Função operacional: garcom, cozinha, caixa, gestor
  password?: string;
  avatarColor?: string;
  loja_id?: string;
  nivel?: NivelAcesso;
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
  loja_id?: string;
}

export interface NewCashFlowInput {
  type: CashFlowType;
  category: CashFlowCategory;
  description: string;
  amount: number;
  method?: PaymentMethod | "transferencia" | "outro";
  notes?: string;
  author?: string;
  loja_id?: string;
  timestamp?: number;
}

export interface Session {
  id: string;
  name: string;
  nome: string;
  usuario?: string;
  username?: string;
  email: string;
  role: Role;
  cargo: Role;
  nivel: NivelAcesso; // 'dev' | 'gestor' | 'dono_loja' | 'colaborador'
  loja_id: string | null; // Chave da loja vinculada (NULL para 'dev')
  loja: Loja | null;
  user: UserAccount;
}

interface KeepServContext {
  session: Session | null;
  lojas: Loja[];
  allLojas: Loja[];
  activeLoja: Loja | null;
  createLoja: (
    lojaInput: NewLojaInput,
    gestorInput: NewGestorInput,
  ) => {
    success: boolean;
    message?: string;
    loja?: Loja;
    dono?: UserAccount;
    gestor?: UserAccount;
  };
  updateLoja: (id: string, data: Partial<Loja>) => void;
  toggleLojaStatus: (id: string) => void;
  deleteLoja: (id: string) => { success: boolean; message?: string };
  switchActiveLoja: (lojaId: string | null) => void;

  users: UserAccount[];
  allUsers: UserAccount[];
  login: (usuarioOuEmail: string, role: Role, codigo_loja?: string) => void;
  loginWithCredentials: (
    usuarioOuEmail: string,
    password: string,
    codigo_loja?: string,
  ) => {
    success: boolean;
    message?: string;
    role?: Role;
    name?: string;
    nivel?: NivelAcesso;
    loja_id?: string | null;
    redirectTo?: string;
  };
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
  resetCashFlowToDefault: () => void;

  // Cardápio
  products: MenuItem[];
  addProduct: (input: NewProductInput) => MenuItem;
  updateProduct: (id: string, data: Partial<Omit<MenuItem, "id">>) => void;
  deleteProduct: (id: string) => { success: boolean; message?: string };
  adjustStock: (id: string, deltaOrExact: number, mode?: "delta" | "set") => void;
  toggleProductActive: (id: string) => void;
  resetProductsToDefault: () => void;

  // Estoque
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
  // SESSÃO DO USUÁRIO
  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("keepserv_session_v4");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error("Erro ao carregar sessão do localStorage", e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (session) {
          localStorage.setItem("keepserv_session_v4", JSON.stringify(session));
        } else {
          localStorage.removeItem("keepserv_session_v4");
        }
      } catch (e) {
        console.error("Erro ao salvar sessão no localStorage", e);
      }
    }
  }, [session]);

  // LOJAS (Multi-Tenant)
  const [allLojas, setAllLojas] = useState<Loja[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("keepserv_lojas_v4");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Erro ao carregar lojas do localStorage", e);
      }
    }
    return INITIAL_LOJAS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("keepserv_lojas_v4", JSON.stringify(allLojas));
      } catch (e) {
        console.error("Erro ao salvar lojas no localStorage", e);
      }
    }
  }, [allLojas]);

  // USUÁRIOS (RBAC & Tenants)
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("keepserv_users_v4");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Se encontrar os dados novos que já possuem nivel, utiliza-os
            if (parsed.some((u: UserAccount) => u.nivel)) return parsed;
          }
        }
      } catch (e) {
        console.error("Erro ao carregar usuários do localStorage", e);
      }
    }
    return INITIAL_USERS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("keepserv_users_v4", JSON.stringify(allUsers));
      } catch (e) {
        console.error("Erro ao salvar usuários no localStorage", e);
      }
    }
  }, [allUsers]);

  // Override de loja para desenvolvedor inspecionar uma loja específica
  const [activeLojaOverride, setActiveLojaOverride] = useState<string | null>(null);

  // Determina o loja_id do contexto operacional atual
  const currentLojaId = useMemo(() => {
    if (activeLojaOverride) return activeLojaOverride;
    if (session?.loja_id) return session.loja_id;
    if (session?.nivel === "dev") return null; // Dev sem filtro vê visão geral
    return "loja-1"; // Fallback para clientes não autenticados na demonstração
  }, [session, activeLojaOverride]);

  const activeLoja = useMemo(() => {
    if (currentLojaId) {
      return allLojas.find((l) => l.id === currentLojaId) || null;
    }
    if (session?.loja) return session.loja;
    return null;
  }, [currentLojaId, allLojas, session]);

  // Lista de lojas visíveis
  const lojas = useMemo(() => {
    if (session?.nivel === "dev") return allLojas;
    if (session?.loja_id) return allLojas.filter((l) => l.id === session.loja_id);
    return allLojas;
  }, [allLojas, session]);

  // CARDÁPIO / PRODUTOS (com isolamento por loja_id)
  const [allProducts, setAllProducts] = useState<MenuItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("keepserv_products_v4");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: MenuItem) => ({
              ...p,
              loja_id: p.loja_id || "loja-1",
            }));
          }
        }
      } catch (e) {
        console.error("Erro ao carregar produtos do localStorage", e);
      }
    }
    return MENU.map((m) => ({ ...m, loja_id: m.loja_id || "loja-1" }));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("keepserv_products_v4", JSON.stringify(allProducts));
      } catch (e) {
        console.error("Erro ao salvar produtos no localStorage", e);
      }
    }
  }, [allProducts]);

  // ESTOQUE (com isolamento por loja_id)
  const [allStockItems, setAllStockItems] = useState<StockItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("keepserv_stock_v4");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((s: StockItem) => ({
              ...s,
              loja_id: s.loja_id || "loja-1",
            }));
          }
        }
      } catch (e) {
        console.error("Erro ao carregar estoque do localStorage", e);
      }
    }
    return INITIAL_STOCK_ITEMS.map((s) => ({ ...s, loja_id: s.loja_id || "loja-1" }));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("keepserv_stock_v4", JSON.stringify(allStockItems));
      } catch (e) {
        console.error("Erro ao salvar estoque no localStorage", e);
      }
    }
  }, [allStockItems]);

  // PEDIDOS (com isolamento por loja_id)
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allCashFlowEntries, setAllCashFlowEntries] = useState<CashFlowEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("keepserv_cashflow_v5");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Erro ao carregar fluxo de caixa do localStorage", e);
      }
    }
    return [];
  });
  const [now, setNow] = useState(() => Date.now());

  // Seed de pedidos e caixa
  useEffect(() => {
    const t = Date.now();
    setNow(t);
    const seedOrders = buildSeedOrders(t);
    setAllOrders(seedOrders);
    setAllCashFlowEntries((prev) => {
      // Se já tem histórico persistido com pelo menos 10 itens, mantém; senão carrega o seed rico
      if (prev && prev.length >= 10) return prev;
      return buildSeedCashFlow(t, seedOrders);
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && allCashFlowEntries.length > 0) {
      try {
        localStorage.setItem("keepserv_cashflow_v5", JSON.stringify(allCashFlowEntries));
      } catch (e) {
        console.error("Erro ao salvar fluxo de caixa no localStorage", e);
      }
    }
  }, [allCashFlowEntries]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // --- PROJEÇÕES DE DADOS ISOLADAS POR TENANT (loja_id) ---
  const orders = useMemo(() => {
    if (!currentLojaId) return allOrders;
    return allOrders.filter((o) => o.loja_id === currentLojaId);
  }, [allOrders, currentLojaId]);

  const products = useMemo(() => {
    if (!currentLojaId) return allProducts;
    return allProducts.filter((p) => !p.loja_id || p.loja_id === currentLojaId);
  }, [allProducts, currentLojaId]);

  const stockItems = useMemo(() => {
    if (!currentLojaId) return allStockItems;
    return allStockItems.filter((s) => !s.loja_id || s.loja_id === currentLojaId);
  }, [allStockItems, currentLojaId]);

  const cashFlowEntries = useMemo(() => {
    if (!currentLojaId) return allCashFlowEntries;
    return allCashFlowEntries.filter((c) => !c.loja_id || c.loja_id === currentLojaId);
  }, [allCashFlowEntries, currentLojaId]);

  const users = useMemo(() => {
    if (session?.nivel === "dev" && !currentLojaId) return allUsers;
    if (currentLojaId) {
      return allUsers.filter((u) => u.loja_id === currentLojaId);
    }
    return allUsers;
  }, [allUsers, currentLojaId, session?.nivel]);

  // --- OPERAÇÕES DE LOJAS (Super Admin 'dev') ---
  const createLoja = useCallback(
    (
      lojaInput: NewLojaInput,
      gestorInput: NewGestorInput,
    ): {
      success: boolean;
      message?: string;
      loja?: Loja;
      dono?: UserAccount;
      gestor?: UserAccount;
    } => {
      // Validação de permissão: apenas 'dev'
      if (session && session.nivel !== "dev") {
        return {
          success: false,
          message:
            "Acesso negado: apenas o Desenvolvedor do sistema (Super Admin) pode cadastrar lojas cadastradas.",
        };
      }

      const cleanCodigo = lojaInput.codigo_loja.trim().toUpperCase();
      const cleanNome = lojaInput.nome_fantasia.trim();
      const cleanGestorNome = gestorInput.nome.trim();
      const cleanGestorUsuario = (
        gestorInput.usuario ||
        gestorInput.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "_")
      )
        .trim()
        .toLowerCase();
      const cleanGestorEmail =
        gestorInput.email?.trim().toLowerCase() ||
        `${cleanGestorUsuario}@${cleanCodigo.toLowerCase()}.keepserv.app`;
      const cleanGestorSenha = gestorInput.senha.trim();

      if (!cleanNome) {
        return { success: false, message: "O nome fantasia da loja é obrigatório." };
      }

      if (!cleanCodigo || cleanCodigo.length < 3) {
        return {
          success: false,
          message: "O código da loja deve conter pelo menos 3 caracteres alfanuméricos.",
        };
      }

      // Valida se o código da loja é único
      const codeExists = allLojas.some((l) => l.codigo_loja.trim().toUpperCase() === cleanCodigo);
      if (codeExists) {
        return {
          success: false,
          message: `O código de loja "${cleanCodigo}" já está em uso por outro estabelecimento. Escolha outro código.`,
        };
      }

      if (!cleanGestorNome) {
        return { success: false, message: "O nome do Gestor da loja é obrigatório." };
      }

      if (!cleanGestorUsuario || cleanGestorUsuario.length < 3) {
        return {
          success: false,
          message: "O nome de usuário do Gestor deve conter pelo menos 3 caracteres alfanuméricos.",
        };
      }

      // Valida se o nome de usuário já está em uso
      const usernameExists = allUsers.some(
        (u) =>
          (u.usuario && u.usuario.trim().toLowerCase() === cleanGestorUsuario) ||
          (u.username && u.username.trim().toLowerCase() === cleanGestorUsuario),
      );
      if (usernameExists) {
        return {
          success: false,
          message: `O nome de usuário "${cleanGestorUsuario}" já está cadastrado no sistema. Escolha outro nome de usuário para o Gestor.`,
        };
      }

      if (!cleanGestorSenha || cleanGestorSenha.length < 4) {
        return { success: false, message: "A senha do Gestor deve ter pelo menos 4 caracteres." };
      }

      const newLojaId = `loja-${Date.now()}`;
      const newGestorId = `usr-gestor-${Date.now()}`;

      const newLoja: Loja = {
        id: newLojaId,
        nome_fantasia: cleanNome,
        codigo_loja: cleanCodigo,
        status: lojaInput.status || "ativo",
        created_at: Date.now(),
        gestor_id: newGestorId,
        dono_id: newGestorId,
        cidade: lojaInput.cidade?.trim(),
        telefone: lojaInput.telefone?.trim(),
      };

      // Usuário principal desta loja: nivel = 'gestor'
      const newGestor: UserAccount = {
        id: newGestorId,
        loja_id: newLojaId, // Chave estrangeira para a loja criada
        usuario: cleanGestorUsuario,
        username: cleanGestorUsuario,
        nome: cleanGestorNome,
        name: cleanGestorNome,
        email: cleanGestorEmail,
        senha: cleanGestorSenha,
        password: cleanGestorSenha,
        nivel: "gestor", // Nível gestor
        cargo: "gestor",
        role: "gestor",
        phone: gestorInput.phone?.trim() || "",
        active: true,
        createdAt: Date.now(),
        avatarColor: "bg-indigo-600",
      };

      setAllLojas((prev) => [newLoja, ...prev]);
      setAllUsers((prev) => [newGestor, ...prev]);

      // Clona itens de cardápio padrão com o novo loja_id para permitir testes imediatos
      const clonedMenu: MenuItem[] = MENU.slice(0, 10).map((item, idx) => ({
        ...item,
        id: `prod-${newLojaId}-${idx + 1}`,
        loja_id: newLojaId,
      }));
      setAllProducts((prev) => [...clonedMenu, ...prev]);

      // Clona itens de estoque padrão para a nova loja
      const clonedStock: StockItem[] = INITIAL_STOCK_ITEMS.slice(0, 8).map((item, idx) => ({
        ...item,
        id: `stk-${newLojaId}-${idx + 1}`,
        loja_id: newLojaId,
      }));
      setAllStockItems((prev) => [...clonedStock, ...prev]);

      return { success: true, loja: newLoja, dono: newGestor, gestor: newGestor };
    },
    [allLojas, allUsers, session],
  );

  const updateLoja = useCallback((id: string, data: Partial<Loja>) => {
    setAllLojas((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...data };
        if (data.codigo_loja !== undefined)
          updated.codigo_loja = data.codigo_loja.trim().toUpperCase();
        if (data.nome_fantasia !== undefined) updated.nome_fantasia = data.nome_fantasia.trim();
        if (data.cidade !== undefined) updated.cidade = data.cidade.trim();
        if (data.telefone !== undefined) updated.telefone = data.telefone.trim();
        if (data.razao_social !== undefined) updated.razao_social = data.razao_social.trim();
        if (data.cnpj !== undefined) updated.cnpj = data.cnpj.trim();
        if (data.status !== undefined) updated.status = data.status;
        if (data.gestor_id !== undefined) {
          updated.gestor_id = data.gestor_id;
          updated.dono_id = data.gestor_id;
        }
        return updated;
      }),
    );
  }, []);

  const toggleLojaStatus = useCallback((id: string) => {
    setAllLojas((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: l.status === "ativo" ? "inativo" : "ativo" } : l,
      ),
    );
  }, []);

  const deleteLoja = useCallback(
    (id: string) => {
      const target = allLojas.find((l) => l.id === id);
      if (!target) return { success: false, message: "Loja não encontrada." };

      setAllLojas((prev) => prev.filter((l) => l.id !== id));
      setAllUsers((prev) => prev.filter((u) => u.loja_id !== id));
      setAllProducts((prev) => prev.filter((p) => p.loja_id !== id));
      setAllStockItems((prev) => prev.filter((s) => s.loja_id !== id));
      setAllOrders((prev) => prev.filter((o) => o.loja_id !== id));
      setAllCashFlowEntries((prev) => prev.filter((c) => c.loja_id !== id));

      if (session?.loja_id === id) {
        setSession(null);
      }
      return { success: true };
    },
    [allLojas, session],
  );

  const switchActiveLoja = useCallback((lojaId: string | null) => {
    setActiveLojaOverride(lojaId);
  }, []);

  // --- AUTENTICAÇÃO E LOGIN (Item 3 da especificação) ---
  const loginWithCredentials = useCallback(
    (usuarioOuEmail: string, pass: string, codigo_loja?: string) => {
      const cleanId = usuarioOuEmail.trim().toLowerCase();
      const cleanPass = pass.trim();
      const cleanCodigo = codigo_loja ? codigo_loja.trim().toUpperCase() : "";

      const matchesUser = (u: UserAccount) => {
        const uUser = u.usuario?.trim().toLowerCase();
        const uNameAlias = u.username?.trim().toLowerCase();
        const uEmail = u.email?.trim().toLowerCase();
        return uUser === cleanId || uNameAlias === cleanId || uEmail === cleanId;
      };

      // CENÁRIO 1: Código de Loja preenchido
      if (cleanCodigo) {
        const targetLoja = allLojas.find((l) => l.codigo_loja.trim().toUpperCase() === cleanCodigo);

        if (!targetLoja) {
          return {
            success: false,
            message: `Código de loja "${cleanCodigo}" não encontrado. Verifique o código da sua loja.`,
          };
        }

        if (targetLoja.status !== "ativo") {
          return {
            success: false,
            message: `Acesso bloqueado: A loja "${targetLoja.nome_fantasia}" está inativa no sistema. Entre em contato com o suporte.`,
          };
        }

        // Procura usuário pelo nome de usuário ou email
        const found = allUsers.find(matchesUser);
        if (!found) {
          return {
            success: false,
            message:
              "Nome de usuário não cadastrado na equipe desta loja. Verifique o usuário digitado.",
          };
        }

        // Validação estrita: usuário pertence a esta loja_id
        if (found.loja_id !== targetLoja.id) {
          return {
            success: false,
            message: `Acesso negado: O usuário "${found.usuario || found.nome || found.name}" não pertence à loja "${targetLoja.nome_fantasia}".`,
          };
        }

        if (!found.active) {
          return {
            success: false,
            message: "Este acesso está desativado pelo Gestor da loja. Solicite liberação.",
          };
        }

        const actualPass = found.senha || found.password || "keepserv";
        if (actualPass !== cleanPass) {
          return {
            success: false,
            message: "Senha incorreta para este usuário.",
          };
        }

        const newSession: Session = {
          id: found.id,
          name: found.nome || found.name,
          nome: found.nome || found.name,
          usuario: found.usuario || found.username || cleanId,
          username: found.usuario || found.username || cleanId,
          email: found.email,
          role: found.cargo || found.role || "gestor",
          cargo: found.cargo || found.role || "gestor",
          nivel: found.nivel === "dono_loja" ? "gestor" : found.nivel || "colaborador",
          loja_id: targetLoja.id,
          loja: targetLoja,
          user: found,
        };

        setSession(newSession);
        setActiveLojaOverride(null);

        return {
          success: true,
          role: newSession.role,
          name: newSession.name,
          nivel: newSession.nivel,
          loja_id: targetLoja.id,
          redirectTo:
            newSession.role === "gestor"
              ? "/dashboard"
              : newSession.role === "caixa"
                ? "/caixa"
                : "/pedidos",
        };
      }

      // CENÁRIO 2: Código de Loja em branco (Exclusivo para Dev)
      const foundUser = allUsers.find(matchesUser);
      if (!foundUser) {
        return {
          success: false,
          message:
            "Usuário não encontrado. Se você é Gestor ou Colaborador, informe o Código da Loja.",
        };
      }

      if (foundUser.nivel !== "dev") {
        return {
          success: false,
          message:
            "Acesso sem código de loja é exclusivo para o Desenvolvedor do sistema (Super Admin). Por favor, informe o Código da sua Loja.",
        };
      }

      if (!foundUser.active) {
        return {
          success: false,
          message: "Acesso de Desenvolvedor inativo.",
        };
      }

      const actualDevPass = foundUser.senha || foundUser.password || "dev123";
      if (actualDevPass !== cleanPass) {
        return {
          success: false,
          message: "Senha do Desenvolvedor incorreta.",
        };
      }

      const devSession: Session = {
        id: foundUser.id,
        name: foundUser.nome || foundUser.name,
        nome: foundUser.nome || foundUser.name,
        usuario: foundUser.usuario || foundUser.username || "dev",
        username: foundUser.usuario || foundUser.username || "dev",
        email: foundUser.email,
        role: "gestor",
        cargo: "gestor",
        nivel: "dev",
        loja_id: null,
        loja: null,
        user: foundUser,
      };

      setSession(devSession);
      setActiveLojaOverride(null);

      return {
        success: true,
        role: "gestor",
        name: devSession.name,
        nivel: "dev",
        loja_id: null,
        redirectTo: "/dev/lojas",
      };
    },
    [allLojas, allUsers],
  );

  const login = useCallback(
    (usuarioOuEmail: string, role: Role, codigo_loja?: string) => {
      const cleanId = usuarioOuEmail.trim().toLowerCase();
      if (cleanId === "dev" || cleanId === "dev@keepserv.app") {
        loginWithCredentials(cleanId, "dev123", "");
        return;
      }

      let cod = codigo_loja;
      if (!cod) {
        const demoEntry = Object.values(DEMO_ACCOUNTS).find(
          (d) => d.usuario.toLowerCase() === cleanId || d.email.toLowerCase() === cleanId,
        );
        if (demoEntry) cod = demoEntry.codigo_loja;
      }

      const user = allUsers.find(
        (u) =>
          (u.usuario && u.usuario.toLowerCase() === cleanId) ||
          (u.username && u.username.toLowerCase() === cleanId) ||
          u.email.toLowerCase() === cleanId,
      );
      const pass = user ? user.senha || user.password : "keepserv";
      loginWithCredentials(cleanId, pass, cod);
    },
    [allUsers, loginWithCredentials],
  );

  const logout = useCallback(() => {
    setSession(null);
    setActiveLojaOverride(null);
  }, []);

  // --- GESTÃO DE USUÁRIOS (RBAC) ---
  const addUser = useCallback(
    (input: NewUserInput): UserAccount => {
      const defaultColorByRole: Record<Role, string> = {
        gestor: "bg-indigo-600",
        garcom: "bg-emerald-600",
        cozinha: "bg-amber-600",
        caixa: "bg-blue-600",
      };

      // REGRA: Desenvolvedor NÃO cadastra colaboradores, apenas gerencia lojas cadastradas
      if (session?.nivel === "dev") {
        throw new Error(
          "O Desenvolvedor gerencia apenas lojas cadastradas no Dev Center e não cadastra colaboradores.",
        );
      }

      // REGRA DE SEGURANÇA MULTI-TENANT:
      // O Gestor logado força automaticamente o mesmo loja_id e nivel = 'colaborador'
      let targetLojaId: string | null = session?.loja_id || null;
      let targetNivel: NivelAcesso = "colaborador";

      if (session?.nivel === "dono_loja" || session?.nivel === "gestor") {
        targetLojaId = session.loja_id!;
        targetNivel = "colaborador"; // Forçado estritamente
      }

      const rawUsuario = (
        input.usuario ||
        input.username ||
        input.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, ".")
      )
        .trim()
        .toLowerCase();
      const cleanUsuario = rawUsuario || `user.${Date.now()}`;
      const cleanEmail =
        input.email?.trim().toLowerCase() ||
        `${cleanUsuario}@${targetLojaId || "loja"}.keepserv.app`;

      const newUser: UserAccount = {
        id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        loja_id: targetLojaId,
        usuario: cleanUsuario,
        username: cleanUsuario,
        nome: input.name.trim(),
        name: input.name.trim(),
        email: cleanEmail,
        phone: input.phone.trim(),
        senha: input.password?.trim() || "keepserv",
        password: input.password?.trim() || "keepserv",
        nivel: targetNivel,
        cargo: input.role,
        role: input.role,
        active: true,
        createdAt: Date.now(),
        lastPasswordChangeAt: Date.now(),
        avatarColor: input.avatarColor || defaultColorByRole[input.role] || "bg-primary",
      };

      setAllUsers((prev) => [newUser, ...prev]);
      return newUser;
    },
    [session],
  );

  const updateUser = useCallback(
    (id: string, data: Partial<Omit<UserAccount, "id" | "createdAt">>) => {
      setAllUsers((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u;
          const updated = { ...u, ...data };
          if (data.email !== undefined) updated.email = data.email.trim().toLowerCase();
          if (data.usuario) {
            const cleanU = data.usuario.trim().toLowerCase();
            updated.usuario = cleanU;
            updated.username = cleanU;
          }
          if (data.name) {
            updated.name = data.name.trim();
            updated.nome = data.name.trim();
          }
          if (data.nome) {
            updated.name = data.nome.trim();
            updated.nome = data.nome.trim();
          }
          if (data.senha) {
            updated.senha = data.senha;
            updated.password = data.senha;
          }
          if (data.phone !== undefined) updated.phone = data.phone.trim();
          if (data.active !== undefined) updated.active = data.active;
          return updated;
        }),
      );

      setSession((curr) => {
        if (!curr || curr.id !== id) return curr;
        return {
          ...curr,
          name: data.name?.trim() || data.nome?.trim() || curr.name,
          nome: data.name?.trim() || data.nome?.trim() || curr.nome,
          email: data.email?.trim().toLowerCase() || curr.email,
          role: data.role || data.cargo || curr.role,
          cargo: data.cargo || data.role || curr.cargo,
        };
      });
    },
    [],
  );

  const changeUserPassword = useCallback((id: string, newPassword: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        return {
          ...u,
          senha: newPassword.trim(),
          password: newPassword.trim(),
          lastPasswordChangeAt: Date.now(),
        };
      }),
    );
  }, []);

  const deleteUser = useCallback(
    (id: string) => {
      const target = allUsers.find((u) => u.id === id);
      if (!target) return { success: false, message: "Usuário não encontrado." };

      if (session && session.id === target.id) {
        return { success: false, message: "Você não pode remover seu próprio usuário logado." };
      }

      // Impede deletar o único gestor da loja
      if (target.nivel === "dono_loja" || target.nivel === "gestor") {
        const otherOwners = allUsers.filter(
          (u) =>
            u.loja_id === target.loja_id &&
            (u.nivel === "dono_loja" || u.nivel === "gestor") &&
            u.active,
        );
        if (otherOwners.length <= 1) {
          return {
            success: false,
            message: "É obrigatório manter ao menos um Gestor da Loja cadastrado.",
          };
        }
      }

      setAllUsers((prev) => prev.filter((u) => u.id !== id));
      return { success: true };
    },
    [allUsers, session],
  );

  const toggleUserStatus = useCallback(
    (id: string) => {
      setAllUsers((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u;
          if (session && session.id === u.id && u.active) {
            return u;
          }
          return { ...u, active: !u.active };
        }),
      );
    },
    [session],
  );

  // --- PEDIDOS (Scoping por loja_id) ---
  const patchOrder = useCallback((orderId: string, fn: (o: Order) => Order) => {
    setAllOrders((prev) => prev.map((o) => (o.id === orderId ? fn(o) : o)));
  }, []);

  const moveTo = useCallback(
    (orderId: string, status: OrderStatus) => {
      patchOrder(orderId, (o) => ({ ...o, status, statusChangedAt: Date.now() }));
    },
    [patchOrder],
  );

  const advance = useCallback(
    (orderId: string) => {
      patchOrder(orderId, (o) => {
        const idx = STATUS_ORDER.indexOf(o.status);
        if (idx >= STATUS_ORDER.length - 1) return o;
        return { ...o, status: STATUS_ORDER[idx + 1]!, statusChangedAt: Date.now() };
      });
    },
    [patchOrder],
  );

  const sendMessage = useCallback(
    (orderId: string, text: string) => {
      if (!session) return;
      patchOrder(orderId, (o) => ({
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
    [patchOrder, session],
  );

  const togglePriority = useCallback(
    (orderId: string) => patchOrder(orderId, (o) => ({ ...o, priority: !o.priority })),
    [patchOrder],
  );

  const cancelItem = useCallback(
    (orderId: string, itemId: string) =>
      patchOrder(orderId, (o) => ({
        ...o,
        items: o.items.map((i) => (i.id === itemId ? { ...i, canceled: !i.canceled } : i)),
      })),
    [patchOrder],
  );

  const createOrder = useCallback(
    (input: NewOrderInput) => {
      const t = Date.now();
      const targetLojaId = input.loja_id || currentLojaId || "loja-1";

      const order: Order = {
        id: uid("ord"),
        loja_id: targetLojaId, // Garante isolamento multi-tenant
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

      setAllOrders((prev) => [order, ...prev]);

      // Atualiza estoque da loja
      setAllStockItems((prevStock) => {
        let updatedStock = [...prevStock];
        for (const orderedItem of input.items) {
          const prod = allProducts.find(
            (p) =>
              (!p.loja_id || p.loja_id === targetLojaId) &&
              p.name.trim().toLowerCase() === orderedItem.name.trim().toLowerCase(),
          );
          if (!prod) continue;

          const consumption = prod.stockConsumption || (prod.trackStock ? "direct" : "none");

          if (consumption === "direct") {
            const stockId = prod.linkedStockItemId;
            const directQty =
              (prod.directStockQty && prod.directStockQty > 0 ? prod.directStockQty : 1) *
              orderedItem.qty;

            updatedStock = updatedStock.map((s) => {
              if (s.id === stockId && (!s.loja_id || s.loja_id === targetLojaId)) {
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
          } else if (consumption === "recipe" && prod.recipeIngredients?.length) {
            for (const ing of prod.recipeIngredients) {
              const neededQty = Number((ing.quantity * orderedItem.qty).toFixed(3));
              updatedStock = updatedStock.map((s) => {
                if (s.id === ing.stockItemId && (!s.loja_id || s.loja_id === targetLojaId)) {
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

      return order;
    },
    [session?.name, allProducts, currentLojaId],
  );

  const registerPayment = useCallback(
    (orderId: string, method: PaymentMethod, splitCount: number) => {
      const t = Date.now();
      let paidOrderInfo: { code: string; table: number; amount: number; loja_id: string } | null =
        null;

      patchOrder(orderId, (o) => {
        const amount = orderTotal(o);
        paidOrderInfo = { code: o.code, table: o.table, amount, loja_id: o.loja_id };
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
        const info = paidOrderInfo as {
          code: string;
          table: number;
          amount: number;
          loja_id: string;
        };
        setAllCashFlowEntries((prev) => [
          {
            id: uid("cf"),
            loja_id: info.loja_id || currentLojaId || "loja-1",
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
    [patchOrder, session?.name, session?.role, currentLojaId],
  );

  const addCashFlowEntry = useCallback(
    (input: NewCashFlowInput) => {
      const t = input.timestamp || Date.now();
      const targetLojaId = input.loja_id || currentLojaId || "loja-1";

      const entry: CashFlowEntry = {
        id: uid("cf"),
        loja_id: targetLojaId,
        type: input.type,
        category: input.category,
        description: input.description,
        amount: Math.max(0.01, input.amount),
        method: input.method ?? (input.type === "entrada" ? "pix" : "dinheiro"),
        timestamp: t,
        author: input.author || session?.name || "Gestor",
        notes: input.notes,
      };

      setAllCashFlowEntries((prev) => [entry, ...prev].sort((a, b) => b.timestamp - a.timestamp));
      return entry;
    },
    [session?.name, currentLojaId],
  );

  const deleteCashFlowEntry = useCallback((id: string) => {
    setAllCashFlowEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const resetCashFlowToDefault = useCallback(() => {
    const t = Date.now();
    const fresh = buildSeedCashFlow(t, allOrders);
    setAllCashFlowEntries(fresh);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("keepserv_cashflow_v5", JSON.stringify(fresh));
      } catch (e) {
        console.error("Erro ao resetar fluxo de caixa", e);
      }
    }
  }, [allOrders]);

  const requestCleanup = useCallback(
    (orderId: string) => {
      const t = Date.now();
      patchOrder(orderId, (o) => ({
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
    [patchOrder, session?.role, session?.name],
  );

  const completeCleanup = useCallback(
    (orderId: string) => {
      const t = Date.now();
      patchOrder(orderId, (o) => ({
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
    [patchOrder, session?.role, session?.name],
  );

  const printBill = useCallback(
    (orderId: string) => {
      const t = Date.now();
      patchOrder(orderId, (o) => ({
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
    [patchOrder, session?.role, session?.name],
  );

  const sendCustomerMessage = useCallback(
    (orderId: string, text: string) => {
      const t = Date.now();
      patchOrder(orderId, (o) => {
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
    [patchOrder],
  );

  const setCustomerInfo = useCallback(
    (orderId: string, data: { name?: string; phone?: string; register?: boolean }) => {
      const t = Date.now();
      patchOrder(orderId, (o) => {
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
    [patchOrder],
  );

  // --- MÉTODOS DE PRODUTOS DO CARDÁPIO ---
  const addProduct = useCallback(
    (input: NewProductInput): MenuItem => {
      const targetLojaId = input.loja_id || currentLojaId || "loja-1";
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
        loja_id: targetLojaId, // Isolamento multi-tenant
        name: input.name.trim(),
        price: Math.max(0, Number(input.price) || 0),
        category: input.category,
        description: input.description?.trim() || undefined,
        image: input.image?.trim() || undefined,
        highlight: input.highlight,
        serves: input.serves?.trim() || undefined,
        active: input.active !== false,
        stockConsumption: input.stockConsumption || "none",
        linkedStockItemId: input.linkedStockItemId,
        directStockQty:
          input.directStockQty && input.directStockQty > 0 ? Number(input.directStockQty) : 1,
        recipeIngredients: input.recipeIngredients,
        stock:
          input.stock !== undefined ? Math.max(0, Math.round(Number(input.stock) || 0)) : undefined,
        minStock:
          input.minStock !== undefined
            ? Math.max(0, Math.round(Number(input.minStock) || 5))
            : undefined,
        trackStock: input.stockConsumption !== "none",
        unit: input.unit?.trim() || "un",
        updatedAt: Date.now(),
      };

      setAllProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    },
    [currentLojaId],
  );

  const updateProduct = useCallback((id: string, data: Partial<Omit<MenuItem, "id">>) => {
    setAllProducts((prev) =>
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
    setAllProducts((prev) => prev.filter((p) => p.id !== id));
    return { success: true };
  }, []);

  const adjustStock = useCallback(
    (id: string, deltaOrExact: number, mode: "delta" | "set" = "delta") => {
      setAllProducts((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const newStock =
            mode === "delta"
              ? Math.max(0, (item.stock ?? 0) + deltaOrExact)
              : Math.max(0, deltaOrExact);
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
    setAllProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active, updatedAt: Date.now() } : item,
      ),
    );
  }, []);

  const resetProductsToDefault = useCallback(() => {
    setAllProducts(MENU.map((m) => ({ ...m, loja_id: currentLojaId || "loja-1" })));
  }, [currentLojaId]);

  // --- MÉTODOS DE ESTOQUE ---
  const addStockItem = useCallback(
    (input: NewStockItemInput): StockItem => {
      const targetLojaId = input.loja_id || currentLojaId || "loja-1";
      const slug = input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const id = `stk-${slug || "item"}-${Date.now().toString(36)}`;

      const newItem: StockItem = {
        id,
        loja_id: targetLojaId, // Isolamento multi-tenant
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
            reason: "Cadastro inicial do item no estoque",
            timestamp: Date.now(),
            author: session?.name ?? "Gestor",
          },
        ],
        updatedAt: Date.now(),
      };

      setAllStockItems((prev) => [newItem, ...prev]);
      return newItem;
    },
    [currentLojaId, session?.name],
  );

  const updateStockItem = useCallback((id: string, data: Partial<Omit<StockItem, "id">>) => {
    setAllStockItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          ...data,
          currentStock:
            data.currentStock !== undefined
              ? Math.max(0, Number(data.currentStock) || 0)
              : item.currentStock,
          minStock:
            data.minStock !== undefined ? Math.max(0, Number(data.minStock) || 0) : item.minStock,
          costPrice:
            data.costPrice !== undefined
              ? Math.max(0, Number(data.costPrice) || 0)
              : item.costPrice,
          updatedAt: Date.now(),
        };
      }),
    );
  }, []);

  const deleteStockItem = useCallback((id: string): { success: boolean; message?: string } => {
    setAllStockItems((prev) => prev.filter((s) => s.id !== id));
    return { success: true };
  }, []);

  const adjustStockItem = useCallback(
    (
      id: string,
      deltaQty: number,
      reason: string,
      type: "entrada" | "saida" | "ajuste" = "ajuste",
    ) => {
      setAllStockItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const prevQty = item.currentStock;
          const nextQty =
            type === "ajuste"
              ? Math.max(0, deltaQty)
              : type === "entrada"
                ? prevQty + deltaQty
                : Math.max(0, prevQty - deltaQty);

          const movement: StockMovement = {
            id: uid("mov"),
            type,
            quantity: type === "ajuste" ? Math.abs(nextQty - prevQty) : deltaQty,
            previousStock: prevQty,
            newStock: nextQty,
            reason: reason.trim() || "Ajuste manual de estoque",
            timestamp: Date.now(),
            author: session?.name ?? "Gestor",
          };

          return {
            ...item,
            currentStock: nextQty,
            movements: [movement, ...(item.movements || [])],
            updatedAt: Date.now(),
          };
        }),
      );
    },
    [session?.name],
  );

  const resetStockToDefault = useCallback(() => {
    setAllStockItems(
      INITIAL_STOCK_ITEMS.map((s) => ({ ...s, loja_id: currentLojaId || "loja-1" })),
    );
  }, [currentLojaId]);

  const value = useMemo<KeepServContext>(
    () => ({
      session,
      lojas,
      allLojas,
      activeLoja,
      createLoja,
      updateLoja,
      toggleLojaStatus,
      deleteLoja,
      switchActiveLoja,

      users,
      allUsers,
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
      resetCashFlowToDefault,

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
      lojas,
      allLojas,
      activeLoja,
      createLoja,
      updateLoja,
      toggleLojaStatus,
      deleteLoja,
      switchActiveLoja,

      users,
      allUsers,
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
      resetCashFlowToDefault,

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
