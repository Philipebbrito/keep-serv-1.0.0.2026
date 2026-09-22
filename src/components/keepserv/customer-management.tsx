import { useState, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Cake,
  Gift,
  Star,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  HeartHandshake,
  AlertTriangle,
  Utensils,
  Wine,
  MapPin,
  MessageCircle,
  ExternalLink,
  Edit3,
  Trash2,
  Filter,
  CheckCircle2,
  Sparkles,
  Download,
  Info,
  ChevronRight,
  ShieldAlert,
  Coffee,
  Receipt,
  UserCheck,
  Flame,
  ArrowUpDown,
  History,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, useCustomers } from "@/state";
import {
  COMMON_DIETARY_RESTRICTIONS,
  TABLE_LOCATIONS,
  formatBRL,
  formatDateBR,
  getCustomerBirthdayInfo,
  type Customer,
  type CustomerStatus,
  type CustomerVisit,
  type NewCustomerInput,
} from "@/domain";

type FilterTab =
  "todos" | "vip" | "frequente" | "aniversariantes" | "em_risco" | "restricoes" | "novos";

type SortOption =
  "gasto_desc" | "visitas_desc" | "ticket_desc" | "ultima_visita" | "aniversario" | "nome_asc";

export function CustomerManagement() {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerVisit,
    resetCustomersToDefault,
  } = useCustomers();
  const { session } = useAuth();

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("todos");
  const [sortBy, setSortBy] = useState<SortOption>("gasto_desc");
  const [dietaryFilter, setDietaryFilter] = useState<string>("todas");

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [whatsappCustomer, setWhatsappCustomer] = useState<Customer | null>(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState<
    "aniversario" | "saudade" | "reserva" | "personalizada"
  >("aniversario");
  const [customMessage, setCustomMessage] = useState("");
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);

  // Form de novo/editar cliente
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDocument, setFormDocument] = useState("");
  const [formBirthdate, setFormBirthdate] = useState("");
  const [formStatus, setFormStatus] = useState<CustomerStatus>("padrao");
  const [formTags, setFormTags] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTableLocation, setFormTableLocation] = useState("");
  const [formDietary, setFormDietary] = useState<string[]>([]);
  const [formCustomDietary, setFormCustomDietary] = useState("");
  const [formDrinks, setFormDrinks] = useState("");
  const [formDishes, setFormDishes] = useState("");
  const [formCookingPreference, setFormCookingPreference] = useState("");
  const [formPreferredPayment, setFormPreferredPayment] = useState("");

  // Form de nova visita manual
  const [visitTable, setVisitTable] = useState("4");
  const [visitAmount, setVisitAmount] = useState("");
  const [visitGuests, setVisitGuests] = useState("2");
  const [visitItems, setVisitItems] = useState("");
  const [visitPayment, setVisitPayment] = useState("cartao_credito");
  const [visitWaiter, setVisitWaiter] = useState(session?.name || "Garçom");
  const [visitNotes, setVisitNotes] = useState("");

  // Métricas agregadas
  const metrics = useMemo(() => {
    const total = customers.length;
    const vips = customers.filter((c) => c.status === "vip").length;
    const frequents = customers.filter((c) => c.status === "frequente").length;
    const totalVisits = customers.reduce((acc, c) => acc + c.metrics.totalVisits, 0);
    const totalRevenue = customers.reduce((acc, c) => acc + c.metrics.totalSpent, 0);
    const globalAvgTicket = totalVisits > 0 ? totalRevenue / totalVisits : 0;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    // Aniversariantes do mês
    const birthdayCustomers = customers.filter((c) => {
      const bInfo = getCustomerBirthdayInfo(c);
      return bInfo.isThisMonth;
    });

    // Aniversariantes de hoje ou próximos 7 dias
    const upcomingBirthdays = customers
      .map((c) => ({ customer: c, info: getCustomerBirthdayInfo(c) }))
      .filter(
        (item) => item.info.isToday || (item.info.daysUntil !== null && item.info.daysUntil <= 7),
      )
      .sort((a, b) => (a.info.daysUntil ?? 999) - (b.info.daysUntil ?? 999));

    // Clientes em risco (mais de 45 dias sem visitar)
    const atRiskCount = customers.filter(
      (c) => c.metrics.daysSinceLastVisit !== null && c.metrics.daysSinceLastVisit > 45,
    ).length;

    return {
      total,
      vips,
      frequents,
      totalVisits,
      totalRevenue,
      globalAvgTicket,
      birthdayCustomers,
      upcomingBirthdays,
      atRiskCount,
    };
  }, [customers]);

  // Lista filtrada e ordenada
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    // Busca textual
    if (searchTerm.trim()) {
      const clean = searchTerm.toLowerCase().trim();
      const cleanDigits = searchTerm.replace(/\D/g, "");
      list = list.filter((c) => {
        if (c.name.toLowerCase().includes(clean)) return true;
        if (c.phone.replace(/\D/g, "").includes(cleanDigits)) return true;
        if (c.document && c.document.replace(/\D/g, "").includes(cleanDigits)) return true;
        if (c.email && c.email.toLowerCase().includes(clean)) return true;
        if (c.tags.some((t) => t.toLowerCase().includes(clean))) return true;
        if (c.preferences?.tableLocation?.toLowerCase().includes(clean)) return true;
        return false;
      });
    }

    // Filtro de aba
    if (activeFilter === "vip") {
      list = list.filter((c) => c.status === "vip");
    } else if (activeFilter === "frequente") {
      list = list.filter((c) => c.status === "frequente");
    } else if (activeFilter === "aniversariantes") {
      list = list.filter((c) => getCustomerBirthdayInfo(c).isThisMonth);
    } else if (activeFilter === "em_risco") {
      list = list.filter(
        (c) => c.metrics.daysSinceLastVisit !== null && c.metrics.daysSinceLastVisit > 45,
      );
    } else if (activeFilter === "restricoes") {
      list = list.filter(
        (c) => c.preferences?.dietaryRestrictions && c.preferences.dietaryRestrictions.length > 0,
      );
    } else if (activeFilter === "novos") {
      list = list.filter((c) => c.metrics.totalVisits <= 1 || c.tags.includes("Novo Cliente"));
    }

    // Filtro por restrição alimentar específica
    if (dietaryFilter !== "todas") {
      list = list.filter((c) => c.preferences?.dietaryRestrictions?.includes(dietaryFilter));
    }

    // Ordenação
    list.sort((a, b) => {
      if (sortBy === "gasto_desc") return b.metrics.totalSpent - a.metrics.totalSpent;
      if (sortBy === "visitas_desc") return b.metrics.totalVisits - a.metrics.totalVisits;
      if (sortBy === "ticket_desc") return b.metrics.averageTicket - a.metrics.averageTicket;
      if (sortBy === "ultima_visita") {
        const lastA = a.metrics.lastVisitDate || 0;
        const lastB = b.metrics.lastVisitDate || 0;
        return lastB - lastA;
      }
      if (sortBy === "aniversario") {
        const bA = getCustomerBirthdayInfo(a).daysUntil ?? 999;
        const bB = getCustomerBirthdayInfo(b).daysUntil ?? 999;
        return bA - bB;
      }
      if (sortBy === "nome_asc") return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [customers, searchTerm, activeFilter, dietaryFilter, sortBy]);

  // Abertura do formulário para novo cliente
  const handleOpenNewCustomer = () => {
    setEditingCustomer(null);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormDocument("");
    setFormBirthdate("");
    setFormStatus("padrao");
    setFormTags("Novo Cliente");
    setFormNotes("");
    setFormTableLocation("");
    setFormDietary([]);
    setFormCustomDietary("");
    setFormDrinks("");
    setFormDishes("");
    setFormCookingPreference("");
    setFormPreferredPayment("");
    setIsFormOpen(true);
  };

  // Abertura do formulário para editar cliente
  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email || "");
    setFormDocument(c.document || "");
    setFormBirthdate(c.birthdate || "");
    setFormStatus(c.status);
    setFormTags(c.tags.join(", "));
    setFormNotes(c.notes || "");
    setFormTableLocation(c.preferences?.tableLocation || "");
    setFormDietary(c.preferences?.dietaryRestrictions || []);
    setFormCustomDietary("");
    setFormDrinks((c.preferences?.favoriteDrinks || []).join(", "));
    setFormDishes((c.preferences?.favoriteDishes || []).join(", "));
    setFormCookingPreference(c.preferences?.cookingPreference || "");
    setFormPreferredPayment(c.preferences?.preferredPayment || "");
    setIsFormOpen(true);
  };

  // Salvar cliente (novo ou edição)
  const handleSaveCustomer = () => {
    if (!formName.trim()) {
      toast.error("O nome do cliente é obrigatório.");
      return;
    }
    if (!formPhone.trim()) {
      toast.error("O telefone ou WhatsApp do cliente é obrigatório.");
      return;
    }

    const tagsArray = formTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const drinksArray = formDrinks
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const dishesArray = formDishes
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const finalDietary = [...formDietary];
    if (formCustomDietary.trim() && !finalDietary.includes(formCustomDietary.trim())) {
      finalDietary.push(formCustomDietary.trim());
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        document: formDocument.trim() || undefined,
        birthdate: formBirthdate || undefined,
        status: formStatus,
        tags: tagsArray.length > 0 ? tagsArray : ["Cliente"],
        notes: formNotes.trim() || undefined,
        preferences: {
          tableLocation: formTableLocation || undefined,
          dietaryRestrictions: finalDietary,
          favoriteDrinks: drinksArray,
          favoriteDishes: dishesArray,
          cookingPreference: formCookingPreference || undefined,
          preferredPayment: formPreferredPayment || undefined,
        },
      });
      toast.success(`Cadastro de "${formName}" atualizado com sucesso!`);
      if (viewingCustomer && viewingCustomer.id === editingCustomer.id) {
        // Atualiza a visualização aberta se for o mesmo
        const refreshed = customers.find((c) => c.id === editingCustomer.id);
        if (refreshed) setViewingCustomer(refreshed);
      }
    } else {
      const input: NewCustomerInput = {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        document: formDocument.trim() || undefined,
        birthdate: formBirthdate || undefined,
        status: formStatus,
        tags: tagsArray.length > 0 ? tagsArray : ["Novo Cliente"],
        notes: formNotes.trim() || undefined,
        preferences: {
          tableLocation: formTableLocation || undefined,
          dietaryRestrictions: finalDietary,
          favoriteDrinks: drinksArray,
          favoriteDishes: dishesArray,
          cookingPreference: formCookingPreference || undefined,
          preferredPayment: formPreferredPayment || undefined,
        },
      };
      const created = addCustomer(input);
      toast.success(`Cliente "${created.name}" cadastrado com sucesso no CRM!`);
    }

    setIsFormOpen(false);
  };

  // Exclusão de cliente
  const handleDeleteCustomer = (c: Customer) => {
    if (
      confirm(
        `Tem certeza que deseja remover "${c.name}" do CRM? Seu histórico de visitas será arquivado.`,
      )
    ) {
      deleteCustomer(c.id);
      if (viewingCustomer?.id === c.id) setViewingCustomer(null);
      toast.success(`Cliente "${c.name}" removido.`);
    }
  };

  // Alternar restrição no form
  const toggleDietaryTag = (item: string) => {
    setFormDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item],
    );
  };

  // Abrir modal de WhatsApp com mensagens pré-configuradas
  const handleOpenWhatsApp = (c: Customer, template = "aniversario") => {
    setWhatsappCustomer(c);
    const bInfo = getCustomerBirthdayInfo(c);

    if (template === "aniversario" || bInfo.isThisMonth) {
      setWhatsappTemplate("aniversario");
      setCustomMessage(
        `Olá, ${c.name}! 🎉 A equipe do Keep Serv deseja a você um Feliz Aniversário! Como forma de comemorar essa data tão especial, preparamos uma sobremesa artesanal de cortesia em sua próxima visita este mês. Esperamos você e seus convidados! 🎂✨`,
      );
    } else if (c.metrics.daysSinceLastVisit && c.metrics.daysSinceLastVisit > 30) {
      setWhatsappTemplate("saudade");
      setCustomMessage(
        `Olá, ${c.name}! Notamos que faz um tempinho desde a sua última visita ao Keep Serv. Temos novos cortes especiais e pratos no cardápio! Que tal nos visitar neste fim de semana? Adoraríamos recebê-lo novamente! 🍷🥩`,
      );
    } else {
      setWhatsappTemplate("reserva");
      setCustomMessage(
        `Olá, ${c.name}! Tudo bem? Passando para avisar que sua mesa favorita no Keep Serv está pronta para receber você e sua família sempre que desejar. Precisando reservar ou consultar o cardápio, estamos à disposição! 🍽️`,
      );
    }
  };

  const handleSendWhatsApp = () => {
    if (!whatsappCustomer) return;
    const cleanPhone = whatsappCustomer.phone.replace(/\D/g, "");
    const textEncoded = encodeURIComponent(customMessage);
    const url = `https://wa.me/55${cleanPhone}?text=${textEncoded}`;
    window.open(url, "_blank");
    toast.success(`Abrindo WhatsApp para ${whatsappCustomer.name}...`);
    setWhatsappCustomer(null);
  };

  // Registro manual de visita
  const handleRecordManualVisit = () => {
    if (!viewingCustomer) return;
    const amountVal = parseFloat(visitAmount.replace(",", "."));
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error("Informe um valor válido para o consumo.");
      return;
    }

    recordCustomerVisit(viewingCustomer.id, {
      table: parseInt(visitTable, 10) || 1,
      amount: amountVal,
      guests: parseInt(visitGuests, 10) || 1,
      itemsSummary: visitItems.trim() || "Consumo presencial registrado pelo gestor",
      paymentMethod: visitPayment,
      waiter: visitWaiter.trim() || "Gestor",
      notes: visitNotes.trim() || undefined,
    });

    toast.success(
      `Visita de ${formatBRL(amountVal)} registrada no histórico de ${viewingCustomer.name}!`,
    );
    setIsAddVisitOpen(false);
    setVisitAmount("");
    setVisitItems("");
    setVisitNotes("");

    // Atualiza o card de visualização
    const updated = customers.find((c) => c.id === viewingCustomer.id);
    if (updated) setViewingCustomer(updated);
  };

  // Exportar relatório CRM simples
  const handleExportCRM = () => {
    const header = [
      "Nome",
      "Telefone",
      "E-mail",
      "CPF",
      "Status",
      "Visitas",
      "Gasto Total",
      "Ticket Médio",
      "Última Visita",
      "Restrições Alimentares",
      "Mesa Preferida",
    ];
    const rows = filteredCustomers.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email || ""}"`,
      `"${c.document || ""}"`,
      `"${c.status.toUpperCase()}"`,
      c.metrics.totalVisits,
      c.metrics.totalSpent.toFixed(2),
      c.metrics.averageTicket.toFixed(2),
      `"${c.metrics.lastVisitDate ? formatDateBR(c.metrics.lastVisitDate) : "Sem visita"}"`,
      `"${(c.preferences?.dietaryRestrictions || []).join(", ")}"`,
      `"${c.preferences?.tableLocation || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `crm_clientes_keepserv_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório de clientes exportado em CSV.");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Clientes & Histórico (CRM)
              </h1>
              <p className="text-sm text-muted-foreground">
                Frequência de visitas, ticket médio individual, aniversários e preferências de
                consumo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCRM}
            className="gap-1.5 h-9"
            title="Exportar planilha de clientes"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetCustomersToDefault}
            className="gap-1.5 h-9 text-muted-foreground hover:text-foreground"
            title="Recarregar clientes de demonstração"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Restaurar Exemplo</span>
          </Button>

          <Button onClick={handleOpenNewCustomer} className="gap-2 h-9 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </Button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS DO CRM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Clientes */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Base de Clientes
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{metrics.total}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {metrics.vips} VIPs
              </span>
              <span>•</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {metrics.frequents} Frequentes
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Médio Geral */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ticket Médio Geral
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {formatBRL(metrics.globalAvgTicket)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalVisits} visitas registradas no total
            </p>
          </div>
        </div>

        {/* Aniversariantes do Mês */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Aniversários do Mês
            </span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Cake className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.birthdayCustomers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.upcomingBirthdays.length > 0
                ? `${metrics.upcomingBirthdays.length} nos próximos 7 dias!`
                : "Sem aniversários nesta semana"}
            </p>
          </div>
        </div>

        {/* Clientes em Risco (>45 dias) */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Clientes em Risco
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{metrics.atRiskCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Sem retorno há mais de 45 dias</p>
          </div>
        </div>
      </div>

      {/* BANNER DE ANIVERSARIANTES DE HOJE / DA SEMANA */}
      {metrics.upcomingBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200 dark:border-pink-950/40 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-3 rounded-2xl bg-pink-500 text-white shadow-sm shrink-0">
                <Gift className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-foreground text-base">
                    🎂 Parabéns aos Aniversariantes da Semana!
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200"
                  >
                    Oportunidade de Fidelização
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Envie uma mensagem carinhosa com um mimo ou sobremesa de cortesia para celebrar no
                  seu restaurante.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {metrics.upcomingBirthdays.map(({ customer, info }) => (
                <div
                  key={customer.id}
                  className="bg-card border rounded-xl px-3.5 py-2 flex items-center gap-3 shrink-0 shadow-xs"
                >
                  <div className="text-left">
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {customer.name}
                    </p>
                    <p className="text-xs font-medium text-pink-600 dark:text-pink-400">
                      {info.isToday
                        ? "É HOJE! 🎈"
                        : `Em ${info.daysUntil} dias (${info.formattedDayMonth})`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs gap-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                    onClick={() => handleOpenWhatsApp(customer, "aniversario")}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Parabéns
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE FILTROS E PESQUISA */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, telefone, CPF, tag ou restrição..."
              className="pl-9 h-10 rounded-xl"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro por Restrição Alimentar */}
            <Select value={dietaryFilter} onValueChange={setDietaryFilter}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl">
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Restrições" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Restrições</SelectItem>
                {COMMON_DIETARY_RESTRICTIONS.map((res) => (
                  <SelectItem key={res} value={res}>
                    {res}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger className="w-[190px] h-10 rounded-xl">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gasto_desc">Maior Gasto Total</SelectItem>
                <SelectItem value="visitas_desc">Mais Visitas</SelectItem>
                <SelectItem value="ticket_desc">Maior Ticket Médio</SelectItem>
                <SelectItem value="ultima_visita">Última Visita Mais Recente</SelectItem>
                <SelectItem value="aniversario">Próximo Aniversário</SelectItem>
                <SelectItem value="nome_asc">Nome (A - Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Abas de Segmentação Rápida */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm border-t pt-3">
          <Button
            variant={activeFilter === "todos" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("todos")}
            className="rounded-lg h-8 text-xs font-medium shrink-0"
          >
            Todos ({customers.length})
          </Button>
          <Button
            variant={activeFilter === "vip" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("vip")}
            className="rounded-lg h-8 text-xs font-medium shrink-0 gap-1.5"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            VIPs ({metrics.vips})
          </Button>
          <Button
            variant={activeFilter === "frequente" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("frequente")}
            className="rounded-lg h-8 text-xs font-medium shrink-0 gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            Frequentes ({metrics.frequents})
          </Button>
          <Button
            variant={activeFilter === "aniversariantes" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("aniversariantes")}
            className="rounded-lg h-8 text-xs font-medium shrink-0 gap-1.5"
          >
            <Cake className="w-3.5 h-3.5 text-pink-500" />
            Aniversariantes do Mês ({metrics.birthdayCustomers.length})
          </Button>
          <Button
            variant={activeFilter === "em_risco" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("em_risco")}
            className="rounded-lg h-8 text-xs font-medium shrink-0 gap-1.5 text-amber-600 dark:text-amber-400"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Em Risco &gt;45d ({metrics.atRiskCount})
          </Button>
          <Button
            variant={activeFilter === "restricoes" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("restricoes")}
            className="rounded-lg h-8 text-xs font-medium shrink-0 gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            Com Restrições
          </Button>
          <Button
            variant={activeFilter === "novos" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("novos")}
            className="rounded-lg h-8 text-xs font-medium shrink-0 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Novos Clientes
          </Button>
        </div>
      </div>

      {/* LISTA DE CLIENTES */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-foreground text-lg">Nenhum cliente encontrado</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Não foram encontrados clientes com os filtros e termos pesquisados. Tente limpar os
            filtros ou cadastre um novo cliente.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setActiveFilter("todos");
              setDietaryFilter("todas");
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const bInfo = getCustomerBirthdayInfo(customer);
            const isAtRisk =
              customer.metrics.daysSinceLastVisit !== null &&
              customer.metrics.daysSinceLastVisit > 45;

            // Iniciais do nome para avatar
            const initials = customer.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={customer.id}
                className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
              >
                {/* TOPO DO CARD: IDENTIFICAÇÃO E STATUS */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                          customer.status === "vip"
                            ? "bg-gradient-to-br from-amber-500 to-yellow-600"
                            : customer.status === "frequente"
                              ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                              : "bg-gradient-to-br from-blue-500 to-indigo-600"
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-foreground text-base leading-tight">
                            {customer.name}
                          </h4>
                          {customer.status === "vip" && (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 text-[10px] px-1.5 py-0 h-4 font-semibold"
                            >
                              VIP
                            </Badge>
                          )}
                          {customer.status === "frequente" && (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 text-[10px] px-1.5 py-0 h-4 font-semibold"
                            >
                              Frequente
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        title="Enviar mensagem WhatsApp"
                        onClick={() => handleOpenWhatsApp(customer)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Editar cadastro"
                        onClick={() => handleOpenEditCustomer(customer)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* ALERTA DE ANIVERSÁRIO SE FOR NO MÊS */}
                  {bInfo.isThisMonth && (
                    <div className="mt-3 py-1.5 px-3 rounded-xl bg-pink-500/10 border border-pink-200 dark:border-pink-900/40 text-xs text-pink-700 dark:text-pink-300 flex items-center justify-between">
                      <span className="font-medium flex items-center gap-1.5">
                        <Cake className="w-3.5 h-3.5" />
                        {bInfo.isToday
                          ? "Aniversário HOJE! 🎈"
                          : `Aniversário em ${bInfo.daysUntil} dias (${bInfo.formattedDayMonth})`}
                      </span>
                      {bInfo.age !== null && (
                        <span className="text-[10px] font-semibold uppercase bg-pink-200/60 dark:bg-pink-900/60 px-1.5 py-0.5 rounded">
                          {bInfo.age} anos
                        </span>
                      )}
                    </div>
                  )}

                  {/* ALERTA DE RESTRIÇÃO ALIMENTAR */}
                  {customer.preferences?.dietaryRestrictions &&
                    customer.preferences.dietaryRestrictions.length > 0 && (
                      <div className="mt-2.5 flex items-center gap-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Restrições:
                        </span>
                        {customer.preferences.dietaryRestrictions.map((res) => (
                          <Badge
                            key={res}
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 h-4 border-red-200 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-medium"
                          >
                            {res}
                          </Badge>
                        ))}
                      </div>
                    )}
                </div>

                {/* MÉTRICAS CHAVE DO CLIENTE */}
                <div className="bg-muted/40 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                      Visitas
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {customer.metrics.totalVisits}
                    </span>
                    <span className="block text-[10px] text-muted-foreground truncate">
                      {customer.metrics.visitFrequency}
                    </span>
                  </div>

                  <div className="border-x border-border/50 px-1">
                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                      Ticket Médio
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {formatBRL(customer.metrics.averageTicket)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">por visita</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">
                      Gasto Total
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatBRL(customer.metrics.totalSpent)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">acumulado</span>
                  </div>
                </div>

                {/* PREFERÊNCIAS & STATUS DE RETORNO */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Última visita:
                    </span>
                    <span
                      className={`font-medium ${
                        isAtRisk
                          ? "text-amber-600 dark:text-amber-400 font-semibold"
                          : "text-foreground"
                      }`}
                    >
                      {customer.metrics.daysSinceLastVisit !== null
                        ? customer.metrics.daysSinceLastVisit === 0
                          ? "Hoje"
                          : customer.metrics.daysSinceLastVisit === 1
                            ? "Ontem"
                            : `Há ${customer.metrics.daysSinceLastVisit} dias`
                        : "Nenhuma registrada"}
                    </span>
                  </div>

                  {customer.preferences?.tableLocation && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        Ambiente favorito:
                      </span>
                      <span className="font-medium text-foreground">
                        {customer.preferences.tableLocation}
                      </span>
                    </div>
                  )}

                  {customer.preferences?.favoriteDishes &&
                    customer.preferences.favoriteDishes.length > 0 && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5" />
                          Prato predileto:
                        </span>
                        <span className="font-medium text-foreground truncate max-w-[150px]">
                          {customer.preferences.favoriteDishes[0]}
                        </span>
                      </div>
                    )}
                </div>

                {/* BOTÃO DE AÇÃO: VER PERFIL COMPLETO 360° */}
                <div className="pt-2 border-t flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold justify-between h-9 rounded-xl hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                    onClick={() => setViewingCustomer(customer)}
                  >
                    <span>Ver Perfil 360° &amp; Consumo</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 360° DE DETALHES COMPLETOS DO CLIENTE */}
      <Dialog open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
        {viewingCustomer && (
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-2xl font-bold text-foreground">
                      {viewingCustomer.name}
                    </DialogTitle>
                    <Badge
                      variant="secondary"
                      className={
                        viewingCustomer.status === "vip"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : viewingCustomer.status === "frequente"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                      }
                    >
                      {viewingCustomer.status.toUpperCase()}
                    </Badge>
                  </div>
                  <DialogDescription className="mt-1">
                    Perfil comportamental, hábitos de consumo e histórico de comandas.
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    onClick={() => handleOpenWhatsApp(viewingCustomer)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5"
                    onClick={() => {
                      const c = viewingCustomer;
                      setViewingCustomer(null);
                      handleOpenEditCustomer(c);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* CARTÃO RESUMO DE MÉTRICAS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 border rounded-xl p-4 text-center">
                <div>
                  <span className="text-[11px] uppercase font-semibold text-muted-foreground block">
                    Gasto Total
                  </span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatBRL(viewingCustomer.metrics.totalSpent)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-semibold text-muted-foreground block">
                    Ticket Médio
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {formatBRL(viewingCustomer.metrics.averageTicket)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-semibold text-muted-foreground block">
                    Total Visitas
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {viewingCustomer.metrics.totalVisits}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-semibold text-muted-foreground block">
                    Maior Conta
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {formatBRL(viewingCustomer.metrics.maxTicket)}
                  </span>
                </div>
              </div>

              {/* SEÇÃO: INFORMAÇÕES PESSOAIS & CONTATO */}
              <div className="border rounded-xl p-4 space-y-3 bg-card">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  Dados Cadastrais &amp; Contato
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Telefone / WhatsApp:</span>
                    <span className="font-medium text-foreground">{viewingCustomer.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">E-mail:</span>
                    <span className="font-medium text-foreground">
                      {viewingCustomer.email || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">CPF / Documento:</span>
                    <span className="font-medium text-foreground">
                      {viewingCustomer.document || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Data de Nascimento:</span>
                    <span className="font-medium text-foreground">
                      {viewingCustomer.birthdate
                        ? `${formatDateBR(new Date(viewingCustomer.birthdate).getTime() + 86400000)} (${getCustomerBirthdayInfo(viewingCustomer).age || ""} anos)`
                        : "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Frequência Estimada:</span>
                    <span className="font-medium text-foreground">
                      {viewingCustomer.metrics.visitFrequency}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Última Visita:</span>
                    <span className="font-medium text-foreground">
                      {viewingCustomer.metrics.lastVisitDate
                        ? formatDateBR(viewingCustomer.metrics.lastVisitDate)
                        : "Nenhuma registrada"}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {viewingCustomer.tags.length > 0 && (
                  <div className="pt-2 border-t flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-1">Tags:</span>
                    {viewingCustomer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Notas de Atendimento */}
                {viewingCustomer.notes && (
                  <div className="pt-2 border-t text-xs">
                    <span className="text-muted-foreground block font-medium mb-1">
                      Observações da Equipe / Preferências especiais:
                    </span>
                    <p className="bg-muted/40 p-2.5 rounded-lg text-foreground italic">
                      "{viewingCustomer.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* SEÇÃO: PREFERÊNCIAS GASTRONÔMICAS & CONSUMO */}
              <div className="border rounded-xl p-4 space-y-4 bg-card">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                  <Utensils className="w-4 h-4 text-primary" />
                  Preferências Gastronômicas &amp; Hábitos de Consumo
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Restrições Alimentares */}
                  <div className="p-3 rounded-xl bg-muted/30 border space-y-1.5">
                    <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Alergias &amp; Restrições Alimentares:
                    </span>
                    {viewingCustomer.preferences?.dietaryRestrictions &&
                    viewingCustomer.preferences.dietaryRestrictions.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {viewingCustomer.preferences.dietaryRestrictions.map((res) => (
                          <Badge
                            key={res}
                            className="bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200"
                          >
                            {res}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma restrição registrada.</p>
                    )}
                  </div>

                  {/* Mesa e Ambiente Predileto */}
                  <div className="p-3 rounded-xl bg-muted/30 border space-y-1.5">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      Mesa &amp; Ambiente de Preferência:
                    </span>
                    <p className="text-foreground font-medium">
                      {viewingCustomer.preferences?.tableLocation ||
                        "Não especificado (sem preferência)"}
                    </p>
                    {viewingCustomer.preferences?.cookingPreference && (
                      <p className="text-muted-foreground text-[11px] mt-1">
                        Ponto da Carne:{" "}
                        <span className="font-medium text-foreground">
                          {viewingCustomer.preferences.cookingPreference}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bebidas e Pratos Favoritos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                      <Wine className="w-3.5 h-3.5 text-primary" />
                      Bebidas Prediletas:
                    </span>
                    {viewingCustomer.preferences?.favoriteDrinks &&
                    viewingCustomer.preferences.favoriteDrinks.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                        {viewingCustomer.preferences.favoriteDrinks.map((b) => (
                          <li key={b} className="text-foreground font-medium">
                            {b}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma bebida cadastrada.</p>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                      <Utensils className="w-3.5 h-3.5 text-primary" />
                      Pratos Favoritos:
                    </span>
                    {viewingCustomer.preferences?.favoriteDishes &&
                    viewingCustomer.preferences.favoriteDishes.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                        {viewingCustomer.preferences.favoriteDishes.map((p) => (
                          <li key={p} className="text-foreground font-medium">
                            {p}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">Nenhum prato cadastrado.</p>
                    )}
                  </div>
                </div>

                {/* Top Itens Mais Pedidos */}
                {viewingCustomer.topItems && viewingCustomer.topItems.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <span className="text-xs font-semibold text-foreground block">
                      Itens Mais Consumidos nas Visitas (Ranking):
                    </span>
                    <div className="space-y-2">
                      {viewingCustomer.topItems.slice(0, 4).map((item) => (
                        <div key={item.productName} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-foreground">
                              {item.productName} ({item.quantity}x)
                            </span>
                            <span className="text-muted-foreground">
                              {formatBRL(item.totalRevenue)}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(
                              100,
                              (item.totalRevenue / (viewingCustomer.metrics.totalSpent || 1)) * 100,
                            )}
                            className="h-1.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO: HISTÓRICO DE VISITAS & COMANDAS */}
              <div className="border rounded-xl p-4 space-y-3 bg-card">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                    <History className="w-4 h-4 text-primary" />
                    Histórico de Visitas &amp; Comandas ({viewingCustomer.visits.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setIsAddVisitOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Visita
                  </Button>
                </div>

                {viewingCustomer.visits.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Nenhuma visita registrada ainda. As visitas são vinculadas automaticamente
                    quando uma comanda com o nome deste cliente é finalizada no caixa.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {viewingCustomer.visits.map((v) => (
                      <div
                        key={v.id}
                        className="border rounded-lg p-3 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">
                              {v.orderCode ? `Comanda ${v.orderCode}` : "Visita Presencial"}
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0 px-1 h-4">
                              Mesa {v.table}
                            </Badge>
                            <span className="text-muted-foreground">• {formatDateBR(v.date)}</span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">
                            {v.itemsSummary || "Consumo no salão"}
                          </p>
                          {v.notes && (
                            <p className="text-[11px] text-muted-foreground italic">
                              Obs: {v.notes}
                            </p>
                          )}
                        </div>

                        <div className="text-right sm:shrink-0">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                            {formatBRL(v.amount)}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {v.paymentMethod?.replace("_", " ") || "Pagamento"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200"
                onClick={() => handleDeleteCustomer(viewingCustomer)}
              >
                Excluir Cliente
              </Button>
              <Button onClick={() => setViewingCustomer(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* MODAL DE CADASTRO / EDIÇÃO DE CLIENTE */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {editingCustomer ? `Editar Cliente: ${editingCustomer.name}` : "Novo Cliente no CRM"}
            </DialogTitle>
            <DialogDescription>
              Cadastre preferências de consumo, restrições alimentares e dados para contato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* DADOS BÁSICOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cust-name">Nome Completo *</Label>
                <Input
                  id="cust-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Dra. Juliana Menezes"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">WhatsApp / Telefone *</Label>
                <Input
                  id="cust-phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-email">E-mail</Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Ex: juliana@email.com"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-birthdate">Data de Nascimento (Aniversário)</Label>
                <Input
                  id="cust-birthdate"
                  type="date"
                  value={formBirthdate}
                  onChange={(e) => setFormBirthdate(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-document">CPF (Para Notas Fiscais)</Label>
                <Input
                  id="cust-document"
                  value={formDocument}
                  onChange={(e) => setFormDocument(e.target.value)}
                  placeholder="Ex: 123.456.789-00"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-status">Classificação / Categoria</Label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setFormStatus(val as CustomerStatus)}
                >
                  <SelectTrigger id="cust-status" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padrao">Padrão</SelectItem>
                    <SelectItem value="frequente">Frequente (Fiel)</SelectItem>
                    <SelectItem value="vip">VIP (Destaque)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-tags">Tags de Segmentação</Label>
                <Input
                  id="cust-tags"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Ex: VIP, Família, Varanda, Corporativo"
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* PREFERÊNCIAS & GASTRONOMIA */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-primary" />
                Preferências de Consumo &amp; Atendimento
              </h4>

              <div className="space-y-2">
                <Label>Restrições Alimentares / Alergias</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DIETARY_RESTRICTIONS.map((res) => {
                    const isSelected = formDietary.includes(res);
                    return (
                      <button
                        key={res}
                        type="button"
                        onClick={() => toggleDietaryTag(res)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-red-500 text-white border-red-500 font-semibold"
                            : "bg-muted/40 hover:bg-muted text-foreground border-border"
                        }`}
                      >
                        {res}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cust-location">Local / Mesa de Preferência</Label>
                  <Select value={formTableLocation} onValueChange={setFormTableLocation}>
                    <SelectTrigger id="cust-location" className="rounded-xl">
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem preferência fixa</SelectItem>
                      {TABLE_LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cust-cooking">Ponto da Carne Preferido</Label>
                  <Input
                    id="cust-cooking"
                    value={formCookingPreference}
                    onChange={(e) => setFormCookingPreference(e.target.value)}
                    placeholder="Ex: Ao ponto para mal passada"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cust-drinks">Bebidas Prediletas</Label>
                  <Input
                    id="cust-drinks"
                    value={formDrinks}
                    onChange={(e) => setFormDrinks(e.target.value)}
                    placeholder="Ex: Chopp IPA, Vinho Tinto Malbec"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cust-dishes">Pratos Favoritos</Label>
                  <Input
                    id="cust-dishes"
                    value={formDishes}
                    onChange={(e) => setFormDishes(e.target.value)}
                    placeholder="Ex: Picanha na chapa, Risoto de Funghi"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-notes">Observações do Garçom / Equipe</Label>
                <Textarea
                  id="cust-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Gosta de atendimento rápido, costuma pedir gelo e limão à parte, traz convidados de negócios às sextas..."
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCustomer}>
              {editingCustomer ? "Salvar Alterações" : "Cadastrar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ENVIO RÁPIDO VIA WHATSAPP */}
      <Dialog open={!!whatsappCustomer} onOpenChange={(open) => !open && setWhatsappCustomer(null)}>
        {whatsappCustomer && (
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Mensagem WhatsApp
                  </DialogTitle>
                  <DialogDescription>
                    Para:{" "}
                    <span className="font-semibold text-foreground">{whatsappCustomer.name}</span> (
                    {whatsappCustomer.phone})
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Modelo de Mensagem Rápida</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    type="button"
                    variant={whatsappTemplate === "aniversario" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setWhatsappTemplate("aniversario");
                      setCustomMessage(
                        `Olá, ${whatsappCustomer.name}! 🎉 A equipe do Keep Serv deseja a você um Feliz Aniversário! Como cortesia especial, reservamos uma sobremesa artesanal para você na sua próxima visita este mês. Esperamos você! 🎂✨`,
                      );
                    }}
                  >
                    🎂 Aniversário
                  </Button>
                  <Button
                    type="button"
                    variant={whatsappTemplate === "saudade" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setWhatsappTemplate("saudade");
                      setCustomMessage(
                        `Olá, ${whatsappCustomer.name}! Sentimos sua falta aqui no Keep Serv. Temos novos pratos no cardápio neste mês! Que tal vir nos visitar neste fim de semana? 🍷🥩`,
                      );
                    }}
                  >
                    👋 Retorno
                  </Button>
                  <Button
                    type="button"
                    variant={whatsappTemplate === "reserva" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setWhatsappTemplate("reserva");
                      setCustomMessage(
                        `Olá, ${whatsappCustomer.name}! Sua mesa de preferência no Keep Serv está disponível para você e sua família. Deseja fazer uma reserva? 🍽️`,
                      );
                    }}
                  >
                    🍽️ Reserva
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wa-text">Texto da Mensagem</Label>
                <Textarea
                  id="wa-text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="rounded-xl resize-none text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setWhatsappCustomer(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendWhatsApp}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <MessageCircle className="w-4 h-4" />
                Abrir no WhatsApp
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* MODAL DE REGISTRO MANUAL DE VISITA */}
      <Dialog open={isAddVisitOpen} onOpenChange={setIsAddVisitOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Registrar Visita Manual
            </DialogTitle>
            <DialogDescription>
              Adiciona um consumo avulso ao histórico de{" "}
              <span className="font-semibold text-foreground">{viewingCustomer?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vst-val">Valor Total (R$) *</Label>
                <Input
                  id="vst-val"
                  value={visitAmount}
                  onChange={(e) => setVisitAmount(e.target.value)}
                  placeholder="Ex: 245.50"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vst-table">Mesa Ocupada</Label>
                <Input
                  id="vst-table"
                  type="number"
                  value={visitTable}
                  onChange={(e) => setVisitTable(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vst-guests">Pessoas na Mesa</Label>
                <Input
                  id="vst-guests"
                  type="number"
                  value={visitGuests}
                  onChange={(e) => setVisitGuests(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vst-pay">Forma de Pagamento</Label>
                <Select value={visitPayment} onValueChange={setVisitPayment}>
                  <SelectTrigger id="vst-pay" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vst-items">Resumo dos Itens Consumidos</Label>
              <Input
                id="vst-items"
                value={visitItems}
                onChange={(e) => setVisitItems(e.target.value)}
                placeholder="Ex: 1x Picanha, 2x Chopp, 1x Pudim"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vst-notes">Observações</Label>
              <Input
                id="vst-notes"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Ex: Comemoração de formatura"
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVisitOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRecordManualVisit}>Salvar Visita</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
