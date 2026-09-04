import { Check, Copy, ExternalLink, Layers, Printer, QrCode, Sparkles, Table2 } from "lucide-react";
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
import { TABLES_TOTAL } from "@/lib/keepserv/mock-data";

interface FixedTableQRDialogProps {
  open: boolean;
  onClose: () => void;
  initialTable?: number;
}

export function FixedTableQRDialog({ open, onClose, initialTable = 1 }: FixedTableQRDialogProps) {
  const [selectedTable, setSelectedTable] = useState<number>(initialTable);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [allQrs, setAllQrs] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"single" | "all">("single");

  useEffect(() => {
    if (initialTable) {
      setSelectedTable(initialTable);
    }
  }, [initialTable]);

  // URL permanente fixa da mesa
  const getTableUrl = (t: number) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/mesa/${t}`;
    }
    return `http://localhost:3000/mesa/${t}`;
  };

  const currentUrl = getTableUrl(selectedTable);

  // Gera QR Code da mesa selecionada
  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(currentUrl, {
      width: 340,
      margin: 1.5,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [currentUrl, open]);

  // Gera QR Codes de todas as mesas quando no modo lote
  useEffect(() => {
    if (!open || mode !== "all") return;

    const generateAll = async () => {
      const results: Record<number, string> = {};
      for (let t = 1; t <= TABLES_TOTAL; t++) {
        try {
          const url = await QRCode.toDataURL(getTableUrl(t), {
            width: 260,
            margin: 1.5,
            color: { dark: "#09090b", light: "#ffffff" },
            errorCorrectionLevel: "M",
          });
          results[t] = url;
        } catch (e) {
          console.error("Erro ao gerar QR da mesa", t, e);
        }
      }
      setAllQrs(results);
    };

    generateAll();
  }, [open, mode]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success("Link fixo copiado!", {
        description: `URL permanente da Mesa ${selectedTable} copiada.`,
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const handleOpenClient = () => {
    window.open(currentUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden sm:rounded-2xl border-border bg-card">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                <QrCode className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  QR Code Fixo de Mesa
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    Permanente
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Cada mesa possui seu QR code permanente para Cardápio Digital e Comanda.
                </DialogDescription>
              </div>
            </div>

            {/* Alternador de Modo Individual vs Todas */}
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-background">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium ${
                  mode === "single"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mesa Específica
              </button>
              <button
                type="button"
                onClick={() => setMode("all")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors font-medium ${
                  mode === "all"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todas (1 a {TABLES_TOTAL})
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Conteúdo */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {mode === "single" ? (
            <div className="flex flex-col items-center space-y-4">
              {/* Seletor de Mesas */}
              <div className="w-full flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                  Selecionar mesa:
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: TABLES_TOTAL }, (_, i) => i + 1).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTable(t)}
                      className={`size-7 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        selectedTable === t
                          ? "bg-primary text-primary-foreground shadow-xs scale-105"
                          : "border border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display de mesa estilizado */}
              <div className="w-full max-w-sm rounded-2xl border-2 border-primary/20 bg-linear-to-b from-card to-muted/20 p-5 text-center shadow-md">
                <div className="border-b border-border/80 pb-3 mb-4">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary block">
                    KEEPSERV BISTRÔ & BAR
                  </span>
                  <h3 className="text-2xl font-display font-extrabold text-foreground mt-0.5">
                    MESA {selectedTable}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Aponte a câmera do celular para acessar
                  </p>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-inner border border-zinc-200 inline-block mx-auto">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code Fixo Mesa ${selectedTable}`}
                      className="size-48 rounded-lg object-contain mx-auto"
                    />
                  ) : (
                    <div className="size-48 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
                      Gerando QR Code...
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/80 grid grid-cols-2 gap-2 text-left text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-primary font-bold">✓</span> Cardápio digital
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-primary font-bold">✓</span> Conta em tempo real
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-primary font-bold">✓</span> Divisão & Pix
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-primary font-bold">✓</span> Chamar garçom
                  </div>
                </div>
              </div>

              {/* Link permanente */}
              <div className="w-full max-w-sm space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  URL Fixa da Mesa {selectedTable}:
                </label>
                <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background p-1.5">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 bg-transparent px-2 text-xs font-mono text-muted-foreground truncate outline-none select-all"
                  />
                  <Button
                    size="sm"
                    variant={copied ? "default" : "secondary"}
                    className="h-7 px-2.5 text-xs gap-1 shrink-0"
                    onClick={handleCopyLink}
                  >
                    {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Modo Todas as Mesas (Grade de Impressão)
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Grade de Displays para todas as 24 Mesas
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Pronto para imprimir e recortar nos totens ou suportes acrílicos de mesa.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {TABLES_TOTAL} mesas
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: TABLES_TOTAL }, (_, i) => i + 1).map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-border bg-card p-3 text-center flex flex-col items-center"
                  >
                    <span className="text-xs font-bold text-foreground mb-1">MESA {t}</span>
                    <div className="bg-white p-1.5 rounded-lg border border-zinc-200">
                      {allQrs[t] ? (
                        <img
                          src={allQrs[t]}
                          alt={`QR Mesa ${t}`}
                          className="size-24 object-contain"
                        />
                      ) : (
                        <div className="size-24 flex items-center justify-center text-[10px] text-muted-foreground animate-pulse">
                          Gerando...
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1.5 font-mono">
                      /mesa/{t}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com botões de ação */}
        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs gap-1.5 h-9"
            onClick={handlePrint}
          >
            <Printer className="size-3.5" />
            <span>Imprimir {mode === "single" ? `Mesa ${selectedTable}` : "Todas as Mesas"}</span>
          </Button>

          {mode === "single" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs gap-1.5 h-9"
              onClick={handleOpenClient}
            >
              <ExternalLink className="size-3.5" />
              <span>Abrir como Cliente</span>
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto text-xs h-9 sm:ml-auto"
            onClick={onClose}
          >
            Fechar
          </Button>
        </DialogFooter>

        {/* Template Oculto para Impressão */}
        <div id="print-fixed-tables" className="hidden print:block text-black bg-white">
          {mode === "single" ? (
            <div className="p-8 text-center border-2 border-black max-w-sm mx-auto rounded-xl">
              <h2 className="text-xl font-extrabold uppercase tracking-widest">
                KEEPSERV BISTRÔ & BAR
              </h2>
              <div className="my-4 py-2 bg-black text-white text-3xl font-black rounded-lg">
                MESA {selectedTable}
              </div>
              <p className="text-xs font-bold uppercase mb-4">
                Aponte a câmera para acessar o Cardápio Digital & Comanda
              </p>
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt={`QR Mesa ${selectedTable}`}
                  className="w-56 h-56 mx-auto border-2 border-black p-2 rounded-lg"
                />
              )}
              <div className="mt-5 text-xs text-left space-y-1 font-sans border-t border-black pt-3">
                <p>• Consulte o cardápio com fotos e valores</p>
                <p>• Acompanhe o preparo dos seus pedidos</p>
                <p>• Divida a conta e pague via Pix instantâneo</p>
                <p>• Sem necessidade de aplicativo ou login</p>
              </div>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-2 gap-6">
              {Array.from({ length: TABLES_TOTAL }, (_, i) => i + 1).map((t) => (
                <div
                  key={t}
                  className="border-2 border-dashed border-black p-4 text-center rounded-xl break-inside-avoid"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider">KEEPSERV</h3>
                  <div className="text-xl font-black my-1 bg-black text-white py-1 px-3 rounded inline-block">
                    MESA {t}
                  </div>
                  <p className="text-[10px] font-semibold mb-2">Cardápio Digital & Comanda</p>
                  {allQrs[t] && (
                    <img
                      src={allQrs[t]}
                      alt={`QR Mesa ${t}`}
                      className="w-36 h-36 mx-auto border border-black p-1 rounded"
                    />
                  )}
                  <p className="text-[9px] mt-2 font-mono">{getTableUrl(t)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
