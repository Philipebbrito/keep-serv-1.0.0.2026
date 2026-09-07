import {
  AlertCircle,
  AtSign,
  Check,
  CheckCircle2,
  ChefHat,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKeepServ } from "@/lib/keepserv/store";
import { ROLE_DESCRIPTION, ROLE_LABEL, type Role, type UserAccount } from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<Role, typeof Users> = {
  garcom: UserCheck,
  cozinha: UtensilsCrossed,
  caixa: Wallet,
  gestor: Shield,
};

const ROLE_BADGE_STYLES: Record<Role, string> = {
  gestor: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  garcom: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  cozinha: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  caixa: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
};

const ROLE_AVATAR_BG: Record<Role, string> = {
  gestor: "bg-indigo-600 text-white",
  garcom: "bg-emerald-600 text-white",
  cozinha: "bg-amber-600 text-white",
  caixa: "bg-blue-600 text-white",
};

function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function generateRandomPassword(): string {
  const prefixes = ["Keep", "Serv", "Chef", "Mesa", "Turno", "Bar"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}@${num}`;
}

export function TeamManagement() {
  const {
    users,
    session,
    addUser,
    updateUser,
    changeUserPassword,
    deleteUser,
    toggleUserStatus,
    login,
  } = useKeepServ();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "todos">("todos");

  // Estados dos Modais
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Usuário selecionado para ações de senha/edição/deleção
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Form states para Adicionar Usuário
  const [newName, setNewName] = useState("");
  const [newUsuario, setNewUsuario] = useState("");
  const [userTouchedUsuario, setUserTouchedUsuario] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<Role>("garcom");
  const [newPassword, setNewPassword] = useState("keepserv");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states para Alterar Senha
  const [changePasswordVal, setChangePasswordVal] = useState("");
  const [confirmPasswordVal, setConfirmPasswordVal] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Form states para Editar Dados
  const [editName, setEditName] = useState("");
  const [editUsuario, setEditUsuario] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<Role>("garcom");

  // Estatísticas de equipe
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.active).length;
    const garcons = users.filter((u) => u.role === "garcom").length;
    const cozinha = users.filter((u) => u.role === "cozinha").length;
    const caixas = users.filter((u) => u.role === "caixa").length;
    const gestores = users.filter((u) => u.role === "gestor").length;
    return { total, active, garcons, cozinha, caixas, gestores };
  }, [users]);

  // Lista filtrada
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchRole = roleFilter === "todos" || u.role === roleFilter;
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.usuario && u.usuario.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        ROLE_LABEL[u.role].toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, search, roleFilter]);

  // Abrir Modal de Adicionar Usuário
  const handleOpenAdd = () => {
    setNewName("");
    setNewUsuario("");
    setUserTouchedUsuario(false);
    setNewEmail("");
    setNewPhone("");
    setNewRole("garcom");
    setNewPassword(generateRandomPassword());
    setShowNewPassword(true);
    setIsAddOpen(true);
  };

  // Submeter Novo Usuário
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Informe o nome do colaborador.");
      return;
    }
    const cleanUser = (
      newUsuario.trim() ||
      newName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, ".")
    ).toLowerCase();

    if (!cleanUser) {
      toast.error("Informe um nome de usuário para login.");
      return;
    }
    if (!newPhone.trim()) {
      toast.error("Informe o telefone ou WhatsApp de contato.");
      return;
    }
    if (!newPassword.trim()) {
      toast.error("Defina uma senha inicial para o usuário.");
      return;
    }

    // Verificar nome de usuário duplicado
    const exists = users.some(
      (u) =>
        (u.usuario && u.usuario.toLowerCase() === cleanUser) ||
        (u.username && u.username.toLowerCase() === cleanUser),
    );
    if (exists) {
      toast.error(`O nome de usuário "${cleanUser}" já está cadastrado nesta equipe.`);
      return;
    }

    const created = addUser({
      name: newName,
      usuario: cleanUser,
      username: cleanUser,
      email: newEmail.trim() || undefined,
      phone: newPhone,
      role: newRole,
      password: newPassword,
    });

    toast.success(
      `Colaborador(a) ${created.name} cadastrado(a) com sucesso como ${ROLE_LABEL[created.role]} (usuário: @${created.usuario || created.username})!`,
    );
    setIsAddOpen(false);
  };

  // Abrir Modal de Alteração de Senha
  const handleOpenChangePassword = (u: UserAccount) => {
    setSelectedUser(u);
    setChangePasswordVal("");
    setConfirmPasswordVal("");
    setShowChangePassword(false);
    setIsPasswordOpen(true);
  };

  // Salvar Alteração de Senha
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!changePasswordVal.trim() || changePasswordVal.length < 4) {
      toast.error("A nova senha deve ter no mínimo 4 caracteres.");
      return;
    }
    if (changePasswordVal !== confirmPasswordVal) {
      toast.error("As senhas digitadas não coincidem.");
      return;
    }

    changeUserPassword(selectedUser.id, changePasswordVal.trim());
    toast.success(
      `Senha de ${selectedUser.name} alterada com sucesso! O novo acesso já está ativo.`,
    );
    setIsPasswordOpen(false);
  };

  // Abrir Modal de Edição de Dados
  const handleOpenEdit = (u: UserAccount) => {
    setSelectedUser(u);
    setEditName(u.name);
    setEditUsuario(u.usuario || u.username || "");
    setEditEmail(u.email || "");
    setEditPhone(u.phone);
    setEditRole(u.role);
    setIsEditOpen(true);
  };

  // Salvar Edição de Dados
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!editName.trim()) {
      toast.error("Informe o nome.");
      return;
    }
    const cleanUser = editUsuario.trim().toLowerCase();
    if (!cleanUser) {
      toast.error("Informe o nome de usuário.");
      return;
    }
    if (!editPhone.trim()) {
      toast.error("Informe o telefone.");
      return;
    }

    // Checar duplicidade caso o usuario tenha mudado
    const exists = users.some(
      (u) =>
        u.id !== selectedUser.id &&
        ((u.usuario && u.usuario.toLowerCase() === cleanUser) ||
          (u.username && u.username.toLowerCase() === cleanUser)),
    );
    if (exists) {
      toast.error(`O nome de usuário "${cleanUser}" já pertence a outro colaborador.`);
      return;
    }

    updateUser(selectedUser.id, {
      name: editName,
      usuario: cleanUser,
      username: cleanUser,
      email: editEmail.trim(),
      phone: editPhone,
      role: editRole,
    });

    toast.success(`Cadastro de ${editName} atualizado com sucesso!`);
    setIsEditOpen(false);
  };

  // Excluir Colaborador
  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    const res = deleteUser(selectedUser.id);
    if (!res.success) {
      toast.error(res.message || "Erro ao remover colaborador.");
      return;
    }
    toast.success(`Colaborador ${selectedUser.name} removido da equipe.`);
    setIsDeleteOpen(false);
  };

  // Simular Login / Trocar de Usuário
  const handleSimulateLogin = (u: UserAccount) => {
    if (!u.active) {
      toast.error("Este usuário está inativo e não pode fazer login.");
      return;
    }
    login(u.usuario || u.username || u.email, u.role);
    toast.success(`Sessão alternada para ${u.name} (${ROLE_LABEL[u.role]})!`);
  };

  const isDev = session?.nivel === "dev";

  return (
    <div className="space-y-6">
      {/* Barra de Ações e Boas-Vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </span>
            <h2 className="text-lg font-bold text-foreground">
              Gestão de Equipe & Controle de Acessos
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
            Cadastre garçons, caixas, colaboradores da cozinha e gestores com nome, usuário de
            login, telefone e nível de acesso. Altere senhas a qualquer momento com efeito imediato.
          </p>
        </div>

        {isDev ? (
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs text-purple-700 dark:text-purple-300">
            <p className="font-semibold">Perfil Desenvolvedor (Dev)</p>
            <p className="text-[11px] text-purple-600/80 dark:text-purple-300/80">
              O desenvolvedor gerencia apenas lojas cadastradas e não cadastra colaboradores.
            </p>
          </div>
        ) : (
          <Button
            onClick={handleOpenAdd}
            className="gap-2 shrink-0 bg-primary text-primary-foreground font-semibold rounded-xl h-10 px-4 shadow-xs hover:opacity-95"
          >
            <UserPlus className="size-4" />
            <span>Novo Colaborador</span>
          </Button>
        )}
      </div>

      {/* Cards de Métricas da Equipe */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
            <Users className="size-3.5" />
          </div>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">{stats.total}</p>
          <span className="text-[10px] text-muted-foreground">{stats.active} ativos</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Garçons</span>
            <UserCheck className="size-3.5" />
          </div>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">{stats.garcons}</p>
          <span className="text-[10px] text-muted-foreground">Salão & Atendimento</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cozinha</span>
            <UtensilsCrossed className="size-3.5" />
          </div>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">{stats.cozinha}</p>
          <span className="text-[10px] text-muted-foreground">Praças & Preparo</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Caixa</span>
            <Wallet className="size-3.5" />
          </div>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">{stats.caixas}</p>
          <span className="text-[10px] text-muted-foreground">Pagamentos & Sangrias</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gestores</span>
            <Shield className="size-3.5" />
          </div>
          <p className="mt-1 text-2xl font-bold font-mono text-foreground">{stats.gestores}</p>
          <span className="text-[10px] text-muted-foreground">Acesso Total</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-xs bg-muted/20">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Segurança</span>
            <KeyRound className="size-3.5 text-primary" />
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground">Senhas</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Check className="size-3" /> Gerenciadas
          </span>
        </div>
      </div>

      {/* Barra de Filtros & Pesquisa */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone..."
            className="pl-9 h-10 rounded-xl bg-card text-xs sm:text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filtros por Nível de Acesso */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: "todos", label: "Todos", count: stats.total },
              { id: "garcom", label: "Garçons", count: stats.garcons },
              { id: "cozinha", label: "Cozinha", count: stats.cozinha },
              { id: "caixa", label: "Caixas", count: stats.caixas },
              { id: "gestor", label: "Gestores", count: stats.gestores },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border",
                roleFilter === tab.id
                  ? "bg-card text-foreground border-border shadow-xs"
                  : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                  roleFilter === tab.id
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista / Tabela de Colaboradores */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Users className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Nenhum colaborador encontrado</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Tente mudar o termo da busca ou cadastre um novo membro da equipe clicando em "Novo
              Colaborador".
            </p>
            <Button
              onClick={handleOpenAdd}
              size="sm"
              variant="outline"
              className="mt-4 gap-1.5 rounded-xl text-xs"
            >
              <UserPlus className="size-3.5" />
              Cadastrar Colaborador
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredUsers.map((u) => {
              const RoleIcon = ROLE_ICONS[u.role] || Users;
              const isCurrentUser = session?.email.toLowerCase() === u.email.toLowerCase();

              return (
                <div
                  key={u.id}
                  className={cn(
                    "p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors hover:bg-muted/30",
                    !u.active && "opacity-60 bg-muted/15",
                  )}
                >
                  {/* Informações Principais do Usuário */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Avatar com Iniciais */}
                    <div
                      className={cn(
                        "size-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs",
                        ROLE_AVATAR_BG[u.role] || "bg-primary text-white",
                      )}
                    >
                      {u.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {u.name}
                        </span>

                        {isCurrentUser && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-primary/10 text-primary border-primary/20 font-bold"
                          >
                            Você (Logado)
                          </Badge>
                        )}

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold gap-1 py-0.5",
                            ROLE_BADGE_STYLES[u.role],
                          )}
                        >
                          <RoleIcon className="size-3" />
                          {ROLE_LABEL[u.role]}
                        </Badge>

                        {!u.active ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Inativo
                          </Badge>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Ativo
                          </span>
                        )}
                      </div>

                      {/* Usuário de Login, Contatos e Cargo */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="inline-flex items-center gap-1 font-mono font-medium text-foreground bg-muted/60 border border-border/80 px-2 py-0.5 rounded-md text-[11px]">
                          <AtSign className="size-3 text-primary" />
                          <span>{u.usuario || u.username || u.email.split("@")[0]}</span>
                        </span>

                        {u.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3 text-muted-foreground/70" />
                            <span className="font-mono text-[11px]">{u.email}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1">
                          <Phone className="size-3 text-muted-foreground/70" />
                          <span className="font-mono text-[11px]">{u.phone}</span>
                        </span>

                        <span className="hidden md:inline text-[11px] text-muted-foreground/80">
                          {ROLE_DESCRIPTION[u.role]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco de Credenciais & Ações */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 flex-wrap">
                    {/* Botão de Alteração de Senha (Destaque Principal Solicitado) */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenChangePassword(u)}
                      className="h-8 text-xs gap-1.5 rounded-xl border-border/80 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <KeyRound className="size-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Alterar Senha</span>
                    </Button>

                    {/* Botão de Editar Dados */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(u)}
                      className="h-8 text-xs gap-1.5 rounded-xl text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>

                    {/* Botão de Ativar / Inativar */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isCurrentUser}
                      onClick={() => toggleUserStatus(u.id)}
                      title={u.active ? "Desativar acesso" : "Reativar acesso"}
                      className={cn(
                        "h-8 text-xs rounded-xl",
                        u.active
                          ? "text-muted-foreground hover:text-destructive"
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
                      )}
                    >
                      {u.active ? "Desativar" : "Ativar"}
                    </Button>

                    {/* Simular / Testar Login com este usuário */}
                    {!isCurrentUser && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSimulateLogin(u)}
                        title="Trocar para o perfil deste colaborador para testar o sistema"
                        className="h-8 text-xs gap-1 rounded-xl"
                      >
                        <LogIn className="size-3 text-muted-foreground" />
                        <span className="hidden sm:inline">Acessar</span>
                      </Button>
                    )}

                    {/* Excluir Colaborador */}
                    {!isCurrentUser && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsDeleteOpen(true);
                        }}
                        className="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remover colaborador"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: CADASTRAR NOVO COLABORADOR (Nome, E-mail, Telefone, Nível e Senha)
          ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <UserPlus className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Novo Membro da Equipe
              </span>
            </div>
            <DialogTitle className="text-lg font-bold">Cadastrar Colaborador</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Preencha os dados do colaborador para liberar o acesso ao KeepServ no salão, cozinha,
              caixa ou administração.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAdd} className="space-y-4 pt-2">
            {/* Nome Completo */}
            <div className="space-y-1.5">
              <Label htmlFor="add-name" className="text-xs font-semibold">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!userTouchedUsuario) {
                    const slug = e.target.value
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]/g, ".");
                    setNewUsuario(slug);
                  }
                }}
                placeholder="Ex: Carlos Eduardo Silva"
                className="h-9.5 rounded-xl text-xs sm:text-sm"
                required
              />
            </div>

            {/* Nome de Usuário para Login */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="add-usuario" className="text-xs font-semibold">
                  Nome de Usuário para Login <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Usado no login com a senha
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">
                  @
                </span>
                <Input
                  id="add-usuario"
                  value={newUsuario}
                  onChange={(e) => {
                    setUserTouchedUsuario(true);
                    setNewUsuario(
                      e.target.value
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9._-]/g, ""),
                    );
                  }}
                  placeholder="carlos.silva"
                  className="h-9.5 pl-7 rounded-xl text-xs sm:text-sm font-mono"
                  required
                />
              </div>
            </div>

            {/* E-mail de Contato (Opcional) */}
            <div className="space-y-1.5">
              <Label htmlFor="add-email" className="text-xs font-semibold">
                E-mail{" "}
                <span className="text-muted-foreground text-[10px] font-normal">(Opcional)</span>
              </Label>
              <Input
                id="add-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Ex: carlos@email.com"
                className="h-9.5 rounded-xl text-xs sm:text-sm font-mono"
              />
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-1.5">
              <Label htmlFor="add-phone" className="text-xs font-semibold">
                Telefone / WhatsApp <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-phone"
                value={newPhone}
                onChange={(e) => setNewPhone(formatPhone(e.target.value))}
                placeholder="(11) 98765-4321"
                className="h-9.5 rounded-xl text-xs sm:text-sm font-mono"
                required
              />
            </div>

            {/* Nível de Acesso / Cargo */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Nível de Acesso <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      role: "garcom",
                      label: "Garçom",
                      icon: UserCheck,
                      desc: "Salão, comandas & pedidos",
                    },
                    {
                      role: "cozinha",
                      label: "Cozinha",
                      icon: UtensilsCrossed,
                      desc: "KDS & fila de preparo",
                    },
                    {
                      role: "caixa",
                      label: "Caixa",
                      icon: Wallet,
                      desc: "Pagamentos & fechamento",
                    },
                    {
                      role: "gestor",
                      label: "Gestor",
                      icon: Shield,
                      desc: "Acesso total & relatórios",
                    },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = newRole === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setNewRole(opt.role)}
                      className={cn(
                        "flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs text-foreground"
                          : "border-border bg-card hover:bg-muted/40 text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight text-foreground">
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Senha Inicial */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="add-password" className="text-xs font-semibold">
                  Senha Inicial de Acesso <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setNewPassword(generateRandomPassword())}
                  className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
                >
                  <RefreshCw className="size-3" />
                  Gerar senha forte
                </button>
              </div>

              <div className="relative">
                <Input
                  id="add-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Defina a senha"
                  className="h-9.5 pr-16 rounded-xl text-xs sm:text-sm font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                  title={showNewPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                O gestor poderá alterar esta senha a qualquer momento no futuro.
              </p>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground font-semibold rounded-xl"
              >
                Cadastrar Colaborador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: ALTERAR SENHA DO USUÁRIO (Requisito Explícito do Gestor)
          ========================================================================= */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <KeyRound className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Segurança de Acesso
              </span>
            </div>
            <DialogTitle className="text-lg font-bold">Alterar Senha de Usuário</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Defina uma nova senha para o colaborador{" "}
              <strong className="text-foreground">{selectedUser?.name}</strong> (
              {selectedUser && ROLE_LABEL[selectedUser.role]}).
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleSavePassword} className="space-y-4 pt-2">
              {/* Card Resumo do Usuário */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                <div
                  className={cn(
                    "size-9 rounded-lg flex items-center justify-center font-bold text-xs text-white",
                    ROLE_AVATAR_BG[selectedUser.role] || "bg-primary",
                  )}
                >
                  {selectedUser.name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{selectedUser.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    @
                    {selectedUser.usuario ||
                      selectedUser.username ||
                      selectedUser.email.split("@")[0]}
                    {selectedUser.email && ` · ${selectedUser.email}`}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-[10px]", ROLE_BADGE_STYLES[selectedUser.role])}
                >
                  {ROLE_LABEL[selectedUser.role]}
                </Badge>
              </div>

              {/* Nova Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="change-password" className="text-xs font-semibold">
                    Nova Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = generateRandomPassword();
                      setChangePasswordVal(rand);
                      setConfirmPasswordVal(rand);
                      setShowChangePassword(true);
                    }}
                    className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
                  >
                    <RefreshCw className="size-3" />
                    Gerar senha aleatória
                  </button>
                </div>

                <div className="relative">
                  <Input
                    id="change-password"
                    type={showChangePassword ? "text" : "password"}
                    value={changePasswordVal}
                    onChange={(e) => setChangePasswordVal(e.target.value)}
                    placeholder="Mínimo de 4 caracteres"
                    className="h-9.5 pr-10 rounded-xl text-xs sm:text-sm font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                    title={showChangePassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showChangePassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-semibold">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirm-password"
                  type={showChangePassword ? "text" : "password"}
                  value={confirmPasswordVal}
                  onChange={(e) => setConfirmPasswordVal(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="h-9.5 rounded-xl text-xs sm:text-sm font-mono"
                  required
                />
                {changePasswordVal &&
                  confirmPasswordVal &&
                  changePasswordVal !== confirmPasswordVal && (
                    <p className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3" /> As senhas não coincidem.
                    </p>
                  )}
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-800 dark:text-amber-200">
                A nova senha entrará em vigor imediatamente. Não se esqueça de informar a nova
                combinação ao colaborador.
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordOpen(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl"
                >
                  Salvar Nova Senha
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 3: EDITAR DADOS DO COLABORADOR (Nome, E-mail, Telefone e Cargo)
          ========================================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Editar Dados do Colaborador</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Atualize as informações cadastrais e o nível de acesso no estabelecimento.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold">
                  Nome Completo
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9.5 rounded-xl text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Nome de Usuário para Login */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-usuario" className="text-xs font-semibold">
                  Nome de Usuário para Login <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">
                    @
                  </span>
                  <Input
                    id="edit-usuario"
                    value={editUsuario}
                    onChange={(e) =>
                      setEditUsuario(
                        e.target.value
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9._-]/g, ""),
                      )
                    }
                    className="h-9.5 pl-7 rounded-xl text-xs sm:text-sm font-mono"
                    required
                  />
                </div>
              </div>

              {/* E-mail de Contato */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs font-semibold">
                  E-mail{" "}
                  <span className="text-muted-foreground text-[10px] font-normal">(Opcional)</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="h-9.5 rounded-xl text-xs sm:text-sm font-mono"
                  placeholder="Ex: colaborador@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-xs font-semibold">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                  className="h-9.5 rounded-xl text-xs sm:text-sm font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nível de Acesso</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["garcom", "cozinha", "caixa", "gestor"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditRole(r)}
                      className={cn(
                        "p-2 rounded-xl border text-xs font-semibold transition-all",
                        editRole === r
                          ? "bg-primary/10 border-primary text-foreground shadow-xs"
                          : "bg-card border-border text-muted-foreground hover:bg-muted/40",
                      )}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground font-semibold rounded-xl"
                >
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 4: CONFIRMAR EXCLUSÃO DE COLABORADOR
          ========================================================================= */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <Trash2 className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Confirmar Exclusão</span>
            </div>
            <DialogTitle className="text-lg font-bold">Remover Colaborador?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tem certeza de que deseja excluir{" "}
              <strong className="text-foreground">{selectedUser?.name}</strong> da equipe? Esta ação
              revogará imediatamente o acesso ao sistema.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-xl font-semibold"
            >
              Sim, Excluir Colaborador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
