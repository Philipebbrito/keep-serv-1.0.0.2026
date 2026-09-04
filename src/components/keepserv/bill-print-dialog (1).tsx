import {
  Check,
  Copy,
  Download,
  Printer,
  QrCode,
  Receipt,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useKeepServ } from "@/lib/keepserv/store";
import { orderTotal, type Order } from "@/lib/keepserv/types";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function BillPrintDialog({
  order,
  onClose,
  onPay,
}: {
  order: Order | null;
  onClose: () => void;
  onPay?: (order: Order) => void;
}) {
  const { printBill } = useKeepServ();
  const [copiedPix, setCopiedPix] = useState(false);
  const [includeService, setIncludeService] = useState(true);

  if (!order) return null;

  const subtotal = orderTotal(order);
  const serviceFee = subtotal * 0.1;
  const finalTotal = includeService ? subtotal + serviceFee : subtotal;
  const perPerson = finalTotal / Math.max(1, order.guests);

  const activeItems = order.items.filter((i) => !i.canceled);

  const handlePrint = () => {
    printBill(order.id);
    toast.success(`Pré-conta da Mesa ${order.table} enviada para impressão!`, {
      description: `Comanda ${order.code} · Total ${brl(finalTotal)}`,
    });
    // Simula disparo de impressão do navegador
    window.print();
  };

  const handleCopyPix = () => {
    const pixPayload = `00020126580014BR.GOV.BCB.PIX0136keepserv-restaurante-comanda-${order.code}-mesa-${order.table}520400005303986540${finalTotal.toFixed(2)}5802BR5919KEEPSERV RESTAURANTE6009SAO PAULO62070503***6304`;
    navigator.clipboard?.writeText(pixPayload);
    setCopiedPix(true);
    toast.success("Chave Pix Copia e Cola copiada para a área de transferência!");
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border bg-muted/40 px-6 py-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Printer className="size-4" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg">
                  Imprimir Pré-Conta · Mesa {order.table}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Comanda {order.code} · {order.guests} pessoas · Garçom: {order.waiter}
                  {order.customerName ? ` · Cliente: ${order.customerName}` : ""}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Visualizador de Cupom Térmico (Estilo Impressora Térmica 80mm) */}
        <div className="p-5 bg-muted/30">
          <div
            id="thermal-receipt"
            className="mx-auto w-full max-w-[340px] rounded-lg border border-border/80 bg-white p-5 font-mono text-[11px] leading-relaxed text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
          >
            {/* Cabeçalho do Restaurante */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-400 dark:border-zinc-700">
              <p className="font-sans text-sm font-black tracking-wider uppercase">
                Keep Serv Gastronomia
              </p>
              <p className="text-[10px] text-zinc-500">CNPJ: 43.190.872/0001-90</p>
              <p className="text-[10px] text-zinc-500">Av. Paulista, 1000 - Salão Principal</p>
              <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                --- CONFERÊNCIA DE CONTA ---
              </div>
            </div>

            {/* Metadados da Mesa */}
            <div className="py-2.5 border-b border-dashed border-zinc-400 dark:border-zinc-700 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>COMANDA: {order.code}</span>
                <span className="font-bold">MESA: {order.table}</span>
              </div>
              {order.customerName && (
                <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span>CLIENTE: {order.customerName.toUpperCase()}</span>
                  {order.customerRegistered && (
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400">
                      [FIDELIDADE]
                    </span>
                  )}
                </div>
              )}
              {order.customerPhone && (
                <div className="flex justify-between text-zinc-500">
                  <span>CONTATO:</span>
                  <span>{order.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>ATENDENTE: {order.waiter}</span>
                <span>PESSOAS: {order.guests}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>DATA: {new Date().toLocaleDateString("pt-BR")}</span>
                <span>
                  HORA:{" "}
                  {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            {/* Lista discriminada de itens */}
            <div className="py-3 border-b border-dashed border-zinc-400 dark:border-zinc-700">
              <div className="flex justify-between font-bold text-[10px] uppercase text-zinc-500 pb-1">
                <span>QTD ITEM</span>
                <span>TOTAL</span>
              </div>
              <div className="space-y-1.5 pt-1">
                {activeItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <div className="pr-2 leading-tight">
                      <span className="font-bold">{item.qty}x</span> {item.name}
                      {item.note && (
                        <span className="block text-[9px] text-zinc-500 italic">({item.note})</span>
                      )}
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">
                      {brl(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totais e Serviço */}
            <div className="py-3 border-b border-dashed border-zinc-400 dark:border-zinc-700 space-y-1">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>SUBTOTAL DOS ITENS:</span>
                <span className="tabular-nums font-semibold">{brl(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1">TAXA DE SERVIÇO (10%):</span>
                <span className="tabular-nums font-semibold">{brl(serviceFee)}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold border-t border-dotted border-zinc-400 dark:border-zinc-700 text-zinc-950 dark:text-white">
                <span>TOTAL A PAGAR:</span>
                <span className="tabular-nums">{brl(finalTotal)}</span>
              </div>
              {order.guests > 1 && (
                <div className="flex justify-between text-[10px] text-zinc-500 pt-0.5">
                  <span>SUGESTÃO / PESSOA ({order.guests}x):</span>
                  <span className="tabular-nums font-bold">{brl(perPerson)}</span>
                </div>
              )}
            </div>

            {/* QR Code Pix para agilizar pagamento */}
            <div className="pt-3 text-center space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Pague no Pix com a câmera
              </p>
              <div className="mx-auto flex size-24 items-center justify-center rounded border border-zinc-300 bg-white p-1 dark:border-zinc-700">
                <QrCode className="size-20 text-zinc-900" />
              </div>
              <p className="text-[9px] text-zinc-500">Agradecemos a preferência! Volte sempre.</p>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações Rápidas */}
        <DialogFooter className="flex-col gap-2 border-t border-border bg-card p-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-9 gap-1.5"
            onClick={handleCopyPix}
          >
            {copiedPix ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copiedPix ? "Copiado!" : "Copiar Pix Copia-e-Cola"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9"
              onClick={onClose}
            >
              Fechar
            </Button>

            {onPay && order.status !== "pago" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs h-9 gap-1.5 text-emerald-700 dark:text-emerald-300"
                onClick={() => {
                  onClose();
                  onPay(order);
                }}
              >
                <Receipt className="size-3.5" />
                Receber
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              className="text-xs h-9 gap-1.5 bg-primary font-semibold shadow-xs"
              onClick={handlePrint}
            >
              <Printer className="size-3.5" />
              Imprimir Conta
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
