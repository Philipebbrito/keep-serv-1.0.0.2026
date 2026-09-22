export type StockItemType = "materia_prima" | "pronto_consumo";

export type StockMovementType = "entrada" | "saida" | "ajuste";

export interface StockMovement {
  id: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: number;
  author?: string;
  orderCode?: string;
}

export interface StockItem {
  id: string;
  loja_id?: string; // Isolamento multi-tenant
  name: string;
  type: StockItemType;
  currentStock: number;
  minStock: number;
  unit: string; // "un", "lata", "garrafa", "kg", "g", "L", "ml", "porção", "cx"
  costPrice: number;
  supplier?: string;
  notes?: string;
  movements: StockMovement[];
  updatedAt: number;
}

export type NewStockItemInput = {
  loja_id?: string;
  name: string;
  type: StockItemType;
  currentStock: number;
  minStock: number;
  unit: string;
  costPrice: number;
  supplier?: string;
  notes?: string;
};

export interface RecipeIngredient {
  stockItemId: string;
  quantity: number;
}

export interface ProductStockStatus {
  hasStockControl: boolean;
  consumptionType: "none" | "direct" | "recipe";
  isOutOfStock: boolean;
  isLowStock: boolean;
  available: boolean;
  availableUnits: number | null;
  maxPortions: number | null;
  detailLabel: string;
}

export const STOCK_TYPE_LABEL: Record<StockItemType, { label: string; desc: string }> = {
  pronto_consumo: {
    label: "Pronto para Consumo",
    desc: "Produtos acabados prontos para servir ao cliente (bebidas, latas, garrafas, itens fechados)",
  },
  materia_prima: {
    label: "Matéria-Prima / Insumo",
    desc: "Ingredientes brutos e matérias-primas que passam por preparo na cozinha ou bar",
  },
};
