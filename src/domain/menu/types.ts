export type MenuCategory = "prato" | "entrada" | "bebida" | "sobremesa";

export const MENU_CATEGORIES: { id: MenuCategory; name: string }[] = [
  { id: "prato", name: "Pratos Principais" },
  { id: "entrada", name: "Entradas & Petiscos" },
  { id: "bebida", name: "Bebidas" },
  { id: "sobremesa", name: "Sobremesas" },
];

export const CATEGORY_LABEL: Record<MenuCategory, string> = {
  prato: "Pratos Principais",
  entrada: "Entradas & Petiscos",
  bebida: "Bebidas",
  sobremesa: "Sobremesas",
};

export const CATEGORY_ORDER: MenuCategory[] = ["entrada", "prato", "bebida", "sobremesa"];

export type StockConsumptionType = "none" | "direct" | "recipe";

export interface RecipeIngredient {
  stockItemId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  loja_id?: string; // Isolamento multi-tenant
  name: string;
  price: number;
  category: MenuCategory;
  description?: string;
  image?: string;
  highlight?: "mais_pedido" | "chef" | "artesanal" | "vegetariano";
  serves?: string;
  active: boolean;

  // Relação com o Estoque:
  stockConsumption: StockConsumptionType;
  linkedStockItemId?: string;
  directStockQty?: number;
  recipeIngredients?: RecipeIngredient[];

  // Campos para compatibilidade
  stock?: number;
  minStock?: number;
  trackStock?: boolean;
  unit?: string;
  updatedAt?: number;
}

export type NewProductInput = {
  loja_id?: string;
  name: string;
  price: number;
  category: MenuCategory;
  description?: string;
  image?: string;
  highlight?: "mais_pedido" | "chef" | "artesanal" | "vegetariano";
  serves?: string;
  active: boolean;

  stockConsumption: StockConsumptionType;
  linkedStockItemId?: string;
  directStockQty?: number;
  recipeIngredients?: RecipeIngredient[];

  stock?: number;
  minStock?: number;
  trackStock?: boolean;
  unit?: string;
};

export interface PresetFoodImage {
  id: string;
  name: string;
  category: MenuCategory;
  url: string;
  tag: string;
}
