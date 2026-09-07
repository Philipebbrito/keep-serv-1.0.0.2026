import {
  AlertCircle,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Info,
  Minus,
  Pencil,
  Phone,
  Plus,
  QrCode,
  Receipt,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  Utensils,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DigitalMenuView } from "./digital-menu-view";
import type { MenuItem } from "@/lib/keepserv/menu";
import { useKeepServ } from "@/lib/keepserv/store";
import { orderTotal, type Order, type OrderItem, type OrderStatus } from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

interface CustomerBillViewProps {
  orderId?: string;
}

export function CustomerBillView({ orderId }: CustomerBillViewProps) {
  const { orders, now, sendCustomerMessage, setCustomerInfo, createOrder } = useKeepServ();

  // Detecta se a rota ou parâmetro corresponde a uma mesa fixa (ex: "4", "mesa-4", etc.)
  const detectedTableNumber = useMemo(() => {
    if (!orderId) return null;
    const clean = orderId.trim().toLowerCase();
    const match = clean.match(/^(?:mesa-?)?(\d+)$/);
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (n > 0 && n <= 100) return n;
    }
    return null;
  }, [orderId]);

  // Localiza a comanda pelo ID, código (#1041 ou 1041) ou número de mesa ativa
  const order = useMemo(() => {
    if (!orderId) return null;
    const cleanId = orderId.trim();

    // Se o identificador for um número de mesa, busca primeiro comanda ativa não-paga
    if (detectedTableNumber !== null) {
      const activeTableOrder = orders.find(
        (o) => o.table === detectedTableNumber && o.status !== "pago",
      );
      if (activeTableOrder) return activeTableOrder;
    }

    return (
      orders.find((o) => o.id === cleanId) ||
      orders.find((o) => o.code.replace("#", "") === cleanId.replace("#", "")) ||
      (detectedTableNumber !== null ? orders.find((o) => o.table === detectedTableNumber) : null) ||
      null
    );
  }, [orders, orderId, detectedTableNumber]);

  // Alternador de visualização entre Comanda e Cardápio Digital
  const [activeTab, setActiveTab] = useState<"comanda" | "cardapio">("comanda");

  // Controles de detalhamento financeiro
  const [includeService, setIncludeService] = useState(true);
  const [includeCouvert, setIncludeCouvert] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>("");
  const [copiedPix, setCopiedPix] = useState(false);
  const [callStaffOpen, setCallStaffOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState("");

  // Estados para identificação temporária e cadastro de telefone
  const [customNameModalOpen, setCustomNameModalOpen] = useState(false);
  const [inputName, setInputName] = useState("");
  const [inputPhone, setInputPhone] = useState("");
  const [wantRegister, setWantRegister] = useState(true);

  // Sincroniza formulário quando a comanda for carregada
  useEffect(() => {
    if (order) {
      setInputName(order.customerName || "");
      setInputPhone(order.customerPhone || "");
      setWantRegister(order.customerRegistered ?? true);
    }
  }, [order]);

  const handleSaveCustomerInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (order.status === "pago") {
      toast.error("Comanda finalizada", {
        description:
          "Esta comanda já foi fechada no caixa e não permite mais alterações temporárias.",
      });
      return;
    }

    const trimmedName = inputName.trim();
    if (!trimmedName) {
      toast.error("Por favor, digite seu nome ou como gostaria de ser chamado.");
      return;
    }

    const trimmedPhone = inputPhone.trim();

    setCustomerInfo(order.id, {
      name: trimmedName,
      phone: trimmedPhone || undefined,
      register: wantRegister,
    });

    toast.success("Comanda personalizada com sucesso!", {
      description: `Sua mesa agora está identificada como "${trimmedName}" para toda a equipe.`,
    });

    if (trimmedPhone && wantRegister) {
      toast.info("Cadastro no sistema salvo!", {
        description: "Seu número foi registrado no Clube KeepServ para pontuação e promoções.",
      });
    }

    setCustomNameModalOpen(false);
  };

  const handleRemoveCustomerInfo = () => {
    if (!order) return;
    if (order.status === "pago") return;

    setCustomerInfo(order.id, {
      name: "",
      phone: "",
      register: false,
    });

    toast.info("Identificação da comanda removida", {
      description: "A mesa voltou à identificação padrão.",
    });

    setInputName("");
    setInputPhone("");
    setCustomNameModalOpen(false);
  };

  // Sincroniza contagem de pessoas com a comanda quando carregar
  useEffect(() => {
    if (order && order.guests > 0) {
      setSplitCount(order.guests);
    }
  }, [order]);

  // Cálculos financeiros
  const subtotal = order ? orderTotal(order) : 0;
  const serviceFee = subtotal * 0.1;
  const couvertPerPerson = 8.5; // R$ 8,50 opcional
  const totalCouvert = includeCouvert && order ? couvertPerPerson * Math.max(1, order.guests) : 0;

  const totalPayable = subtotal + (includeService ? serviceFee : 0) + totalCouvert;
  const totalPerPerson = totalPayable / Math.max(1, splitCount);

  // Geração da Chave e QR Code Pix Dinâmico para a Comanda
  const pixKey = "financeiro@keepserv.com.br";
  const pixPayload = order
    ? `00020126580014BR.GOV.BCB.PIX0136${pixKey}520400005303986540${totalPayable.toFixed(2)}5802BR5919KEEPSERV RESTAURANTE6009SAO PAULO62070503***6304`
    : "";

  useEffect(() => {
    if (pixPayload) {
      QRCode.toDataURL(pixPayload, {
        width: 280,
        margin: 1.5,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then(setPixQrDataUrl)
        .catch(console.error);
    }
  }, [pixPayload, totalPayable]);

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload || pixKey);
      setCopiedPix(true);
      toast.success("Código Pix Copia e Cola copiado!", {
        description: "Abra o aplicativo do seu banco para colar e pagar.",
      });
      setTimeout(() => setCopiedPix(false), 2500);
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  };

  const handleCallWaiter = (reason: string) => {
    if (!order) return;
    sendCustomerMessage(order.id, `🔔 ${reason}`);
    toast.success("Garçom notificado!", {
      description: `O atendente ${order.waiter} foi avisado na Mesa ${order.table}.`,
    });
    setCallStaffOpen(false);
    setCustomMsg("");
  };

  const handleAskItemFromMenu = (item: MenuItem, note?: string) => {
    if (order) {
      const text = note
        ? `🍽️ Pedido do cliente: 1x ${item.name} (${note})`
        : `🍽️ Pedido do cliente: 1x ${item.name}`;
      sendCustomerMessage(order.id, text);
      toast.success(`Pedido de "${item.name}" enviado!`, {
        description: `O atendente ${order.waiter} foi avisado para incluir na comanda da Mesa ${order.table}.`,
      });
      setActiveTab("comanda");
    } else if (detectedTableNumber !== null) {
      createOrder({
        table: detectedTableNumber,
        guests: 1,
        customerName: inputName.trim() || undefined,
        customerPhone: inputPhone.trim() || undefined,
        customerRegistered: wantRegister,
        notes: "Pedido iniciado pelo cliente via Cardápio Digital (QR Code Fixo)",
        items: [
          {
            name: item.name,
            qty: 1,
            price: item.price,
            category: item.category,
            note,
          },
        ],
      });
      toast.success(`Comanda da Mesa ${detectedTableNumber} aberta!`, {
        description: `Item "${item.name}" incluído. A equipe foi notificada.`,
      });
      setActiveTab("comanda");
    }
  };

  const handleStartOrderWithMultipleItems = (
    itemsList: { item: MenuItem; qty: number; note?: string }[],
  ) => {
    if (itemsList.length === 0) return;
    if (order) {
      itemsList.forEach(({ item, qty, note }) => {
        const text = `🍽️ Pedido do cliente: ${qty}x ${item.name}${note ? ` (${note})` : ""}`;
        sendCustomerMessage(order.id, text);
      });
      toast.success("Pedidos enviados ao garçom!", {
        description: `A equipe da Mesa ${order.table} foi avisada para adicionar à sua comanda.`,
      });
      setActiveTab("comanda");
    } else if (detectedTableNumber !== null) {
      createOrder({
        table: detectedTableNumber,
        guests: 1,
        customerName: inputName.trim() || undefined,
        customerPhone: inputPhone.trim() || undefined,
        customerRegistered: wantRegister,
        notes: "Pedido iniciado pelo cliente via Cardápio Digital (QR Code Fixo)",
        items: itemsList.map(({ item, qty, note }) => ({
          name: item.name,
          qty,
          price: item.price,
          category: item.category,
          note,
        })),
      });
      toast.success("Comanda aberta com sucesso!", {
        description: `Mesa ${detectedTableNumber} aberta com ${itemsList.length} itens pedidos.`,
      });
      setActiveTab("comanda");
    }
  };

  const handleCallWaiterForTable = () => {
    if (detectedTableNumber === null) return;
    createOrder({
      table: detectedTableNumber,
      guests: 1,
      customerName: inputName.trim() || undefined,
      customerPhone: inputPhone.trim() || undefined,
      customerRegistered: wantRegister,
      notes: "Atendente chamado pelo cliente via QR Code Fixo da Mesa",
      items: [],
    });
    toast.success(`Garçom chamado para a Mesa ${detectedTableNumber}!`, {
      description: "Sua mesa foi aberta no sistema e um atendente virá atendê-lo.",
    });
  };

  // Se não há comanda aberta, mas o link é o QR Code Fixo de uma mesa (ex: /mesa/4 ou /c/4)
  if (!order && detectedTableNumber !== null) {
    return (
      <div className="min-h-screen bg-background pb-24 text-foreground">
        {/* Cabeçalho Fixo da Mesa */}
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary block">
                KEEPSERV BISTRÔ & BAR
              </span>
              <h1 className="font-display font-black text-lg text-foreground flex items-center gap-2 mt-0.5">
                Mesa {detectedTableNumber}
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-primary/40 text-primary"
                >
                  QR Code Fixo
                </Badge>
              </h1>
            </div>

            <Button
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
              onClick={handleCallWaiterForTable}
            >
              <Bell className="size-3.5" />
              <span>Chamar Garçom</span>
            </Button>
          </div>

          <div className="bg-muted/40 px-3 sm:px-4 py-1.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between max-w-4xl mx-auto">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Mesa pronta para atendimento
            </span>
            <span className="font-medium text-foreground">Área do Cliente</span>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 space-y-4">
          {/* Card de Identificação Opcional do Cliente */}
          <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-foreground">Identificar sua Mesa</h3>
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    100% Opcional
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Adicionar seus dados é opcional. Você pode informar seu nome e telefone para
                  agilizar o atendimento ou acumular pontos de fidelidade.
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Seu Nome ou Apelido (Opcional):
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: João, Família Silva, Dra. Camila..."
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Telefone Celular / WhatsApp (Opcional):
                    </label>
                    <Input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(formatPhone(e.target.value))}
                      className="h-9 text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2.5">
                  <Checkbox
                    id="opt-register-table"
                    checked={wantRegister}
                    onCheckedChange={(c) => setWantRegister(!!c)}
                    className="rounded-md"
                  />
                  <label
                    htmlFor="opt-register-table"
                    className="text-xs text-muted-foreground font-medium cursor-pointer select-none"
                  >
                    Cadastrar no Clube KeepServ para pontuação e promoções (Opcional)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Cardápio Digital Interativo */}
          <DigitalMenuView
            tableNumber={detectedTableNumber}
            onAskItem={handleAskItemFromMenu}
            onStartOrderWithItems={handleStartOrderWithMultipleItems}
          />
        </main>
      </div>
    );
  }

  // Se comanda não encontrada e não é uma mesa válida
  if (!order) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
            <Receipt className="size-8" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Comanda não encontrada</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Não encontramos uma comanda aberta com o identificador{" "}
            <span className="font-mono font-semibold text-foreground">"{orderId}"</span>.
          </p>
          <div className="mt-6 p-3 rounded-xl bg-muted/50 border border-border/80 text-xs text-muted-foreground text-left">
            <p className="font-medium text-foreground mb-1">Como consultar:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Peça ao garçom o QR Code atualizado da sua mesa.</li>
              <li>Certifique-se de que a comanda da sua mesa já foi iniciada pelo atendente.</li>
            </ul>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Button className="w-full text-xs h-10" onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full text-xs h-9"
                onClick={() => {
                  window.location.href = "/cliente";
                }}
              >
                Área do Cliente
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs h-9"
                onClick={() => {
                  window.location.href = "/cardapio";
                }}
              >
                Ver Cardápio
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determinação do status individual inteligente de cada prato
  const getItemStatus = (item: OrderItem, orderStatus: OrderStatus) => {
    if (item.canceled) {
      return {
        status: "canceled",
        label: "Cancelado",
        enLabel: "Canceled",
        color: "bg-muted text-muted-foreground line-through border-muted-foreground/30",
        dot: "bg-muted-foreground",
      };
    }
    if (orderStatus === "pago" || orderStatus === "entregue") {
      return {
        status: "delivered",
        label: "Entregue",
        enLabel: "Delivered",
        color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        dot: "bg-emerald-500",
      };
    }
    if (orderStatus === "pronto") {
      return {
        status: "delivered",
        label: "Pronto / Entregue",
        enLabel: "Delivered",
        color:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 animate-pulse",
        dot: "bg-emerald-500",
      };
    }
    if (orderStatus === "preparo") {
      // Bebidas costumam ser entregues antes dos pratos
      if (item.category === "bebida") {
        return {
          status: "delivered",
          label: "Entregue",
          enLabel: "Delivered",
          color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-500",
        };
      }
      return {
        status: "preparing",
        label: "Em Preparo",
        enLabel: "Preparing",
        color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
        dot: "bg-amber-500",
      };
    }
    // Pendente
    return {
      status: "received",
      label: "Recebido",
      enLabel: "Received",
      color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
      dot: "bg-yellow-500",
    };
  };

  const isPaid = order.status === "pago";

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-primary/20">
      {/* 📱 CABEÇALHO MOBILE-FIRST DO ESTABELECIMENTO */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/95 backdrop-blur shadow-xs">
        <div
          className={cn(
            "mx-auto px-3 sm:px-4 py-3.5 flex items-center justify-between transition-all duration-200",
            activeTab === "cardapio" ? "max-w-4xl" : "max-w-xl",
          )}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                KeepServ Bistrô & Bar
              </span>
            </div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2 mt-0.5 flex-wrap">
              <span>Mesa {order.table}</span>
              {order.customerName && (
                <button
                  type="button"
                  onClick={() => !isPaid && setCustomNameModalOpen(true)}
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 flex items-center gap-1 transition-colors",
                    !isPaid ? "hover:bg-primary/20 cursor-pointer" : "cursor-default opacity-85",
                  )}
                  title={
                    isPaid ? "Comanda encerrada no caixa" : "Clique para alterar nome da comanda"
                  }
                >
                  <User className="size-3" />
                  <span className="truncate max-w-[130px]">{order.customerName}</span>
                  {!isPaid && <Pencil className="size-2.5 opacity-70" />}
                </button>
              )}
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                {order.code}
              </span>
            </h1>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <User className="size-3 text-primary" /> Atendente
            </span>
            <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
              {order.waiter}
            </span>
          </div>
        </div>

        {/* Barra de status ao vivo */}
        <div
          className={cn(
            "bg-muted/40 px-3 sm:px-4 py-1.5 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between mx-auto transition-all duration-200",
            activeTab === "cardapio" ? "max-w-4xl" : "max-w-xl",
          )}
        >
          <span className="flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground" />
            Aberta há {Math.floor((now - order.openedAt) / 60000)} min
          </span>
          <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Atualização em tempo real
          </span>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main
        className={cn(
          "mx-auto px-3 sm:px-4 pt-4 space-y-4 transition-all duration-200",
          activeTab === "cardapio" ? "max-w-4xl" : "max-w-xl",
        )}
      >
        {/* Alternador de Abas: Comanda vs Cardápio Digital */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/70">
          <button
            type="button"
            onClick={() => setActiveTab("comanda")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all",
              activeTab === "comanda"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Receipt className="size-3.5" />
            <span>Sua Comanda ({order.code})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cardapio")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all",
              activeTab === "cardapio"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <UtensilsCrossed className="size-3.5" />
            <span>Cardápio Digital</span>
          </button>
        </div>

        {activeTab === "cardapio" ? (
          <DigitalMenuView
            order={order}
            tableNumber={order.table}
            onAskItem={handleAskItemFromMenu}
            onStartOrderWithItems={handleStartOrderWithMultipleItems}
          />
        ) : (
          <>
            {/* Banner de Comanda Fechada/Paga */}
            {isPaid && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 shadow-sm flex items-start gap-3">
                <div className="size-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {order.customerName
                      ? `Conta de ${order.customerName} Fechada e Paga`
                      : "Conta Fechada e Paga"}
                  </p>
                  <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90 mt-0.5">
                    Esta comanda foi finalizada no caixa. Obrigado pela preferência e volte sempre!
                  </p>
                </div>
              </div>
            )}

            {/* 👤 IDENTIFICAÇÃO TEMPORÁRIA DA COMANDA PELO CLIENTE (Até o fechamento da conta) */}
            {!isPaid ? (
              order.customerName ? (
                /* Cliente já identificou a mesa */
                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 shadow-xs transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
                        <UserCheck className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Comanda Identificada
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-background/80 py-0 h-4 border-primary/30 text-primary"
                          >
                            Mesa {order.table}
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1">
                          {order.customerName}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Identificação ativa temporariamente para a equipe até o fechamento da
                          conta.
                        </p>
                        {order.customerPhone && (
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-mono text-muted-foreground flex items-center gap-1 text-[11px]">
                              <Phone className="size-3 text-primary" /> {order.customerPhone}
                            </span>
                            {order.customerRegistered && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <Sparkles className="size-2.5" /> Cadastro no sistema ativo
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInputName(order.customerName || "");
                        setInputPhone(order.customerPhone || "");
                        setWantRegister(order.customerRegistered ?? true);
                        setCustomNameModalOpen(true);
                      }}
                      className="h-8 text-xs font-medium text-primary hover:text-primary gap-1 px-2.5 shrink-0 rounded-xl border-primary/20 bg-background/80 hover:bg-primary/10"
                    >
                      <Pencil className="size-3" />
                      <span>Alterar</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Convidando o cliente a se identificar temporariamente */
                <div className="rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-card to-background p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <User className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-sm font-bold text-foreground">Identificar sua Mesa</h2>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                          Opcional
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Personalize temporariamente esta comanda com seu nome para agilizar o
                        atendimento dos garçons e informe seu telefone para cadastro de vantagens no
                        restaurante.
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setInputName("");
                            setInputPhone("");
                            setWantRegister(true);
                            setCustomNameModalOpen(true);
                          }}
                          className="h-8 text-xs font-semibold gap-1.5 rounded-xl px-3.5 shadow-xs"
                        >
                          <User className="size-3.5" />
                          <span>Personalizar com meu Nome</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : null}

            {/* 📋 TIMELINE & LISTA DOS ITENS CONSUMIDOS */}
            <section className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Utensils className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Itens Consumidos</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {order.items.filter((i) => !i.canceled).length} itens no total
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs gap-1 px-2.5 rounded-lg"
                    onClick={() => setActiveTab("cardapio")}
                  >
                    <UtensilsCrossed className="size-3" />
                    <span>Ver Cardápio</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 px-2.5 rounded-lg border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => setCallStaffOpen(true)}
                  >
                    <Bell className="size-3" />
                    <span>Chamar Garçom</span>
                  </Button>
                </div>
              </div>

              {/* Lista de itens com status visual */}
              <div className="divide-y divide-border/50">
                {order.items.map((item) => {
                  const statusInfo = getItemStatus(item, order.status);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "py-3.5 flex flex-col gap-1.5 transition-colors",
                        item.canceled && "opacity-60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="flex size-6 items-center justify-center rounded-md bg-muted font-bold text-xs text-foreground shrink-0 border border-border/60">
                            {item.qty}×
                          </span>
                          <div>
                            <p
                              className={cn(
                                "text-sm font-medium text-foreground",
                                item.canceled && "line-through text-muted-foreground",
                              )}
                            >
                              {item.name}
                            </p>
                            {item.note && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 italic mt-0.5">
                                Obs: "{item.note}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {brl(item.price * item.qty)}
                          </span>
                          {item.qty > 1 && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {brl(item.price)} cada
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Badge colorido de status da entrega */}
                      <div className="flex items-center justify-between pl-8.5 pt-0.5">
                        <span
                          data-status={statusInfo.status}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors",
                            statusInfo.color,
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full shrink-0", statusInfo.dot)} />
                          <span>{statusInfo.label}</span>
                          <span className="text-[10px] font-medium opacity-75">
                            ({statusInfo.enLabel})
                          </span>
                        </span>

                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 💵 DETALHAMENTO FINANCEIRO TRANSPARENTE */}
            <section className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Receipt className="size-4 text-primary" />
                <span>Detalhamento da Conta</span>
              </h2>

              <div className="space-y-2.5 text-xs">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-medium text-foreground">Subtotal dos itens</span>
                  <span
                    id="bill-subtotal"
                    className="font-mono text-foreground font-semibold text-sm tabular-nums"
                  >
                    {brl(subtotal)}
                  </span>
                </div>

                {/* Couvert artístico opcional */}
                <div className="flex items-center justify-between py-1 border-y border-border/40">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground flex items-center gap-1">
                      Couvert Artístico
                      <span className="text-[10px] text-muted-foreground">
                        ({brl(couvertPerPerson)} / pessoa)
                      </span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Música ao vivo no salão
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {includeCouvert && (
                      <span className="font-mono font-medium text-foreground">
                        {brl(totalCouvert)}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant={includeCouvert ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-6 text-[10px] px-2 rounded-md font-semibold",
                        includeCouvert && "bg-primary text-primary-foreground",
                      )}
                      onClick={() => setIncludeCouvert(!includeCouvert)}
                    >
                      {includeCouvert ? "Incluído" : "Adicionar"}
                    </Button>
                  </div>
                </div>

                {/* Taxa de serviço (10% gorjeta sugerida) com toggle Switch */}
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <div className="flex flex-col">
                    <label
                      htmlFor="service-charge-toggle"
                      className="font-medium text-foreground flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Taxa de Serviço (10% sugerido)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                        Opcional
                      </span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      100% repassado para a equipe de garçons
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {includeService && (
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{brl(serviceFee)}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id="service-charge-toggle"
                        checked={includeService}
                        onCheckedChange={setIncludeService}
                        aria-label="Alternar taxa de serviço de 10%"
                      />
                      <span
                        className={cn(
                          "text-[10px] font-bold w-6 text-center tabular-nums",
                          includeService
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {includeService ? "10%" : "0%"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Geral em Destaque */}
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-medium block">
                      Valor Total a Pagar
                    </span>
                    {!includeService && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400">
                        (Sem a taxa de serviço sugerida)
                      </span>
                    )}
                  </div>
                  <span
                    id="bill-total"
                    className="text-2xl font-bold font-display tabular-nums text-foreground"
                  >
                    {brl(totalPayable)}
                  </span>
                </div>
              </div>
            </section>

            {/* 👥 CALCULADORA INTERATIVA DE DIVISÃO DA CONTA */}
            <section
              id="bill-split-calculator"
              className="rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                    <Users className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Dividir a Conta (Bill Splitting)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Calculadora por pessoa / pagante na mesa
                    </p>
                  </div>
                </div>

                {/* Ajuste de pessoas */}
                <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-xl p-1 shadow-2xs">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                    disabled={splitCount <= 1}
                    onClick={() => setSplitCount((c) => Math.max(1, c - 1))}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-8 text-center font-bold text-xs tabular-nums text-foreground">
                    {splitCount}x
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={() => setSplitCount((c) => c + 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Atalhos rápidos de pessoas */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1">
                  Atalhos:
                </span>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSplitCount(num)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border",
                      splitCount === num
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card text-muted-foreground border-border/70 hover:text-foreground",
                    )}
                  >
                    {num} {num === 1 ? "pessoa" : "pessoas"}
                  </button>
                ))}
              </div>

              {/* Exibição do valor por pessoa */}
              <div className="rounded-xl border border-primary/30 bg-card p-3 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Valor para cada um pagar:
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Total dividido igualmente em {splitCount} {splitCount > 1 ? "partes" : "parte"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-display text-primary tabular-nums">
                    {brl(totalPerPerson)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">por pessoa</span>
                </div>
              </div>
            </section>

            {/* ⚡ AÇÕES DE PAGAMENTO RÁPIDO & PIX */}
            <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Wallet className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Pagamento Rápido</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Consulte a Chave Pix ou solicite a maquininha
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className="h-10 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  onClick={() => setPixModalOpen(true)}
                >
                  <QrCode className="size-4" />
                  <span>Pagar via Pix</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10 text-xs font-semibold gap-1.5 border-border hover:bg-muted/50"
                  onClick={() => handleCallWaiter("Pedir a Maquininha de Cartão (Crédito/Débito)")}
                >
                  <Receipt className="size-4 text-primary" />
                  <span>Pedir Maquininha</span>
                </Button>
              </div>
            </section>

            {/* Rodapé institucional */}
            <div className="text-center pt-2 pb-6 space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">KeepServ Restaurante & Bar</p>
              <p className="text-[11px]">Sistema de Gestão e Atendimento em Tempo Real</p>
              <p className="text-[10px] text-muted-foreground/80">
                Dúvidas no fechamento? Chame o garçom {order.waiter} a qualquer momento.
              </p>
            </div>
          </>
        )}
      </main>

      {/* 💳 MODAL DO QR CODE PIX & CHAVE COPIA E COLA */}
      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden sm:rounded-2xl border-border bg-card">
          <DialogHeader className="p-4 pb-2 border-b border-border bg-muted/30">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <span className="size-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <QrCode className="size-4" />
              </span>
              Pagamento via Pix
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mesa {order.table} · Valor total:{" "}
              <span className="font-bold text-foreground">{brl(totalPayable)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 flex flex-col items-center text-center space-y-3">
            {/* QR Code Pix gerado */}
            <div className="rounded-2xl border-2 border-emerald-500/30 p-3 bg-white shadow-md flex items-center justify-center">
              {pixQrDataUrl ? (
                <img src={pixQrDataUrl} alt="QR Code Pix" className="size-48 object-contain" />
              ) : (
                <div className="size-48 flex items-center justify-center text-muted-foreground">
                  Gerando QR Code...
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Escaneie o QR Code no app do seu banco ou use a chave abaixo:
            </p>

            {/* Chave Pix e Copia e Cola */}
            <div className="w-full space-y-1.5 text-left">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                Código Pix Copia e Cola:
              </span>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1.5">
                <input
                  type="text"
                  readOnly
                  value={pixPayload}
                  className="flex-1 bg-transparent px-2 text-xs font-mono text-muted-foreground truncate outline-none select-all"
                />
                <Button
                  type="button"
                  size="sm"
                  variant={copiedPix ? "default" : "secondary"}
                  className="h-7 px-2.5 text-xs gap-1 shrink-0"
                  onClick={handleCopyPix}
                >
                  {copiedPix ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{copiedPix ? "Copiado!" : "Copiar"}</span>
                </Button>
              </div>
            </div>

            <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-left text-[11px] text-amber-800 dark:text-amber-300">
              <p className="font-semibold flex items-center gap-1">
                <Info className="size-3.5 shrink-0" /> Aviso importante
              </p>
              <p className="mt-0.5 text-[10px]">
                Após efetuar o Pix, avise o atendente {order.waiter} para confirmação e baixa da
                comanda no caixa.
              </p>
            </div>
          </div>

          <div className="p-3 border-t border-border bg-muted/20 flex gap-2">
            <Button
              type="button"
              className="w-full text-xs h-9"
              onClick={() => setPixModalOpen(false)}
            >
              Concluir / Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔔 MODAL PARA CHAMAR GARÇOM / SUPORTE */}
      <Dialog open={callStaffOpen} onOpenChange={setCallStaffOpen}>
        <DialogContent className="max-w-sm p-4 sm:rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Bell className="size-4 text-primary" /> Chamar Atendente
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Seu pedido será enviado instantaneamente para a tela do garçom {order.waiter}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-xs h-9 hover:bg-primary/5 hover:border-primary/40"
              onClick={() => handleCallWaiter("Cliente solicita atendimento na mesa")}
            >
              🙋‍♂️ Preciso de atendimento na mesa
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-xs h-9 hover:bg-primary/5 hover:border-primary/40"
              onClick={() => handleCallWaiter("Cliente solicitou fechamento da conta na mesa")}
            >
              🧾 Gostaria de fechar a conta
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-xs h-9 hover:bg-primary/5 hover:border-primary/40"
              onClick={() => handleCallWaiter("Cliente pede mais guardanapos / gelo")}
            >
              🧊 Mais guardanapos / gelo
            </Button>

            <div className="pt-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Ou digite uma mensagem:
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ex: Pode trazer a sobremesa?"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                />
                <Button
                  type="button"
                  size="sm"
                  className="text-xs h-8 px-3"
                  disabled={!customMsg.trim()}
                  onClick={() => handleCallWaiter(customMsg.trim())}
                >
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 👤 MODAL PARA PERSONALIZAR NOME DA COMANDA E ADICIONAR TELEFONE PARA CADASTRO */}
      <Dialog open={customNameModalOpen} onOpenChange={setCustomNameModalOpen}>
        <DialogContent className="max-w-sm p-5 sm:rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <User className="size-4 text-primary" />
              {order.customerName
                ? "Editar Identificação da Mesa"
                : "Personalizar Comanda com seu Nome"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Personalize temporariamente a comanda da Mesa {order.table} até o fechamento da conta
              para facilitar o atendimento da equipe.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCustomerInfo} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label
                htmlFor="customer-name-field"
                className="text-xs font-semibold text-foreground flex items-center justify-between"
              >
                <span>Seu Nome ou Como Gostaria de ser Chamado *</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Visível para o garçom
                </span>
              </label>
              <Input
                id="customer-name-field"
                type="text"
                placeholder="Ex: Carlos Silva, Família Santos..."
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                maxLength={45}
                required
                autoFocus
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="customer-phone-field"
                className="text-xs font-semibold text-foreground flex items-center justify-between"
              >
                <span>Número de Telefone / WhatsApp</span>
                <span className="text-[10px] text-muted-foreground font-normal">Opcional</span>
              </label>
              <div className="relative">
                <Input
                  id="customer-phone-field"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(formatPhone(e.target.value))}
                  maxLength={15}
                  className="h-9 text-xs rounded-xl pl-8"
                />
                <Phone className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Checkbox de cadastro no sistema */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="customer-register-system"
                  checked={wantRegister}
                  onCheckedChange={(checked) => setWantRegister(!!checked)}
                  className="mt-0.5 rounded-md"
                />
                <label
                  htmlFor="customer-register-system"
                  className="text-xs leading-tight font-medium text-foreground cursor-pointer select-none"
                >
                  Cadastrar no sistema de fidelidade KeepServ
                  <span className="block text-[11px] text-muted-foreground font-normal mt-0.5">
                    Receba confirmações por WhatsApp, promoções de aniversário e acumule pontos
                    nesta e nas próximas visitas.
                  </span>
                </label>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground bg-muted/50 p-2.5 rounded-xl flex items-center gap-2">
              <Clock className="size-3.5 shrink-0 text-primary" />
              <span>
                Esta customização é válida temporariamente até o fechamento da conta desta mesa.
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {order.customerName ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCustomerInfo}
                  className="h-9 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2.5"
                >
                  Remover Nome
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomNameModalOpen(false)}
                  className="h-9 text-xs px-3 rounded-xl"
                >
                  Cancelar
                </Button>
              )}

              <Button
                type="submit"
                size="sm"
                className="h-9 text-xs font-semibold px-4 rounded-xl ml-auto gap-1.5 shadow-xs"
                disabled={!inputName.trim()}
              >
                <Check className="size-3.5" />
                <span>{order.customerName ? "Salvar Alterações" : "Confirmar Identificação"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
