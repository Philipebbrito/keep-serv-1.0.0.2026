import type { MenuItem } from "../menu/types";
import type { NewStockItemInput, ProductStockStatus, StockItem } from "./types";

/**
 * Calcula o status de disponibilidade do estoque para um item do cardápio.
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
      available: true,
      availableUnits: null,
      maxPortions: null,
      detailLabel: "Sem consumo de estoque",
    };
  }

  // 2. Consumo Direto (ex: bebidas prontas, latas, garrafas)
  if (consumption === "direct") {
    const stockId = product.linkedStockItemId;
    const stockItem = stockItems.find((s) => s.id === stockId);

    if (!stockItem) {
      if (typeof product.stock === "number" && product.trackStock) {
        const out = product.stock <= 0;
        return {
          hasStockControl: true,
          consumptionType: "direct",
          isOutOfStock: out,
          isLowStock: !out && product.stock <= (product.minStock || 5),
          available: !out,
          availableUnits: product.stock,
          maxPortions: product.stock,
          detailLabel: `${product.stock} ${product.unit || "un"} em estoque`,
        };
      }
      return {
        hasStockControl: true,
        consumptionType: "direct",
        isOutOfStock: false,
        isLowStock: false,
        available: true,
        availableUnits: null,
        maxPortions: null,
        detailLabel: "Item de estoque não vinculado",
      };
    }

    const qtyPerSale =
      product.directStockQty && product.directStockQty > 0 ? product.directStockQty : 1;
    const available = Math.floor(stockItem.currentStock / qtyPerSale);
    const isOutOfStock = available <= 0;
    const isLowStock = !isOutOfStock && stockItem.currentStock <= stockItem.minStock;

    return {
      hasStockControl: true,
      consumptionType: "direct",
      isOutOfStock,
      isLowStock,
      available: !isOutOfStock,
      availableUnits: available,
      maxPortions: available,
      detailLabel: `${stockItem.currentStock} ${stockItem.unit} (${stockItem.name})`,
    };
  }

  // 3. Consumo de Matéria-Prima / Receita
  if (
    consumption === "recipe" &&
    product.recipeIngredients &&
    product.recipeIngredients.length > 0
  ) {
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
      available: !isOutOfStock,
      availableUnits: minAvailablePortions,
      maxPortions: minAvailablePortions,
      detailLabel: `${minAvailablePortions} porções possíveis pelos insumos`,
    };
  }

  return {
    hasStockControl: false,
    consumptionType: "none",
    isOutOfStock: false,
    isLowStock: false,
    available: true,
    availableUnits: null,
    maxPortions: null,
    detailLabel: "Disponível",
  };
}

/**
 * Verifica se um item atingiu ou ficou abaixo do nível mínimo de segurança.
 */
export function isEstoqueBaixo(item: StockItem): boolean {
  return item.currentStock <= item.minStock;
}

/**
 * Calcula o valor patrimonial total investido nos itens em estoque (preço de custo * quantidade).
 */
export function calcularValorTotalEstoque(itens: StockItem[]): number {
  const total = itens.reduce((acc, it) => acc + Math.max(0, it.currentStock) * it.costPrice, 0);
  return Number(total.toFixed(2));
}

/**
 * Calcula a quantidade de novo estoque após uma movimentação.
 */
export function calcularNovoEstoque(
  atual: number,
  deltaOuExato: number,
  modo: "delta" | "set" = "delta",
): number {
  if (modo === "set") {
    return Math.max(0, deltaOuExato);
  }
  return Math.max(0, atual + deltaOuExato);
}

/**
 * Validação de regras para cadastro e alteração de insumo ou produto no estoque.
 */
export function validarItemEstoque(input: NewStockItemInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.name || !input.name.trim()) {
    errors.push("O nome do item no estoque é obrigatório.");
  }
  if (input.currentStock < 0) {
    errors.push("A quantidade atual não pode ser negativa.");
  }
  if (input.minStock < 0) {
    errors.push("O estoque mínimo não pode ser negativo.");
  }
  if (input.costPrice < 0) {
    errors.push("O preço de custo unitário não pode ser negativo.");
  }
  if (!input.unit || !input.unit.trim()) {
    errors.push("A unidade de medida (ex: un, kg, L) é obrigatória.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
