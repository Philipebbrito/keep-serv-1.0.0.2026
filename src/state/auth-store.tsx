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
  Loja,
  NewGestorInput,
  NewLojaInput,
  NewUserInput,
  NivelAcesso,
  Role,
  Session,
  UserAccount,
} from "../domain/team/types";
import { INITIAL_LOJAS, INITIAL_USERS } from "../data/mock/team.mock";

const STORAGE_SESSION = "keepserv_session_v4";
const STORAGE_LOJAS = "keepserv_lojas_v4";
const STORAGE_USERS = "keepserv_users_v4";
const STORAGE_ACTIVE_LOJA_ID = "keepserv_active_loja_id_v4";

export interface AuthContextType {
  session: Session | null;
  lojas: Loja[];
  allLojas: Loja[];
  activeLoja: Loja | null;
  users: UserAccount[];
  allUsers: UserAccount[];

  // Operações de Lojas
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

  // Operações de Usuários & Sessão
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
}

const AuthContext = createContext<AuthContextType | null>(null);

let userCounter = 0;
const uid = (p: string) => `${p}-auth-${++userCounter}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [lojas, setLojas] = useState<Loja[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LOJAS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_LOJAS;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_USERS;
  });

  const [session, setSession] = useState<Session | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSION);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    const initialLoja = INITIAL_LOJAS[0];
    const initialUser = INITIAL_USERS.find((u) => u.nivel === "gestor") || INITIAL_USERS[0];
    return {
      id: "demo-session",
      name: initialUser.name,
      nome: initialUser.nome,
      usuario: initialUser.usuario,
      username: initialUser.username,
      email: initialUser.email || "gestor@keepserv.app",
      role: initialUser.role,
      cargo: initialUser.cargo || initialUser.role,
      nivel: initialUser.nivel,
      loja_id: initialLoja.id,
      loja: initialLoja,
      user: initialUser,
    };
  });

  const [activeLojaId, setActiveLojaId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_LOJA_ID);
      if (saved) return saved === "null" ? null : saved;
    } catch {
      // ignore
    }
    return session?.loja_id ?? "loja-1";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LOJAS, JSON.stringify(lojas));
    } catch {
      // Ignora erro de localStorage
    }
  }, [lojas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    } catch {
      // Ignora erro de localStorage
    }
  }, [users]);

  useEffect(() => {
    try {
      if (session) {
        localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_SESSION);
      }
    } catch {
      // Ignora erro de localStorage
    }
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_LOJA_ID, activeLojaId === null ? "null" : activeLojaId);
    } catch {
      // Ignora erro de localStorage
    }
  }, [activeLojaId]);

  const activeLoja = useMemo(() => {
    if (!activeLojaId) return null;
    return lojas.find((l) => l.id === activeLojaId) || null;
  }, [lojas, activeLojaId]);

  const visibleLojas = useMemo(() => {
    if (session?.nivel === "dev") {
      return lojas;
    }
    if (session?.loja_id) {
      return lojas.filter((l) => l.id === session.loja_id);
    }
    return [];
  }, [lojas, session]);

  const visibleUsers = useMemo(() => {
    if (session?.nivel === "dev") {
      return users;
    }
    if (session?.loja_id) {
      return users.filter((u) => u.loja_id === session.loja_id);
    }
    return [];
  }, [users, session]);

  const switchActiveLoja = useCallback(
    (lojaId: string | null) => {
      if (session?.nivel !== "dev" && lojaId !== session?.loja_id) {
        return;
      }
      setActiveLojaId(lojaId);
    },
    [session],
  );

  const createLoja = useCallback(
    (lojaInput: NewLojaInput, gestorInput: NewGestorInput) => {
      const codeClean = lojaInput.codigo_loja.trim().toUpperCase();
      const userClean = gestorInput.usuario.trim().toLowerCase();

      if (lojas.some((l) => l.codigo_loja.toUpperCase() === codeClean)) {
        return { success: false, message: `O código de loja "${codeClean}" já está em uso.` };
      }

      if (
        users.some(
          (u) =>
            (u.usuario && u.usuario.toLowerCase() === userClean) ||
            (u.username && u.username.toLowerCase() === userClean),
        )
      ) {
        return { success: false, message: `O usuário "@${userClean}" já existe.` };
      }

      const lojaId = uid("loja");
      const gestorId = uid("usr");

      const newLoja: Loja = {
        id: lojaId,
        nome_fantasia: lojaInput.nome_fantasia.trim(),
        codigo_loja: codeClean,
        status: lojaInput.status || "ativo",
        created_at: Date.now(),
        gestor_id: gestorId,
        dono_id: gestorId,
        cidade: lojaInput.cidade?.trim() || "São Paulo, SP",
        telefone: lojaInput.telefone?.trim() || "(11) 99999-0000",
      };

      const newGestor: UserAccount = {
        id: gestorId,
        loja_id: lojaId,
        usuario: userClean,
        username: userClean,
        nome: gestorInput.nome.trim(),
        name: gestorInput.nome.trim(),
        email: gestorInput.email.trim().toLowerCase(),
        senha: gestorInput.senha,
        password: gestorInput.senha,
        nivel: "gestor",
        cargo: "gestor",
        role: "gestor",
        phone: gestorInput.phone?.trim() || "(11) 99999-0000",
        active: true,
        createdAt: Date.now(),
      };

      setLojas((prev) => [newLoja, ...prev]);
      setUsers((prev) => [...prev, newGestor]);

      return {
        success: true,
        message: "Estabelecimento e gestor cadastrados com sucesso!",
        loja: newLoja,
        dono: newGestor,
        gestor: newGestor,
      };
    },
    [lojas, users],
  );

  const updateLoja = useCallback((id: string, data: Partial<Loja>) => {
    setLojas((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
  }, []);

  const toggleLojaStatus = useCallback((id: string) => {
    setLojas((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: l.status === "ativo" ? "inativo" : "ativo" } : l,
      ),
    );
  }, []);

  const deleteLoja = useCallback(
    (id: string) => {
      if (session?.loja_id === id) {
        return {
          success: false,
          message: "Não é possível excluir a loja em que você está conectado no momento.",
        };
      }
      setLojas((prev) => prev.filter((l) => l.id !== id));
      setUsers((prev) => prev.filter((u) => u.loja_id !== id));
      return { success: true, message: "Loja e colaboradores excluídos com sucesso." };
    },
    [session],
  );

  const loginWithCredentials = useCallback(
    (usuarioOuEmail: string, pass: string, codigoLoja?: string) => {
      const cleanIdent = usuarioOuEmail.trim().toLowerCase();
      const cleanCode = codigoLoja?.trim().toUpperCase();

      const user = users.find((u) => {
        const matchLogin =
          (u.usuario && u.usuario.toLowerCase() === cleanIdent) ||
          (u.username && u.username.toLowerCase() === cleanIdent) ||
          (u.email && u.email.toLowerCase() === cleanIdent);

        if (!matchLogin) return false;
        if (u.nivel === "dev") return true;

        if (cleanCode) {
          const loja = lojas.find((l) => l.codigo_loja.toUpperCase() === cleanCode);
          return loja && u.loja_id === loja.id;
        }

        return true;
      });

      if (!user) {
        return {
          success: false,
          message: "Credenciais inválidas. Verifique o usuário ou e-mail e o código da loja.",
        };
      }

      if (!user.active) {
        return {
          success: false,
          message: "Esta conta está desativada. Entre em contato com o gestor.",
        };
      }

      const actualPass = user.senha || user.password;
      if (actualPass !== pass) {
        return { success: false, message: "Senha incorreta." };
      }

      let lojaDoUsuario: Loja | null = null;
      if (user.loja_id) {
        lojaDoUsuario = lojas.find((l) => l.id === user.loja_id) || null;
        if (lojaDoUsuario && lojaDoUsuario.status === "inativo") {
          return {
            success: false,
            message: "O estabelecimento deste usuário está inativo no sistema.",
          };
        }
      }

      const newSession: Session = {
        id: uid("sess"),
        name: user.nome || user.name,
        nome: user.nome || user.name,
        usuario: user.usuario || user.username,
        username: user.usuario || user.username,
        email: user.email,
        role: user.cargo || user.role,
        cargo: user.cargo || user.role,
        nivel: user.nivel,
        loja_id: user.loja_id,
        loja: lojaDoUsuario,
        user,
      };

      setSession(newSession);
      setActiveLojaId(user.loja_id || null);

      const dest =
        user.nivel === "dev"
          ? "/dev/lojas"
          : user.cargo === "cozinha"
            ? "/cozinha"
            : user.cargo === "caixa"
              ? "/caixa"
              : user.cargo === "gestor" || user.nivel === "gestor" || user.nivel === "dono_loja"
                ? "/dashboard"
                : "/pedidos";

      return {
        success: true,
        role: user.cargo || user.role,
        name: user.nome || user.name,
        nivel: user.nivel,
        loja_id: user.loja_id,
        redirectTo: dest,
      };
    },
    [users, lojas],
  );

  const login = useCallback(
    (usuarioOuEmail: string, role: Role, codigo_loja?: string) => {
      const match = users.find(
        (u) =>
          u.role === role ||
          u.cargo === role ||
          u.usuario === usuarioOuEmail ||
          u.username === usuarioOuEmail,
      );

      const targetUser = match || {
        id: "quick-login",
        loja_id: "loja-1",
        usuario: usuarioOuEmail.toLowerCase(),
        username: usuarioOuEmail.toLowerCase(),
        nome: usuarioOuEmail,
        name: usuarioOuEmail,
        email: `${usuarioOuEmail.toLowerCase()}@keepserv.app`,
        senha: "123",
        password: "123",
        nivel: role === "gestor" ? "gestor" : "colaborador",
        cargo: role,
        role,
        phone: "(11) 99999-0000",
        active: true,
        createdAt: Date.now(),
      };

      const targetLoja =
        lojas.find((l) =>
          codigo_loja
            ? l.codigo_loja.toUpperCase() === codigo_loja.toUpperCase()
            : l.id === targetUser.loja_id,
        ) || lojas[0];

      setSession({
        id: uid("sess"),
        name: targetUser.nome || targetUser.name,
        nome: targetUser.nome || targetUser.name,
        usuario: targetUser.usuario || targetUser.username,
        username: targetUser.usuario || targetUser.username,
        email: targetUser.email,
        role,
        cargo: role,
        nivel: targetUser.nivel,
        loja_id: targetLoja.id,
        loja: targetLoja,
        user: targetUser,
      });
      setActiveLojaId(targetLoja.id);
    },
    [users, lojas],
  );

  const logout = useCallback(() => {
    setSession(null);
    try {
      localStorage.removeItem(STORAGE_SESSION);
    } catch {
      // Ignora erro de localStorage
    }
  }, []);

  const addUser = useCallback(
    (input: NewUserInput) => {
      const loginClean = (input.usuario || input.username || input.name)
        .toLowerCase()
        .replace(/\s+/g, ".");
      const newUser: UserAccount = {
        id: uid("usr"),
        loja_id: input.loja_id || session?.loja_id || "loja-1",
        usuario: loginClean,
        username: loginClean,
        nome: input.name.trim(),
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        senha: input.password || "123",
        password: input.password || "123",
        nivel: input.nivel || (input.role === "gestor" ? "gestor" : "colaborador"),
        cargo: input.role,
        role: input.role,
        phone: input.phone.trim(),
        active: true,
        createdAt: Date.now(),
        avatarColor: input.avatarColor,
      };

      setUsers((prev) => [...prev, newUser]);
      return newUser;
    },
    [session],
  );

  const updateUser = useCallback(
    (id: string, data: Partial<Omit<UserAccount, "id" | "createdAt">>) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u;
          const updated: UserAccount = {
            ...u,
            ...data,
            nome: data.nome ?? data.name ?? u.nome,
            name: data.name ?? data.nome ?? u.name,
            usuario: data.usuario ?? data.username ?? u.usuario,
            username: data.username ?? data.usuario ?? u.username,
          };
          return updated;
        }),
      );
    },
    [],
  );

  const changeUserPassword = useCallback((id: string, newPassword: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              senha: newPassword,
              password: newPassword,
              lastPasswordChangeAt: Date.now(),
            }
          : u,
      ),
    );
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    return { success: true, message: "Colaborador excluído com sucesso." };
  }, []);

  const toggleUserStatus = useCallback((id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
  }, []);

  const value = useMemo(
    () => ({
      session,
      lojas: visibleLojas,
      allLojas: lojas,
      activeLoja,
      users: visibleUsers,
      allUsers: users,
      createLoja,
      updateLoja,
      toggleLojaStatus,
      deleteLoja,
      switchActiveLoja,
      login,
      loginWithCredentials,
      logout,
      addUser,
      updateUser,
      changeUserPassword,
      deleteUser,
      toggleUserStatus,
    }),
    [
      session,
      visibleLojas,
      lojas,
      activeLoja,
      visibleUsers,
      users,
      createLoja,
      updateLoja,
      toggleLojaStatus,
      deleteLoja,
      switchActiveLoja,
      login,
      loginWithCredentials,
      logout,
      addUser,
      updateUser,
      changeUserPassword,
      deleteUser,
      toggleUserStatus,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return ctx;
}
