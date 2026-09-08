import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  AtSign,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Store,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import type { StatusLoja, UserAccount, Loja } from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dev/lojas")({
  head: () => ({
    meta: [
      { title: "Painel do Desenvolvedor — Super Admin | Keep Serv" },
      {
        name: "description",
        content:
          "Gestão exclusiva de lojas e credenciais de donos para desenvolvedores do sistema.",
      },
    ],
  }),
  component: DevLojasPage,
});

function generateUniqueStoreCode(existingCodes: string[]): string {
  const prefixes = ["RESTA", "BISTRO", "PUB", "CAFE", "GRILL", "PIZZA", "BURGER"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(10 + Math.random() * 90);
  const code = `${prefix}${num}`;
  if (existingCodes.includes(code)) {
    return `${prefix}${num + 1}`;
  }
  return code;
}

function DevLojasPage() {
  const {
    session,
    allLojas,
    allUsers,
    createLoja,
    updateLoja,
    updateUser,
    changeUserPassword,
    addUser,
    toggleLojaStatus,
    deleteLoja,
    logout,
  } = useKeepServ();
  const navigate = useNavigate();

  // Estados do Formulário de Criação
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [codigoLoja, setCodigoLoja] = useState("");
  const [statusLoja, setStatusLoja] = useState<StatusLoja>("ativo");
  const [cidade, setCidade] = useState("");
  const [telefone, setTelefone] = useState("");

  const [gestorNome, setGestorNome] = useState("");
  const [gestorUsuario, setGestorUsuario] = useState("");
  const [userTouchedGestorUsuario, setUserTouchedGestorUsuario] = useState(false);
  const [gestorEmail, setGestorEmail] = useState("");
  const [gestorSenha, setGestorSenha] = useState("keepserv");
  const [gestorTelefone, setGestorTelefone] = useState("");
  const [showGestorSenha, setShowGestorSenha] = useState(false);

  // Estados do Modal de Edição de Loja e Gestor
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
  const [editingGestor, setEditingGestor] = useState<UserAccount | null>(null);

  // Campos de Edição da Loja
  const [editNomeFantasia, setEditNomeFantasia] = useState("");
  const [editCodigoLoja, setEditCodigoLoja] = useState("");
  const [editStatusLoja, setEditStatusLoja] = useState<StatusLoja>("ativo");
  const [editCidade, setEditCidade] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editRazaoSocial, setEditRazaoSocial] = useState("");
  const [editCnpj, setEditCnpj] = useState("");

  // Campos de Edição do Gestor
  const [editGestorNome, setEditGestorNome] = useState("");
  const [editGestorUsuario, setEditGestorUsuario] = useState("");
  const [editGestorEmail, setEditGestorEmail] = useState("");
  const [editGestorTelefone, setEditGestorTelefone] = useState("");
  const [editGestorStatus, setEditGestorStatus] = useState<boolean>(true);
  const [editGestorNovaSenha, setEditGestorNovaSenha] = useState("");
  const [showEditGestorSenha, setShowEditGestorSenha] = useState(false);

  // Estados de Busca e Filtro
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  // Modal de Exclusão
  const [lojaToDelete, setLojaToDelete] = useState<{ id: string; nome: string } | null>(null);

  // Copiado recentemente
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Lista de códigos existentes para verificação de unicidade
  const existingCodes = useMemo(() => allLojas.map((l) => l.codigo_loja.toUpperCase()), [allLojas]);

  // Filtragem das lojas
  const filteredLojas = useMemo(() => {
    return allLojas.filter((l) => {
      const matchSearch =
        !search ||
        l.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
        l.codigo_loja.toLowerCase().includes(search.toLowerCase()) ||
        (l.cidade && l.cidade.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "todos" || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allLojas, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      totalLojas: allLojas.length,
      ativas: allLojas.filter((l) => l.status === "ativo").length,
      inativas: allLojas.filter((l) => l.status === "inativo").length,
      totalGestores: allUsers.filter((u) => u.nivel === "gestor" || u.nivel === "dono_loja").length,
      totalColaboradores: allUsers.filter((u) => u.nivel === "colaborador").length,
    };
  }, [allLojas, allUsers]);

  // --- MIDDLEWARE DE PROTEÇÃO DE ROTA (Item 4 da especificação) ---
  // "Crie um middleware de proteção para esta rota: ela DEVE validar se o usuário logado
  // tem 'nivel === dev'. Se qualquer outro usuário tentar acessar pela URL, bloqueie o acesso e redirecione."
  useEffect(() => {
    if (!session) {
      toast.error("Acesso restrito: faça login com sua conta de Desenvolvedor.");
      const t = setTimeout(() => navigate({ to: "/" }), 1200);
      return () => clearTimeout(t);
    }

    if (session.nivel !== "dev") {
      toast.error(
        `Acesso negado: o usuário "${session.name}" possui nível "${session.nivel}" e não tem autorização para a área do desenvolvedor.`,
      );
      const t = setTimeout(() => navigate({ to: "/pedidos" }), 1500);
      return () => clearTimeout(t);
    }
  }, [session, navigate]);

  // Se não for dev, renderiza tela de bloqueio visual enquanto o redirecionamento ocorre
  if (!session || session.nivel !== "dev") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center shadow-lg">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <ShieldAlert className="size-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-destructive">
            Acesso Restrito ao Desenvolvedor
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta rota é restrita exclusivamente ao Super Admin desenvolvedor (
            <code>nivel: dev</code>
            ). Usuários com outros níveis de acesso não possuem permissão nesta área.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate({ to: session ? "/pedidos" : "/" })}
            >
              {session ? "Voltar aos Pedidos" : "Ir para o Login"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleGenerateCode = () => {
    const code = generateUniqueStoreCode(existingCodes);
    setCodigoLoja(code);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Código "${code}" copiado para a área de transferência!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();

    if (!gestorUsuario.trim()) {
      toast.error("Informe o nome de usuário do gestor para login.");
      return;
    }

    if (!gestorEmail.trim() || !gestorEmail.includes("@")) {
      toast.error(
        "Informe um e-mail válido para o gestor (obrigatório para recuperação de senha).",
      );
      return;
    }

    const res = createLoja(
      {
        nome_fantasia: nomeFantasia,
        codigo_loja: codigoLoja,
        status: statusLoja,
        cidade,
        telefone,
      },
      {
        nome: gestorNome,
        usuario: gestorUsuario.trim().toLowerCase(),
        senha: gestorSenha,
        email: gestorEmail,
        phone: gestorTelefone,
      },
    );

    if (!res.success) {
      toast.error(res.message || "Erro ao cadastrar loja.");
      return;
    }

    toast.success(
      `Loja "${res.loja?.nome_fantasia}" criada com sucesso! Gestor "${res.gestor?.nome || res.dono?.nome}" cadastrado com usuário "@${res.gestor?.usuario || res.dono?.usuario}".`,
    );

    // Limpa formulário
    setNomeFantasia("");
    setCodigoLoja("");
    setCidade("");
    setTelefone("");
    setGestorNome("");
    setGestorUsuario("");
    setUserTouchedGestorUsuario(false);
    setGestorEmail("");
    setGestorSenha("keepserv");
    setGestorTelefone("");
  };

  const handleOpenEdit = (loja: Loja) => {
    const gestor = allUsers.find(
      (u) =>
        u.id === loja.gestor_id ||
        u.id === loja.dono_id ||
        (u.loja_id === loja.id && (u.nivel === "gestor" || u.nivel === "dono_loja")),
    );

    setEditingLoja(loja);
    setEditingGestor(gestor || null);

    // Loja
    setEditNomeFantasia(loja.nome_fantasia || "");
    setEditCodigoLoja(loja.codigo_loja || "");
    setEditStatusLoja(loja.status || "ativo");
    setEditCidade(loja.cidade || "");
    setEditTelefone(loja.telefone || "");
    setEditRazaoSocial(loja.razao_social || "");
    setEditCnpj(loja.cnpj || "");

    // Gestor
    if (gestor) {
      setEditGestorNome(gestor.nome || gestor.name || "");
      setEditGestorUsuario(gestor.usuario || gestor.username || "");
      setEditGestorEmail(gestor.email || "");
      setEditGestorTelefone(gestor.phone || "");
      setEditGestorStatus(gestor.active !== false);
    } else {
      setEditGestorNome("");
      setEditGestorUsuario("");
      setEditGestorEmail("");
      setEditGestorTelefone("");
      setEditGestorStatus(true);
    }

    setEditGestorNovaSenha("");
    setShowEditGestorSenha(false);
    setIsEditOpen(true);
  };

  const handleGenerateEditCode = () => {
    const prefixes = ["RESTA", "BISTRO", "PUB", "CAFE", "GRILL", "PIZZA", "BURGER"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setEditCodigoLoja(`${prefix}${num}`);
  };

  const handleGenerateEditPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditGestorNovaSenha(pwd);
    setShowEditGestorSenha(true);
    toast.info(`Nova senha gerada: ${pwd}`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoja) return;

    const cleanNome = editNomeFantasia.trim();
    if (!cleanNome) {
      toast.error("O nome fantasia da loja é obrigatório.");
      return;
    }

    const cleanCodigo = editCodigoLoja.trim().toUpperCase();
    if (!cleanCodigo) {
      toast.error("O código de login da loja é obrigatório.");
      return;
    }

    // Valida se o código de loja é único perante as outras lojas
    const codeConflict = allLojas.some(
      (l) => l.id !== editingLoja.id && l.codigo_loja.toUpperCase() === cleanCodigo,
    );
    if (codeConflict) {
      toast.error(`O código de loja "${cleanCodigo}" já está cadastrado em outro estabelecimento.`);
      return;
    }

    // Validações do Gestor
    const cleanGestorNome = editGestorNome.trim();
    const cleanGestorUsuario = editGestorUsuario
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9._-]/g, "");

    if (cleanGestorNome && !cleanGestorUsuario) {
      toast.error("Informe um nome de usuário (@usuario) para o gestor.");
      return;
    }

    if (cleanGestorUsuario) {
      const userConflict = allUsers.some(
        (u) =>
          u.id !== editingGestor?.id &&
          ((u.usuario && u.usuario.toLowerCase() === cleanGestorUsuario) ||
            (u.username && u.username.toLowerCase() === cleanGestorUsuario)),
      );
      if (userConflict) {
        toast.error(`O nome de usuário "@${cleanGestorUsuario}" já está em uso por outro usuário.`);
        return;
      }
    }

    // 1. Atualizar dados cadastrais da Loja
    updateLoja(editingLoja.id, {
      nome_fantasia: cleanNome,
      codigo_loja: cleanCodigo,
      status: editStatusLoja,
      cidade: editCidade.trim(),
      telefone: editTelefone.trim(),
      razao_social: editRazaoSocial.trim(),
      cnpj: editCnpj.trim(),
    });

    // 2. Atualizar ou Vincular dados do Gestor
    if (editingGestor) {
      if (!editGestorEmail.trim() || !editGestorEmail.includes("@")) {
        toast.error(
          "Informe um e-mail válido para o gestor (obrigatório para recuperação de senha).",
        );
        return;
      }

      updateUser(editingGestor.id, {
        nome: cleanGestorNome || editingGestor.nome,
        name: cleanGestorNome || editingGestor.name,
        usuario: cleanGestorUsuario || editingGestor.usuario,
        username: cleanGestorUsuario || editingGestor.username,
        email: editGestorEmail.trim().toLowerCase(),
        phone: editGestorTelefone.trim(),
        active: editGestorStatus,
      });

      if (editGestorNovaSenha.trim()) {
        changeUserPassword(editingGestor.id, editGestorNovaSenha.trim());
      }
    } else if (cleanGestorNome && cleanGestorUsuario) {
      const newGestor = addUser({
        name: cleanGestorNome,
        nome: cleanGestorNome,
        usuario: cleanGestorUsuario,
        username: cleanGestorUsuario,
        email: editGestorEmail.trim().toLowerCase() || `${cleanGestorUsuario}@keepserv.com`,
        senha: editGestorNovaSenha.trim() || "keepserv",
        password: editGestorNovaSenha.trim() || "keepserv",
        role: "gestor",
        cargo: "gestor",
        nivel: "gestor",
        loja_id: editingLoja.id,
        phone: editGestorTelefone.trim(),
      });
      if (newGestor) {
        updateLoja(editingLoja.id, { gestor_id: newGestor.id, dono_id: newGestor.id });
      }
    }

    toast.success(`Dados da loja "${cleanNome}" e do gestor atualizados com sucesso!`);
    setIsEditOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!lojaToDelete) return;
    const res = deleteLoja(lojaToDelete.id);
    if (res.success) {
      toast.success(`Loja "${lojaToDelete.nome}" e seus dados foram excluídos com sucesso.`);
    } else {
      toast.error(res.message || "Não foi possível excluir a loja.");
    }
    setLojaToDelete(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header do Super Admin */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
              <Shield className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold tracking-tight">
                  KeepServ <span className="text-purple-600">Dev Center</span>
                </span>
                <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px]">
                  Área Secreta · Super Admin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Cadastro e Gestão Multi-Tenant de Lojas Cadastradas & Gestores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
              <Building2 className="size-3.5" />
              <span>Gestão de Estabelecimentos</span>
            </div>

            <div className="hidden text-right leading-tight sm:block pl-2">
              <p className="text-sm font-semibold">{session.name}</p>
              <p className="text-xs font-mono text-purple-600 dark:text-purple-400">
                nivel: dev (Root)
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="gap-1.5 text-xs"
            >
              <LogOut className="size-3.5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Banner de Estatísticas */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total de Lojas
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-foreground">
              {stats.totalLojas}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Lojas Ativas
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.ativas}
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Lojas Inativas
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
              {stats.inativas}
            </p>
          </div>
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Gestores de Loja
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalGestores}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Colaboradores
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-foreground">
              {stats.totalColaboradores}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1.4fr]">
          {/* COLUNA ESQUERDA: Cadastro de Nova Loja & Primeiro Usuário */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600">
                <Plus className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">Cadastrar Nova Loja</h2>
                <p className="text-xs text-muted-foreground">
                  Gere o código de acesso exclusivo e configure o Gestor inicial da loja.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateStore} className="mt-6 space-y-5">
              {/* Bloco: Dados do Estabelecimento */}
              <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  1. Dados do Estabelecimento (Tenant)
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="nomeFantasia" className="text-xs">
                    Nome Fantasia da Loja *
                  </Label>
                  <Input
                    id="nomeFantasia"
                    required
                    placeholder="Ex: Bar do Alemão, Pizzaria Bella"
                    value={nomeFantasia}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNomeFantasia(val);
                      if (!userTouchedGestorUsuario && val.trim()) {
                        const slug = val
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]/g, "");
                        setGestorUsuario(`gestor.${slug}`);
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="codigoLoja" className="text-xs">
                      Código Único da Loja (codigo_loja) *
                    </Label>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700"
                    >
                      <Sparkles className="size-3" />
                      <span>Gerar Automático</span>
                    </button>
                  </div>
                  <Input
                    id="codigoLoja"
                    required
                    placeholder="Ex: BARALEMAO01"
                    value={codigoLoja}
                    onChange={(e) => setCodigoLoja(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Este código é obrigatório para que os colaboradores e o gestor façam login.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cidade" className="text-xs">
                      Cidade / UF
                    </Label>
                    <Input
                      id="cidade"
                      placeholder="Ex: São Paulo / SP"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="statusLoja" className="text-xs">
                      Status Inicial
                    </Label>
                    <select
                      id="statusLoja"
                      value={statusLoja}
                      onChange={(e) => setStatusLoja(e.target.value as StatusLoja)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs"
                    >
                      <option value="ativo">Ativo (Permite Login)</option>
                      <option value="inativo">Inativo (Bloqueado)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloco: Gestor da Loja (nivel: gestor) */}
              <div className="space-y-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    2. Gestor da Loja
                  </p>
                  <Badge className="bg-indigo-600 text-white text-[10px]">nivel: gestor</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  O sistema configurará este usuário como o Gestor com controle total sobre a loja e
                  sua equipe. O desenvolvedor gerencia apenas lojas cadastradas e não cadastra
                  colaboradores.
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="gestorNome" className="text-xs font-semibold">
                    Nome Completo do Gestor *
                  </Label>
                  <Input
                    id="gestorNome"
                    required
                    placeholder="Ex: Carlos Eduardo Silva"
                    value={gestorNome}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGestorNome(val);
                      if (!userTouchedGestorUsuario && val.trim()) {
                        const slug = val
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]/g, ".");
                        setGestorUsuario(slug);
                      }
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gestorUsuario" className="text-xs font-semibold">
                      Nome de Usuário para Login *
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      login via usuário
                    </span>
                  </div>
                  <Input
                    id="gestorUsuario"
                    required
                    placeholder="Ex: carlos.gestor ou gestor"
                    value={gestorUsuario}
                    onChange={(e) => {
                      setUserTouchedGestorUsuario(true);
                      setGestorUsuario(
                        e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "")
                          .replace(/[^a-z0-9._-]/g, ""),
                      );
                    }}
                    className="font-mono text-xs sm:text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    O gestor utilizará este nome de usuário e o código da loja para acessar o
                    sistema.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="gestorSenha" className="text-xs font-semibold">
                      Senha Provisória *
                    </Label>
                    <div className="relative">
                      <Input
                        id="gestorSenha"
                        type={showGestorSenha ? "text" : "password"}
                        required
                        value={gestorSenha}
                        onChange={(e) => setGestorSenha(e.target.value)}
                        className="pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGestorSenha(!showGestorSenha)}
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground"
                      >
                        {showGestorSenha ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gestorTelefone" className="text-xs font-semibold">
                      WhatsApp / Telefone
                    </Label>
                    <Input
                      id="gestorTelefone"
                      placeholder="(11) 99999-0000"
                      value={gestorTelefone}
                      onChange={(e) => setGestorTelefone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gestorEmail" className="text-xs font-semibold">
                      E-mail do Gestor <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      recuperação de senha
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="gestorEmail"
                      type="email"
                      required
                      placeholder="Ex: carlos.gestor@restaurante.com.br"
                      value={gestorEmail}
                      onChange={(e) => setGestorEmail(e.target.value)}
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Obrigatório para redefinição e recuperação de senha. O login no sistema continua
                    sendo realizado pelo nome de usuário.
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                Cadastrar Loja e Gestor Inicial
              </Button>
            </form>
          </div>

          {/* COLUNA DIREITA: Listagem e Gestão de Lojas */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Lojas Cadastradas no Sistema</h2>
                <p className="text-xs text-muted-foreground">
                  {filteredLojas.length} de {allLojas.length} lojas exibidas
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar loja ou código..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-48 pl-8 text-xs"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "todos" | "ativo" | "inativo")}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-2xs"
                >
                  <option value="todos">Todos Status</option>
                  <option value="ativo">Apenas Ativas</option>
                  <option value="inativo">Apenas Inativas</option>
                </select>
              </div>
            </div>

            {/* Grid de Lojas */}
            <div className="grid gap-3">
              {filteredLojas.map((loja) => {
                const gestor = allUsers.find(
                  (u) =>
                    u.id === loja.gestor_id ||
                    u.id === loja.dono_id ||
                    (u.loja_id === loja.id && (u.nivel === "gestor" || u.nivel === "dono_loja")),
                );
                const teamCount = allUsers.filter((u) => u.loja_id === loja.id).length;
                const isCopied = copiedCode === loja.codigo_loja;

                return (
                  <div
                    key={loja.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all shadow-xs",
                      loja.status === "ativo"
                        ? "border-border bg-card"
                        : "border-border/60 bg-muted/30 opacity-80",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-bold text-foreground">
                            {loja.nome_fantasia}
                          </h3>
                          <Badge
                            variant={loja.status === "ativo" ? "default" : "secondary"}
                            className={cn(
                              "text-[10px] font-semibold",
                              loja.status === "ativo"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : "bg-destructive/15 text-destructive border-destructive/30",
                            )}
                          >
                            {loja.status === "ativo" ? "Ativo" : "Inativo"}
                          </Badge>
                          {loja.cidade && (
                            <span className="text-xs text-muted-foreground">· {loja.cidade}</span>
                          )}
                        </div>

                        {/* Código de Loja com botão Copiar */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Código de Login:</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(loja.codigo_loja)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-colors"
                            title="Clique para copiar o código da loja"
                          >
                            <span>{loja.codigo_loja}</span>
                            {isCopied ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Ações Rápidas */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(loja)}
                          className="h-7 px-2 text-[11px] gap-1 text-primary hover:text-primary"
                          title="Editar dados da loja e do gestor"
                        >
                          <Pencil className="size-3" />
                          <span>Editar</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleLojaStatus(loja.id)}
                          className={cn(
                            "h-7 px-2 text-[11px] gap-1",
                            loja.status === "ativo"
                              ? "text-amber-600 hover:text-amber-700"
                              : "text-emerald-600 hover:text-emerald-700",
                          )}
                          title={loja.status === "ativo" ? "Desativar loja" : "Reativar loja"}
                        >
                          <Power className="size-3" />
                          <span>{loja.status === "ativo" ? "Desativar" : "Ativar"}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:bg-destructive/10"
                          onClick={() => setLojaToDelete({ id: loja.id, nome: loja.nome_fantasia })}
                          title="Excluir loja e dados"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Detalhes do Gestor e Equipe */}
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 rounded-lg border border-border/70 bg-muted/40 p-2.5 text-xs">
                      <div>
                        <span className="font-semibold text-foreground">Gestor da Loja:</span>
                        <div className="text-muted-foreground truncate">
                          {gestor ? (
                            <span>
                              {gestor.nome || gestor.name}{" "}
                              <strong className="text-foreground font-mono">
                                (@{gestor.usuario || gestor.username || gestor.email.split("@")[0]})
                              </strong>
                            </span>
                          ) : (
                            <span className="text-amber-600 italic">Gestor não vinculado</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">Total da Equipe:</span>
                        <div className="text-muted-foreground">
                          {teamCount} usuários nesta loja (cadastrados pelo gestor)
                        </div>
                      </div>
                    </div>

                    {/* Rodapé do Card com Ações */}
                    <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] text-muted-foreground">
                      <span className="font-mono text-[10px]">ID: {loja.id}</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(loja)}
                        className="h-7.5 px-3 text-xs gap-1.5 font-medium rounded-lg shadow-2xs hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Pencil className="size-3 text-primary" />
                        <span>Editar Loja e Gestor</span>
                      </Button>
                    </div>
                  </div>
                );
              })}

              {filteredLojas.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Store className="mx-auto size-8 text-muted-foreground/60" />
                  <p className="mt-2 text-sm font-semibold">Nenhuma loja encontrada</p>
                  <p className="text-xs text-muted-foreground">
                    Tente ajustar os filtros de busca ou cadastre uma nova loja ao lado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Edição de Loja e Gestor */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader className="p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Pencil className="size-4" />
                </span>
                <div>
                  <DialogTitle className="font-display text-base font-bold text-foreground">
                    Editar Loja e Gestor Responsável
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Atualize os dados cadastrais do estabelecimento e as credenciais de acesso do
                    gestor.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-5 space-y-6">
              {/* Seção 1: Dados da Loja */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <Store className="size-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    1. Dados do Estabelecimento (Loja)
                  </h4>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="editNomeFantasia" className="text-xs font-medium">
                      Nome Fantasia da Loja *
                    </Label>
                    <Input
                      id="editNomeFantasia"
                      required
                      value={editNomeFantasia}
                      onChange={(e) => setEditNomeFantasia(e.target.value)}
                      placeholder="Ex: Bar do Alemão, Pizzaria Bella"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="editCodigoLoja" className="text-xs font-medium">
                        Código de Login (codigo_loja) *
                      </Label>
                      <button
                        type="button"
                        onClick={handleGenerateEditCode}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700"
                      >
                        <Sparkles className="size-3" />
                        <span>Sugerir Código</span>
                      </button>
                    </div>
                    <Input
                      id="editCodigoLoja"
                      required
                      value={editCodigoLoja}
                      onChange={(e) => setEditCodigoLoja(e.target.value.toUpperCase())}
                      className="font-mono uppercase text-sm"
                      placeholder="Ex: BARALEMAO01"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Identificador único exigido na tela de login de todos os usuários desta loja.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editStatusLoja" className="text-xs font-medium">
                      Status da Loja
                    </Label>
                    <select
                      id="editStatusLoja"
                      value={editStatusLoja}
                      onChange={(e) => setEditStatusLoja(e.target.value as StatusLoja)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs"
                    >
                      <option value="ativo">Ativo (Permite Login e Operação)</option>
                      <option value="inativo">Inativo (Bloqueado)</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground">
                      Se inativo, colaboradores e gestor são impedidos de fazer login.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editCidade" className="text-xs font-medium">
                      Cidade / UF
                    </Label>
                    <Input
                      id="editCidade"
                      value={editCidade}
                      onChange={(e) => setEditCidade(e.target.value)}
                      placeholder="Ex: São Paulo / SP"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editTelefone" className="text-xs font-medium">
                      Telefone / WhatsApp da Loja
                    </Label>
                    <Input
                      id="editTelefone"
                      value={editTelefone}
                      onChange={(e) => setEditTelefone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editRazaoSocial" className="text-xs font-medium">
                      Razão Social
                    </Label>
                    <Input
                      id="editRazaoSocial"
                      value={editRazaoSocial}
                      onChange={(e) => setEditRazaoSocial(e.target.value)}
                      placeholder="Ex: Alemão Gastronomia LTDA"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editCnpj" className="text-xs font-medium">
                      CNPJ
                    </Label>
                    <Input
                      id="editCnpj"
                      value={editCnpj}
                      onChange={(e) => setEditCnpj(e.target.value)}
                      placeholder="Ex: 00.000.000/0001-00"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados do Gestor */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <UserCheck className="size-4 text-purple-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    2. Dados do Gestor da Loja
                  </h4>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="editGestorNome" className="text-xs font-medium">
                      Nome Completo do Gestor *
                    </Label>
                    <Input
                      id="editGestorNome"
                      required
                      value={editGestorNome}
                      onChange={(e) => setEditGestorNome(e.target.value)}
                      placeholder="Ex: Carlos Eduardo"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editGestorUsuario" className="text-xs font-medium">
                      Nome de Usuário (@usuario) *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">
                        @
                      </span>
                      <Input
                        id="editGestorUsuario"
                        required
                        value={editGestorUsuario}
                        onChange={(e) => setEditGestorUsuario(e.target.value)}
                        placeholder="gestor.aleman"
                        className="pl-7 font-mono text-sm lowercase"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Utilizado pelo gestor para acessar o sistema no login.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editGestorStatus" className="text-xs font-medium">
                      Status do Gestor
                    </Label>
                    <select
                      id="editGestorStatus"
                      value={editGestorStatus ? "ativo" : "inativo"}
                      onChange={(e) => setEditGestorStatus(e.target.value === "ativo")}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs"
                    >
                      <option value="ativo">Conta Ativa (Pode Entrar)</option>
                      <option value="inativo">Conta Bloqueada (Desativado)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="editGestorEmail" className="text-xs font-medium">
                        E-mail do Gestor <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        recuperação de senha
                      </span>
                    </div>
                    <div className="relative">
                      <Mail className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="editGestorEmail"
                        type="email"
                        required
                        value={editGestorEmail}
                        onChange={(e) => setEditGestorEmail(e.target.value)}
                        placeholder="carlos@bardaoalemao.com.br"
                        className="pl-8 text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Necessário para recuperação de senha pelo botão na tela de login.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editGestorTelefone" className="text-xs font-medium">
                      Telefone / WhatsApp do Gestor
                    </Label>
                    <Input
                      id="editGestorTelefone"
                      value={editGestorTelefone}
                      onChange={(e) => setEditGestorTelefone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="text-sm"
                    />
                  </div>

                  {/* Redefinição de Senha */}
                  <div className="space-y-1.5 sm:col-span-2 pt-1 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="editGestorNovaSenha" className="text-xs font-medium">
                        Redefinir Senha do Gestor (Opcional)
                      </Label>
                      <button
                        type="button"
                        onClick={handleGenerateEditPassword}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700"
                      >
                        <Sparkles className="size-3" />
                        <span>Gerar Nova Senha</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="editGestorNovaSenha"
                        type={showEditGestorSenha ? "text" : "password"}
                        value={editGestorNovaSenha}
                        onChange={(e) => setEditGestorNovaSenha(e.target.value)}
                        placeholder="Deixe em branco para manter a senha atual"
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditGestorSenha(!showEditGestorSenha)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showEditGestorSenha ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {editingGestor
                        ? "Deixe vazio para manter a senha cadastrada pelo gestor."
                        : "Defina uma senha inicial para o novo gestor."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border bg-muted/10 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground gap-1.5">
                <Save className="size-4" />
                <span>Salvar Alterações</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={!!lojaToDelete} onOpenChange={(open) => !open && setLojaToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão de Loja</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir permanentemente a loja{" "}
              <strong>{lojaToDelete?.nome}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <p className="font-semibold">Atenção (Isolamento Multi-Tenant):</p>
            <p className="mt-1">
              Esta ação removerá todos os usuários vinculados, pedidos, itens do cardápio e
              registros de estoque pertencentes a este tenant.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLojaToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Confirmar e Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
