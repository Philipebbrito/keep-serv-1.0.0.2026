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
  loja_id?: string; // Isolamento multi-tenant
  name: string;
  price: number;
  category: OrderItem["category"];
  description?: string;
  image?: string;
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
  loja_id?: string;
  name: string;
  price: number;
  category: OrderItem["category"];
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
  category: "prato" | "entrada" | "bebida" | "sobremesa";
  url: string;
  tag: string;
}

export const PRESET_FOOD_IMAGES: PresetFoodImage[] = [
  // Pratos / Carnes
  {
    id: "img-picanha",
    name: "Picanha na Chapa",
    category: "prato",
    tag: "Carnes",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-costela",
    name: "Costela Assada",
    category: "prato",
    tag: "Carnes",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-hamburguer",
    name: "Hambúrguer Artesanal",
    category: "prato",
    tag: "Burgers",
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-parmegiana",
    name: "Filé à Parmegiana",
    category: "prato",
    tag: "Carnes",
    url: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-salmao",
    name: "Salmão Grelhado",
    category: "prato",
    tag: "Peixes",
    url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-moqueca",
    name: "Moqueca de Frutos do Mar",
    category: "prato",
    tag: "Peixes",
    url: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-risoto",
    name: "Risoto de Camarão",
    category: "prato",
    tag: "Massas & Risotos",
    url: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-feijoada",
    name: "Feijoada Completa",
    category: "prato",
    tag: "Brasileira",
    url: "https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-massa",
    name: "Massa / Fettuccine",
    category: "prato",
    tag: "Massas & Risotos",
    url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
  },
  // Entradas
  {
    id: "img-batata-rustica",
    name: "Batata Frita Rústica",
    category: "entrada",
    tag: "Petiscos",
    url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-bolinho",
    name: "Bolinhos & Petiscos",
    category: "entrada",
    tag: "Petiscos",
    url: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-onion-rings",
    name: "Onion Rings Crocantes",
    category: "entrada",
    tag: "Petiscos",
    url: "https://images.unsplash.com/photo-1639024471287-032f66e754d7?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-farofa-bacon",
    name: "Farofa & Acompanhamentos",
    category: "entrada",
    tag: "Acompanhamentos",
    url: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-bruschetta",
    name: "Bruschetta Italiana",
    category: "entrada",
    tag: "Petiscos",
    url: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80",
  },
  // Bebidas
  {
    id: "img-chopp-pilsen",
    name: "Chopp Pilsen no Copo",
    category: "bebida",
    tag: "Cervejas",
    url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-chopp-ipa",
    name: "Cerveja Artesanal IPA",
    category: "bebida",
    tag: "Cervejas",
    url: "https://images.unsplash.com/photo-1608270199187-57ee9281a027?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-caipirinha-limao",
    name: "Caipirinha Clássica",
    category: "bebida",
    tag: "Coquetéis",
    url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-caipirinha-maracuja",
    name: "Drink / Coquetel Tropical",
    category: "bebida",
    tag: "Coquetéis",
    url: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-vinho-tinto",
    name: "Taça de Vinho Tinto",
    category: "bebida",
    tag: "Vinhos",
    url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-suco",
    name: "Suco Natural na Jarra",
    category: "bebida",
    tag: "Não-Alcoólicos",
    url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-refrigerante",
    name: "Refrigerante com Gelo e Limão",
    category: "bebida",
    tag: "Não-Alcoólicos",
    url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-agua",
    name: "Água Mineral com Gelo",
    category: "bebida",
    tag: "Não-Alcoólicos",
    url: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-espresso",
    name: "Café Espresso Italiano",
    category: "bebida",
    tag: "Cafés",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  },
  // Sobremesas
  {
    id: "img-petit-gateau",
    name: "Petit Gâteau com Sorvete",
    category: "sobremesa",
    tag: "Chocolates",
    url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-pudim",
    name: "Pudim de Leite Condensado",
    category: "sobremesa",
    tag: "Clássicos",
    url: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-cheesecake",
    name: "Cheesecake de Frutas Vermelhas",
    category: "sobremesa",
    tag: "Tortas",
    url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "img-sorvete",
    name: "Taça de Sorvete Artesanal",
    category: "sobremesa",
    tag: "Gelados",
    url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80",
  },
];

/** Cardápio do bar/restaurante usado para montar novos pedidos e exibido no Cardápio Digital. */
export const MENU: MenuItem[] = [
  // Pratos
  {
    id: "picanha",
    name: "Picanha na chapa (2 pessoas)",
    price: 149.9,
    category: "prato",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1639024471287-032f66e754d7?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1608270199187-57ee9281a027?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
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
    image:
      "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&w=800&q=80",
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
