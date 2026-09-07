import {
  Camera,
  Check,
  Image as ImageIcon,
  Link2,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRESET_FOOD_IMAGES, type PresetFoodImage } from "@/lib/keepserv/menu";
import { cn } from "@/lib/utils";

interface ProductPhotoUploaderProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  productName?: string;
  category?: string;
}

/**
 * Utilitário para comprimir e redimensionar imagens locais no browser.
 * Garante que imagens de alta resolução (10MB+) fiquem leves (~50-90KB),
 * carreguem instantaneamente e não estourem o limite do localStorage.
 */
function compressImage(
  file: File,
  maxWidth = 900,
  maxHeight = 700,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Erro ao processar imagem"));
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
  });
}

export function ProductPhotoUploader({
  value,
  onChange,
  productName,
  category,
}: ProductPhotoUploaderProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "gallery" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).");
      return;
    }

    try {
      setIsProcessing(true);
      const compressedDataUrl = await compressImage(file);
      onChange(compressedDataUrl);
      toast.success("Foto carregada e otimizada com sucesso!");
    } catch (err) {
      console.error("Erro ao comprimir imagem:", err);
      toast.error("Não foi possível carregar a imagem selecionada.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error("Cole ou digite a URL da imagem.");
      return;
    }
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("data:")
    ) {
      toast.error("Informe um link de imagem válido iniciando com https://");
      return;
    }
    onChange(trimmed);
    setUrlInput("");
    toast.success("Foto da internet vinculada ao produto!");
  };

  const handleSelectPreset = (preset: PresetFoodImage) => {
    onChange(preset.url);
    toast.success(`Foto "${preset.name}" selecionada!`);
  };

  const handleRemove = () => {
    onChange(undefined);
    toast.info("Foto removida do produto.");
  };

  // Filtra galeria priorizando a categoria atual do produto
  const filteredPresets = React.useMemo(() => {
    if (!category || category === "pratos" || category === "prato") {
      return PRESET_FOOD_IMAGES;
    }
    // Coloca os da categoria correspondente primeiro
    return [...PRESET_FOOD_IMAGES].sort((a, b) => {
      const matchA = a.category === category ? -1 : 1;
      const matchB = b.category === category ? -1 : 1;
      return matchA - matchB;
    });
  }, [category]);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Camera className="size-4 text-primary" />
          Foto do Produto no Cardápio
        </label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-7 px-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="size-3.5 mr-1" />
            Remover foto
          </Button>
        ) : (
          <span className="text-[10px] text-muted-foreground font-medium">Opcional</span>
        )}
      </div>

      {/* Visualização da Imagem Atual */}
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30 group">
          <div className="aspect-video sm:aspect-[21/9] w-full max-h-48 overflow-hidden bg-black/10 flex items-center justify-center">
            <img
              src={value}
              alt={productName || "Foto do prato"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback para URL quebrada
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";
              }}
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end justify-between p-3 opacity-90 transition-opacity">
            <div className="text-white text-xs">
              <span className="font-semibold block truncate max-w-[200px] sm:max-w-xs">
                {productName || "Foto selecionada"}
              </span>
              <span className="text-[10px] text-white/80">
                {value.startsWith("data:") ? "Arquivo local otimizado" : "Imagem externa vinculada"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs px-2.5 bg-white/90 text-black hover:bg-white font-medium shadow-xs"
              >
                Substituir
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ÁREA DE SELEÇÃO QUANDO NÃO HÁ FOTO AINDA */
        <div className="space-y-2.5">
          {/* Navegação entre abas de inserção de foto */}
          <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-lg border border-border/70 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={cn(
                "py-1.5 px-2 rounded-md font-medium text-center transition-all flex items-center justify-center gap-1.5",
                activeTab === "upload"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <UploadCloud className="size-3.5" />
              <span>Meu Arquivo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("gallery")}
              className={cn(
                "py-1.5 px-2 rounded-md font-medium text-center transition-all flex items-center justify-center gap-1.5",
                activeTab === "gallery"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Galeria Rápida</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={cn(
                "py-1.5 px-2 rounded-md font-medium text-center transition-all flex items-center justify-center gap-1.5",
                activeTab === "url"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Link2 className="size-3.5" />
              <span>Link da Web</span>
            </button>
          </div>

          {/* ABA 1: UPLOAD DE ARQUIVO (DRAG & DROP E CLIQUE) */}
          {activeTab === "upload" && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2",
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : "border-border hover:border-primary/60 hover:bg-muted/30 bg-muted/10",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />

              <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                {isProcessing ? (
                  <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud className="size-6" />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground">
                  {isDragging
                    ? "Solte a imagem aqui!"
                    : "Clique para selecionar ou arraste uma foto aqui"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Formatos aceitos: JPG, PNG, WebP (redimensionamento automático)
                </p>
              </div>

              <span className="text-[10px] font-medium bg-background px-2.5 py-0.5 rounded-full border text-muted-foreground shadow-2xs">
                Computador ou Câmera do Celular
              </span>
            </div>
          )}

          {/* ABA 2: GALERIA PRONTA DE FOTOS GASTRONÔMICAS */}
          {activeTab === "gallery" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Clique para aplicar uma foto com apresentação profissional:
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1 p-0.5">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="group relative rounded-lg overflow-hidden border border-border bg-muted/20 hover:border-primary transition-all text-left flex flex-col focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-black/5">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-1.5 bg-background">
                      <p className="text-[10px] font-semibold text-foreground truncate leading-tight">
                        {preset.name}
                      </p>
                      <span className="text-[9px] text-muted-foreground block truncate">
                        {preset.tag}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: LINK DA WEB / URL EXTERNA */}
          {activeTab === "url" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://exemplo.com/foto-do-prato.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                  className="text-xs h-9"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyUrl}
                  className="h-9 text-xs px-3 font-semibold shrink-0"
                >
                  <Check className="size-3.5 mr-1" />
                  Vincular
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cole o link direto da imagem hospedada na nuvem, banco de fotos ou rede social do
                restaurante.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Input de arquivo invisível para substituição rápida */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  );
}
