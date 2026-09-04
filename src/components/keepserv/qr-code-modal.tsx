import {
  Check,
  Copy,
  ExternalLink,
  Printer,
  QrCode,
  Share2,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
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
import { orderTotal, type Order } from "@/lib/keepserv/types";
import { cn } from "@/lib/utils";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface QRCodeModalProps {
  order: Order | null;
  onClose: () => void;
}

export function QRCodeModal({ order, onClose }: QRCodeModalProps) {
  const [qrType, setQrType] = useState<"comanda" | "fixed_table">("comanda");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Determina a URL pública da comanda para o cliente ou QR Code Fixo da Mesa
  const customerUrl = order
    ? typeof window !== "undefined"
      ? qrType === "fixed_table"
        ? `${window.location.origin}/mesa/${order.table}`
        : `${window.location.origin}/comanda/${order.id}`
      : qrType === "fixed_table"
        ? `http://localhost:3000/mesa/${order.table}`
        : `http://localhost:3000/comanda/${order.id}`
    : "";

  useEffect(() => {
    if (!customerUrl) {
      setQrDataUrl("");
      return;
    }

    // Gera o QR Code em alta resolução (zero custo de API, gerado 100% offline no cliente)
    QRCode.toDataURL(customerUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: "#09090b", // Slate/Zinc dark
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        console.error("Erro ao gerar QR Code da comanda:", err);
      });
  }, [customerUrl]);

  if (!order) return null;

  const total = orderTotal(order);

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(customerUrl);
      } else {
        const input = document.createElement("input");
        input.value = customerUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      toast.success("Link da comanda copiado!", {
        description: `URL para o cliente da Mesa ${order.table} copiada para a área de transferência.`,
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar o link automaticamente.");
    }
  };

  const handleOpenClientView = () => {
    window.open(customerUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrintSlip = () => {
    toast.success("Enviando QR Code para impressão térmica (80mm)...", {
      description: `Comanda da Mesa ${order.table} pronta para o display de mesa.`,
    });
    window.print();
  };

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden sm:rounded-2xl border-border bg-card">
        {/* Header visual */}
        <DialogHeader className="p-5 pb-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                <QrCode className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  QR Code da Mesa {order.table}
                  <Badge variant="outline" className="text-xs font-mono font-medium">
                    {order.code}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Consulta de comanda em tempo real pelo cliente
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="text-[11px] gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sem custo de API
            </Badge>
          </div>
        </DialogHeader>

        {/* Seletor de Tipo de QR Code */}
        <div className="px-5 pt-3 pb-0">
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/70">
            <button
              type="button"
              onClick={() => setQrType("comanda")}
              className={cn(
                "flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all",
                qrType === "comanda"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Comanda #{order.code}
            </button>
            <button
              type="button"
              onClick={() => setQrType("fixed_table")}
              className={cn(
                "flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all",
                qrType === "fixed_table"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              QR Fixo Mesa {order.table}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
            {qrType === "fixed_table"
              ? "QR Code permanente para display da mesa. Dá acesso direto aos dados da mesa e ao cardápio digital."
              : "QR Code exclusivo desta comanda atual para o cliente acompanhar em tempo real e pagar."}
          </p>
        </div>

        {/* Corpo com QR Code */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Card do QR Code com moldura de escaneamento */}
          <div className="relative group">
            <div className="relative rounded-2xl border-2 border-primary/20 p-4 bg-white shadow-md flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code da Comanda Mesa ${order.table}`}
                  className="size-52 rounded-lg object-contain"
                />
              ) : (
                <div className="size-52 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                  <QrCode className="size-12 stroke-[1.5] mb-2 text-muted-foreground/50" />
                  <span className="text-xs">Gerando QR Code...</span>
                </div>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Smartphone className="size-3.5 text-primary" />
              <span>O cliente aponta a câmera do celular para acompanhar</span>
            </div>
          </div>

          {/* Dados resumidos da mesa */}
          <div className="w-full rounded-xl border border-border/70 bg-muted/30 p-3 text-left">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Mesa
                </span>
                <span className="font-bold text-foreground text-sm">Mesa {order.table}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Atendente
                </span>
                <span className="font-medium text-foreground truncate block">{order.waiter}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Subtotal Atual
                </span>
                <span className="font-mono font-bold text-primary text-sm">{brl(total)}</span>
              </div>
            </div>
          </div>

          {/* Link direto com botão de cópia rápida */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
              <span className="font-medium">Link direto para WhatsApp ou Navegador:</span>
              <span className="text-[11px] text-muted-foreground">Não exige login</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 text-left">
              <input
                type="text"
                readOnly
                value={customerUrl}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-muted-foreground truncate outline-none select-all"
              />
              <Button
                type="button"
                size="sm"
                variant={copied ? "default" : "secondary"}
                className="h-7 px-2.5 text-xs gap-1 shrink-0"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copied ? "Copiado!" : "Copiar"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs gap-1.5 h-9"
            onClick={handlePrintSlip}
            title="Imprimir QR Code para totem ou suporte da mesa"
          >
            <Printer className="size-3.5" />
            <span>Imprimir QR (80mm)</span>
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial text-xs gap-1.5 h-9"
              onClick={handleOpenClientView}
            >
              <ExternalLink className="size-3.5" />
              <span>Ver como Cliente</span>
            </Button>

            <Button
              type="button"
              size="sm"
              className="flex-1 sm:flex-initial text-xs h-9"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </DialogFooter>

        {/* Estilo especial para impressão direta de QR Code de mesa 80mm */}
        <div
          id="print-qrcode-slip"
          className="hidden print:block p-6 text-black bg-white font-mono"
        >
          <div className="text-center pb-3 border-b-2 border-dashed border-black">
            <h2 className="text-xl font-extrabold uppercase tracking-wide">KEEPSERV RESTAURANTE</h2>
            <p className="text-xs mt-1">Acompanhe sua comanda pelo celular</p>
            <p className="text-sm font-bold mt-2">
              MESA {order.table} · COMANDA {order.code}
            </p>
          </div>

          <div className="my-6 flex flex-col items-center justify-center">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code Comanda" className="w-48 h-48 mx-auto" />
            )}
            <p className="text-xs font-bold mt-3 text-center uppercase">
              Aponte a câmera do seu celular
            </p>
            <p className="text-[11px] text-center mt-0.5">
              Consulte pratos, status de entrega e divisão da conta
            </p>
          </div>

          <div className="border-t-2 border-dashed border-black pt-3 text-xs">
            <p className="flex justify-between">
              <span>Atendente:</span>
              <span className="font-bold">{order.waiter}</span>
            </p>
            <p className="flex justify-between mt-1">
              <span>Total no momento:</span>
              <span className="font-bold">{brl(total)}</span>
            </p>
            <p className="text-[10px] text-center mt-4 uppercase">
              KeepServ · Gestão Inteligente de Salão
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
