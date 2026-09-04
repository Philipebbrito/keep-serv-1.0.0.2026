import type { MenuItem } from "./menu";

export type StockItemType = "materia_prima" | "pronto_consumo";

export interface StockMovement {
  id: string;
  type: "entrada" | "saida" | "ajuste";
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
  name: string;
  type: StockItemType;
  currentStock: number;
  minStock: number;
  unit: string;
  costPrice: number;
  supplier?: string;
  notes?: string;
};

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

const NOW = Date.now();

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  // --- PRONTOS PARA CONSUMO (Bebidas, latas, garrafas, itens prontos) ---
  {
    id: "stk-coca-lata",
    name: "Coca-Cola Lata 350ml",
    type: "pronto_consumo",
    currentStock: 48,
    minStock: 12,
    unit: "lata",
    costPrice: 3.2,
    supplier: "Distribuidora Ambev / Femsa",
    movements: [
      {
        id: "mov-init-1",
        type: "entrada",
        quantity: 48,
        previousStock: 0,
        newStock: 48,
        reason: "Carga inicial de estoque",
        timestamp: NOW - 86400000 * 3,
        author: "Sistema",
      },
    ],
    updatedAt: NOW - 86400000 * 3,
  },
  {
    id: "stk-coca-zero",
    name: "Coca-Cola Zero Lata 350ml",
    type: "pronto_consumo",
    currentStock: 32,
    minStock: 10,
    unit: "lata",
    costPrice: 3.2,
    supplier: "Distribuidora Ambev / Femsa",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-guarana-lata",
    name: "Guaraná Antarctica Lata 350ml",
    type: "pronto_consumo",
    currentStock: 36,
    minStock: 10,
    unit: "lata",
    costPrice: 2.9,
    supplier: "Distribuidora Bebidas SP",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-chopp-pilsen",
    name: "Chopp Pilsen Artesanal (Litros)",
    type: "pronto_consumo",
    currentStock: 65,
    minStock: 20,
    unit: "L",
    costPrice: 9.0,
    supplier: "Microcervejaria Paulistana",
    notes: "Barril de 50L na câmara fria",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-cerveja-ipa",
    name: "Cerveja Artesanal IPA Lata 473ml",
    type: "pronto_consumo",
    currentStock: 18,
    minStock: 8,
    unit: "lata",
    costPrice: 12.5,
    supplier: "Cervejaria Colorado / Hop",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-vinho-malbec",
    name: "Vinho Tinto Malbec Reserva 750ml",
    type: "pronto_consumo",
    currentStock: 14,
    minStock: 4,
    unit: "garrafa",
    costPrice: 58.0,
    supplier: "Adega & Cia Importadora",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-agua-com-gas",
    name: "Água Mineral com Gás 500ml",
    type: "pronto_consumo",
    currentStock: 54,
    minStock: 15,
    unit: "garrafa",
    costPrice: 1.4,
    supplier: "Fonte Prata",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-agua-sem-gas",
    name: "Água Mineral sem Gás 500ml",
    type: "pronto_consumo",
    currentStock: 60,
    minStock: 15,
    unit: "garrafa",
    costPrice: 1.2,
    supplier: "Fonte Prata",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-pudim-individual",
    name: "Pudim de Leite Individual Embalado",
    type: "pronto_consumo",
    currentStock: 6,
    minStock: 4,
    unit: "un",
    costPrice: 6.5,
    supplier: "Doceria Artesanal Vó Zélia",
    movements: [],
    updatedAt: NOW,
  },

  // --- MATÉRIA-PRIMA / INSUMOS NÃO PRONTOS PARA CONSUMO ---
  {
    id: "stk-picanha-in-natura",
    name: "Picanha Bovina Resfriada (Corte Bruto)",
    type: "materia_prima",
    currentStock: 18.5,
    minStock: 6.0,
    unit: "kg",
    costPrice: 69.9,
    supplier: "Frigorífico Boi Nobre",
    notes: "Armazenada a 2°C na geladeira de carnes",
    movements: [
      {
        id: "mov-init-2",
        type: "entrada",
        quantity: 20,
        previousStock: 0,
        newStock: 20,
        reason: "Compra semanal fornecedor",
        timestamp: NOW - 86400000 * 2,
        author: "Gestor",
      },
    ],
    updatedAt: NOW,
  },
  {
    id: "stk-costela-in-natura",
    name: "Costela Bovina Janela In Natura",
    type: "materia_prima",
    currentStock: 24.0,
    minStock: 8.0,
    unit: "kg",
    costPrice: 38.0,
    supplier: "Frigorífico Boi Nobre",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-peixe-fresco",
    name: "Postas de Peixe Fresco (Robalo/Badejo)",
    type: "materia_prima",
    currentStock: 8.5,
    minStock: 3.5,
    unit: "kg",
    costPrice: 48.0,
    supplier: "Peixaria Mar & Sol",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-camarao-limpo",
    name: "Camarão Cinza Médio Descascado",
    type: "materia_prima",
    currentStock: 5.2,
    minStock: 2.0,
    unit: "kg",
    costPrice: 72.0,
    supplier: "Peixaria Mar & Sol",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-blend-bovino",
    name: "Blend Bovino Especial para Hambúrguer",
    type: "materia_prima",
    currentStock: 14.2,
    minStock: 5.0,
    unit: "kg",
    costPrice: 34.0,
    supplier: "Açougue & Boutique de Carnes",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-pao-brioche",
    name: "Pão de Hambúrguer Brioche Artesanal",
    type: "materia_prima",
    currentStock: 45,
    minStock: 15,
    unit: "un",
    costPrice: 2.1,
    supplier: "Padaria Artesanal Bela Vista",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-batata-palito",
    name: "Batata Congelada Especial 9mm",
    type: "materia_prima",
    currentStock: 28.0,
    minStock: 10.0,
    unit: "kg",
    costPrice: 14.5,
    supplier: "Food Service Congelados",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-mandioca-higienizada",
    name: "Mandioca Descascada e Cozida Congelada",
    type: "materia_prima",
    currentStock: 20.0,
    minStock: 6.0,
    unit: "kg",
    costPrice: 8.2,
    supplier: "Hortifruti Distribuição",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-queijo-mussarela",
    name: "Queijo Muçarela Peça/Fatiada",
    type: "materia_prima",
    currentStock: 12.0,
    minStock: 4.0,
    unit: "kg",
    costPrice: 36.5,
    supplier: "Laticínios da Serra",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-arroz-arboreo",
    name: "Arroz Arbóreo Italiano (pct 1kg)",
    type: "materia_prima",
    currentStock: 8.0,
    minStock: 2.0,
    unit: "kg",
    costPrice: 19.5,
    supplier: "Empório Gastronômico",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-cachaca-artesanal",
    name: "Cachaça Prata Especial de Alambique",
    type: "materia_prima",
    currentStock: 7.5,
    minStock: 2.0,
    unit: "L",
    costPrice: 28.0,
    supplier: "Alambique Minas Imperial",
    notes: "Insumo para caipirinhas do bar",
    movements: [],
    updatedAt: NOW,
  },
  {
    id: "stk-limao-taiti",
    name: "Limão Taiti Fresco Selecionado",
    type: "materia_prima",
    currentStock: 15.0,
    minStock: 4.0,
    unit: "kg",
    costPrice: 5.5,
    supplier: "Ceagesp Hortifruti",
    movements: [],
    updatedAt: NOW,
  },
];

export interface ProductStockStatus {
  hasStockControl: boolean;
  consumptionType: "none" | "direct" | "recipe";
  isOutOfStock: boolean;
  isLowStock: boolean;
  availableUnits: number | null;
  detailLabel: string;
}

/**
 * Calcula em tempo real se um produto do cardápio está disponível, com estoque baixo ou esgotado
 * baseado nas regras de consumo configuradas no produto e no saldo real dos itens de estoque.
 */
export function getProductStockStatus(
  product: MenuItem,
  stockItems: StockItem[],
): ProductStockStatus {
  const consumption = product.stockConsumption || (product.trackStock ? "direct" : "none");

  // 1. Não consome estoque
  if (consumption === "none") {
    return {
      hasStockControl: false,
      consumptionType: "none",
      isOutOfStock: false,
      isLowStock: false,
      availableUnits: null,
      detailLabel: "Sem consumo de estoque",
    };
  }

  // 2. Consumo Direto (ex: bebidas prontas, latas, garrafas)
  if (consumption === "direct") {
    const stockId = product.linkedStockItemId;
    const stockItem = stockItems.find((s) => s.id === stockId);

    if (!stockItem) {
      // Fallback se não encontrou o item vinculado: se tinha número legado de stock
      if (typeof product.stock === "number" && product.trackStock) {
        const out = product.stock <= 0;
        return {
          hasStockControl: true,
          consumptionType: "direct",
          isOutOfStock: out,
          isLowStock: !out && product.stock <= (product.minStock || 5),
          availableUnits: product.stock,
          detailLabel: `${product.stock} ${product.unit || "un"} em estoque`,
        };
      }
      return {
        hasStockControl: true,
        consumptionType: "direct",
        isOutOfStock: false,
        isLowStock: false,
        availableUnits: null,
        detailLabel: "Item de estoque não vinculado",
      };
    }

    const qtyPerSale = product.directStockQty && product.directStockQty > 0 ? product.directStockQty : 1;
    const available = Math.floor(stockItem.currentStock / qtyPerSale);
    const isOutOfStock = available <= 0;
    const isLowStock = !isOutOfStock && stockItem.currentStock <= stockItem.minStock;

    return {
      hasStockControl: true,
      consumptionType: "direct",
      isOutOfStock,
      isLowStock,
      availableUnits: available,
      detailLabel: `${stockItem.currentStock} ${stockItem.unit} (${stockItem.name})`,
    };
  }

  // 3. Consumo de Matéria-Prima / Receita
  if (consumption === "recipe" && product.recipeIngredients && product.recipeIngredients.length > 0) {
    let minAvailablePortions = Infinity;
    let anyLowStock = false;
    let missingOrZero = false;

    for (const ing of product.recipeIngredients) {
      const stockItem = stockItems.find((s) => s.id === ing.stockItemId);
      if (!stockItem) continue;

      const portions = ing.quantity > 0 ? Math.floor(stockItem.currentStock / ing.quantity) : 9999;
      if (portions < minAvailablePortions) {
        minAvailablePortions = portions;
      }
      if (stockItem.currentStock <= stockItem.minStock) {
        anyLowStock = true;
      }
      if (stockItem.currentStock <= 0) {
        missingOrZero = true;
      }
    }

    if (minAvailablePortions === Infinity) minAvailablePortions = 999;
    const isOutOfStock = minAvailablePortions <= 0 || missingOrZero;
    const isLowStock = !isOutOfStock && anyLowStock;

    return {
      hasStockControl: true,
      consumptionType: "recipe",
      isOutOfStock,
      isLowStock,
      availableUnits: minAvailablePortions,
      detailLabel: `${minAvailablePortions} porções possíveis pelos insumos`,
    };
  }

  return {
    hasStockControl: false,
    consumptionType: "none",
    isOutOfStock: false,
    isLowStock: false,
    availableUnits: null,
    detailLabel: "Disponível",
  };
}
