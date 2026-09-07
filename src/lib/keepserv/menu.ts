import type { OrderItem } from "./types";

export type MenuCategory = OrderItem["category"];

export const MENU_CATEGORIES: { id: MenuCategory; name: string }[] = [
  { id: "prato", name: "Pratos Principais" },
  { id: "entrada", name: "Entradas & Petiscos" },
  { id: "bebida", name: "Bebidas" },
  { id: "sobremesa", name: "Sobremesas" },
];

export type StockConsumptionType = "none" | "direct" | "recipe";

export interface RecipeIngredient {
  stockItemId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: OrderItem["category"];
  description?: string;
  highlight?: "mais_pedido" | "chef" | "artesanal" | "vegetariano";
  serves?: string;
  active: boolean;

  // Relação com o Estoque:
  stockConsumption: StockConsumptionType; // "none" (não consome), "direct" (pronto para consumo), "recipe" (matéria-prima)
  linkedStockItemId?: string; // Se 'direct', ID do item pronto para consumo no estoque
  directStockQty?: number; // Quantidade de unidades consumidas por pedido (padrão: 1)
  recipeIngredients?: RecipeIngredient[]; // Se 'recipe', lista de matérias-primas e porções consumidas

  // Campos para compatibilidade
  stock?: number;
  minStock?: number;
  trackStock?: boolean;
  unit?: string;
  updatedAt?: number;
}

export type NewProductInput = {
  name: string;
  price: number;
  category: OrderItem["category"];
  description?: string;
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

/** Cardápio do bar/restaurante usado para montar novos pedidos e exibido no Cardápio Digital. */
export const MENU: MenuItem[] = [
  // Pratos
  {
    id: "picanha",
    name: "Picanha na chapa (2 pessoas)",
    price: 149.9,
    category: "prato",
    description:
      "Cortes nobres grelhados na brasa, acompanhados de arroz branco, farofa da casa, vinagrete e mandioca na manteiga de garrafa.",
    highlight: "mais_pedido",
    serves: "Serve 2 pessoas",
    stockConsumption: "recipe",
    recipeIngredients: [
      { stockItemId: "stk-picanha-in-natura", quantity: 0.6 },
      { stockItemId: "stk-mandioca-higienizada", quantity: 0.3 },
    ],
    stock: 16,
    minStock: 5,
    trackStock: true,
    active: true,
    unit: "porção",
  },
  {
    id: "moqueca",
    name: "Moqueca de peixe",
    price: 118,
    category: "prato",
    description:
      "Postas de peixe fresco cozidas lentamente em leite de coco artesanal, azeite de dendê, pimentões coloridos e coentro fresco.",
    highlight: "chef",
    serves: "Serve 2 pessoas",
    stockConsumption: "recipe",
    recipeIngredients: [{ stockItemId: "stk-peixe-fresco", quantity: 0.5 }],
    stock: 8,
    minStock: 4,
    trackStock: true,
    active: true,
    unit: "porção",
  },
  {
    id: "costela",
    name: "Costela no bafo 700g",
    price: 132,
    category: "prato",
    description:
      "Assada lentamente por 8 horas, desfiando ao garfo, servida com mandioca cozida e cebolas caramelizadas.",
    highlight: "mais_pedido",
    serves: "Serve 2 pessoas",
    stockConsumption: "recipe",
    recipeIngredients: [{ stockItemId: "stk-costela-in-natura", quantity: 0.7 }],
    stock: 12,
    minStock: 4,
    trackStock: true,
    active: true,
    unit: "porção",
  },
  {
    id: "risoto-camarao",
    name: "Risoto de camarão",
    price: 89,
    category: "prato",
    description:
      "Arroz arbóreo preparado com caldo de frutos do mar, camarões salteados no azeite, vinho branco e parmesão maturado.",
    highlight: "chef",
    serves: "Individual",
    stockConsumption: "recipe",
    recipeIngredients: [
      { stockItemId: "stk-camarao-limpo", quantity: 0.25 },
      { stockItemId: "stk-arroz-arboreo", quantity: 0.15 },
    ],
    stock: 3,
    minStock: 5,
    trackStock: true,
    active: true,
    unit: "porção",
  },
  {
    id: "hamburguer",
    name: "Hambúrguer artesanal 180g",
    price: 46,
    category: "prato",
    description:
      "Blend bovino no pão brioche amanteigado com queijo cheddar inglês derretido, maionese defumada e cebola caramelizada.",
    highlight: "artesanal",
    serves: "Individual",
    stockConsumption: "recipe",
    recipeIngredients: [
      { stockItemId: "stk-blend-bovino", quantity: 0.18 },
      { stockItemId: "stk-pao-brioche", quantity: 1 },
    ],
    stock: 24,
    minStock: 6,
    trackStock: true,
    active: true,
    unit: "un",
  },
  {
    id: "parmegiana",
    name: "Filé à parmegiana",
    price: 92,
    category: "prato",
    description:
      "Filé mignon empanado crocante coberto por molho de tomate rústico e gratinado com queijo muçarela. Acompanha arroz e fritas.",
    serves: "Serve até 2 pessoas",
    stockConsumption: "recipe",
    recipeIngredients: [
      { stockItemId: "stk-queijo-mussarela", quantity: 0.2 },
      { stockItemId: "stk-batata-palito", quantity: 0.25 },
    ],
    stock: 15,
    minStock: 4,
    trackStock: true,
    active: true,
    unit: "porção",
  },
  {
    id: "salmao",
    name: "Salmão grelhado",
    price: 96,
    category: "prato",
    description:
      "Filé de salmão fresco selado com crosta de ervas finas, servido com risoto de limão siciliano e legumes salteados.",
    serves: "Individual",
    stockConsumption: "none",
    stock: 6,
    minStock: 4,
    trackStock: false,
    active: true,
    unit: "porção",
  },
  {
    id: "feijoada",
    name: "Feijoada individual",
    price: 68,
    category: "prato",
    description:
      "Feijão preto com carnes nobres desengorduradas, arroz branco, couve refogada no alho, torresmo pururuca e fatias de laranja.",
    serves: "Individual",
    stockConsumption: "none",
    stock: 18,
    minStock: 5,
    trackStock: false,
    active: true,
    unit: "porção",
  },

  // Entradas
  {
    id: "farofa-bacon",
    name: "Farofa de bacon",
    price: 18,
    category: "entrada",
    description:
      "Farinha de mandioca torrada na manteiga de garrafa com crocantes de bacon defumado e cheiro-verde.",
    serves: "Petisco",
    stockConsumption: "none",
    stock: 30,
    minStock: 8,
    trackStock: false,
    active: true,
    unit: "porção",
  },
  {
    id: "bolinho-bacalhau",
    name: "Bolinho de bacalhau (6un)",
    price: 42,
    category: "entrada",
    description:
      "Receita tradicional portuguesa crocante por fora e cremosa por dentro com bacalhau Gadus morhua e azeite extravirgem.",
    highlight: "mais_pedido",
    serves: "6 unidades",
    stockConsumption: "none",
    stock: 14,
    minStock: 5,
    trackStock: false,
    active: true,
    unit: "porção",
  },
  {
    id: "batata-rustica",
    name: "Batata rústica",
    price: 29,
    category: "entrada",
    description:
      "Batatas crocantes temperadas com alecrim fresco e sal marinho, acompanhadas de aioli artesanal de alho tostado.",
    highlight: "vegetariano",
    serves: "Porção para compartilhar",
    stockConsumption: "recipe",
    recipeIngredients: [{ stockItemId: "stk-batata-palito", quantity: 0.4 }],
    stock: 25,
    minStock: 8,
    trackStock: true,
    active: true,
    unit: "porção",
  },
  {
    id: "onion-rings",
    name: "Onion rings",
    price: 26,
    category: "entrada",
    description:
      "Anéis de cebola doce empanados em massa temperada e fritos até dourar com molho barbecue da casa.",
    highlight: "vegetariano",
    serves: "Porção individual",
    stockConsumption: "none",
    stock: 20,
    minStock: 6,
    trackStock: false,
    active: true,
    unit: "porção",
  },

  // Bebidas
  {
    id: "chopp-pilsen",
    name: "Chopp Pilsen 500ml",
    price: 16.5,
    category: "bebida",
    description:
      "Chopp artesanal puro malte gelado na serpentina, leve, refrescante e com colarinho cremoso.",
    highlight: "mais_pedido",
    stockConsumption: "direct",
    linkedStockItemId: "stk-chopp-pilsen",
    directStockQty: 0.5,
    stock: 95,
    minStock: 30,
    trackStock: true,
    active: true,
    unit: "caneca",
  },
  {
    id: "chopp-ipa",
    name: "Chopp IPA 500ml",
    price: 19.5,
    category: "bebida",
    description:
      "Cerveja India Pale Ale aromática com notas cítricas de lúpulo americano e amargor equilibrado.",
    highlight: "artesanal",
    stockConsumption: "direct",
    linkedStockItemId: "stk-cerveja-ipa",
    directStockQty: 1,
    stock: 42,
    minStock: 20,
    trackStock: true,
    active: true,
    unit: "caneca",
  },
  {
    id: "refrigerante",
    name: "Refrigerante lata",
    price: 9,
    category: "bebida",
    description:
      "Lata 350ml (Coca-Cola, Coca Zero, Guaraná Antarctica ou Sprite). Servido com copo com gelo e limão.",
    stockConsumption: "direct",
    linkedStockItemId: "stk-coca-lata",
    directStockQty: 1,
    stock: 54,
    minStock: 24,
    trackStock: true,
    active: true,
    unit: "lata",
  },
  {
    id: "agua-gas",
    name: "Água com gás",
    price: 8,
    category: "bebida",
    description: "Garrafa 310ml servida com taça, gelo e rodela de limão taiti fresco.",
    stockConsumption: "direct",
    linkedStockItemId: "stk-agua-com-gas",
    directStockQty: 1,
    stock: 38,
    minStock: 15,
    trackStock: true,
    active: true,
    unit: "garrafa",
  },
  {
    id: "suco-maracuja",
    name: "Suco de maracujá",
    price: 14,
    category: "bebida",
    description:
      "Suco natural preparado com a fruta fresca na hora, servido na jarra individual de 400ml.",
    stockConsumption: "none",
    stock: 22,
    minStock: 8,
    trackStock: false,
    active: true,
    unit: "jarra",
  },
  {
    id: "vinho-tinto",
    name: "Taça de vinho tinto",
    price: 32,
    category: "bebida",
    description:
      "Taça de vinho tinto seco selecionado da carta de importados (Malbec ou Cabernet Sauvignon).",
    stockConsumption: "direct",
    linkedStockItemId: "stk-vinho-malbec",
    directStockQty: 0.2,
    stock: 18,
    minStock: 6,
    trackStock: true,
    active: true,
    unit: "taça",
  },
  {
    id: "caipirinha-limao",
    name: "Caipirinha de limão",
    price: 24,
    category: "bebida",
    description:
      "Clássica caipirinha brasileira preparada com cachaça artesanal de alambique, limão taiti e açúcar orgânico.",
    highlight: "mais_pedido",
    stockConsumption: "recipe",
    recipeIngredients: [
      { stockItemId: "stk-cachaca-artesanal", quantity: 0.1 },
      { stockItemId: "stk-limao-taiti", quantity: 0.15 },
    ],
    stock: 35,
    minStock: 10,
    trackStock: true,
    active: true,
    unit: "copo",
  },
  {
    id: "caipirinha-maracuja",
    name: "Caipirinha de maracujá",
    price: 26,
    category: "bebida",
    description: "Polpa fresca de maracujá com cachaça envelhecida e gelo picado.",
    stockConsumption: "recipe",
    recipeIngredients: [{ stockItemId: "stk-cachaca-artesanal", quantity: 0.1 }],
    stock: 28,
    minStock: 10,
    trackStock: true,
    active: true,
    unit: "copo",
  },
  {
    id: "espresso",
    name: "Espresso duplo",
    price: 11,
    category: "bebida",
    description: "Café especial 100% arábica extraído na máquina italiana com crema espessa.",
    stockConsumption: "none",
    stock: 80,
    minStock: 15,
    trackStock: false,
    active: true,
    unit: "xícara",
  },

  // Sobremesas
  {
    id: "petit-gateau",
    name: "Petit gâteau",
    price: 28,
    category: "sobremesa",
    description:
      "Bolo quente de chocolate belga meio amargo com recheio cremoso e bola de sorvete de baunilha artesanal.",
    highlight: "mais_pedido",
    stockConsumption: "none",
    stock: 0,
    minStock: 6,
    trackStock: false,
    active: true,
    unit: "un",
  },
  {
    id: "pudim-leite",
    name: "Pudim tradicional de leite",
    price: 18,
    category: "sobremesa",
    description: "Pudim cremoso sem furinhos com calda caramelizada de açúcar dourada.",
    stockConsumption: "direct",
    linkedStockItemId: "stk-pudim-individual",
    directStockQty: 1,
    stock: 6,
    minStock: 4,
    trackStock: true,
    active: true,
    unit: "un",
  },
];

export const CATEGORY_LABEL: Record<OrderItem["category"], string> = {
  prato: "Pratos",
  entrada: "Entradas",
  bebida: "Bebidas",
  sobremesa: "Sobremesas",
};

export const CATEGORY_ORDER: OrderItem["category"][] = ["prato", "entrada", "bebida", "sobremesa"];
