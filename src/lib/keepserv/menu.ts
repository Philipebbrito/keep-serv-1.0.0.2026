import type { OrderItem } from "./types";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: OrderItem["category"];
}

/** Cardápio do bar/restaurante usado para montar novos pedidos. */
export const MENU: MenuItem[] = [
  // Pratos
  { id: "picanha", name: "Picanha na chapa (2 pessoas)", price: 149.9, category: "prato" },
  { id: "moqueca", name: "Moqueca de peixe", price: 118, category: "prato" },
  { id: "costela", name: "Costela no bafo 700g", price: 132, category: "prato" },
  { id: "risoto-camarao", name: "Risoto de camarão", price: 89, category: "prato" },
  { id: "hamburguer", name: "Hambúrguer artesanal 180g", price: 46, category: "prato" },
  { id: "parmegiana", name: "Filé à parmegiana", price: 92, category: "prato" },
  { id: "salmao", name: "Salmão grelhado", price: 96, category: "prato" },
  { id: "feijoada", name: "Feijoada individual", price: 68, category: "prato" },

  // Entradas
  { id: "farofa-bacon", name: "Farofa de bacon", price: 18, category: "entrada" },
  { id: "bolinho-bacalhau", name: "Bolinho de bacalhau (6un)", price: 42, category: "entrada" },
  { id: "batata-rustica", name: "Batata rústica", price: 29, category: "entrada" },
  { id: "onion-rings", name: "Onion rings", price: 26, category: "entrada" },

  // Bebidas
  { id: "chopp-pilsen", name: "Chopp Pilsen 500ml", price: 16.5, category: "bebida" },
  { id: "chopp-ipa", name: "Chopp IPA 500ml", price: 19.5, category: "bebida" },
  { id: "refrigerante", name: "Refrigerante lata", price: 9, category: "bebida" },
  { id: "agua-gas", name: "Água com gás", price: 8, category: "bebida" },
  { id: "suco-maracuja", name: "Suco de maracujá", price: 14, category: "bebida" },
  { id: "vinho-tinto", name: "Taça de vinho tinto", price: 32, category: "bebida" },
  { id: "caipirinha-limao", name: "Caipirinha de limão", price: 24, category: "bebida" },
  { id: "caipirinha-maracuja", name: "Caipirinha de maracujá", price: 26, category: "bebida" },
  { id: "espresso", name: "Espresso duplo", price: 11, category: "bebida" },

  // Sobremesas
  { id: "petit-gateau", name: "Petit gâteau", price: 28, category: "sobremesa" },
];

export const CATEGORY_LABEL: Record<OrderItem["category"], string> = {
  prato: "Pratos",
  entrada: "Entradas",
  bebida: "Bebidas",
  sobremesa: "Sobremesas",
};

export const CATEGORY_ORDER: OrderItem["category"][] = ["prato", "entrada", "bebida", "sobremesa"];
