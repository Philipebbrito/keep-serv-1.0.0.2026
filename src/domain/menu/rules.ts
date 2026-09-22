import type { MenuCategory, MenuItem, NewProductInput } from "./types";

/**
 * Filtra produtos do cardápio por categoria e status de ativação.
 */
export function filtrarProdutos(
  produtos: MenuItem[],
  categoria?: MenuCategory | "todos",
  apenasAtivos = false,
): MenuItem[] {
  return produtos.filter((p) => {
    if (apenasAtivos && !p.active) return false;
    if (categoria && categoria !== "todos" && p.category !== categoria) return false;
    return true;
  });
}

/**
 * Calcula preço promocional com percentual de desconto.
 */
export function calcularPrecoComDesconto(preco: number, percentualDesconto: number): number {
  if (preco <= 0 || percentualDesconto <= 0) return preco;
  const fator = Math.max(0, 1 - percentualDesconto / 100);
  return Number((preco * fator).toFixed(2));
}

/**
 * Verifica se um produto está configurado para baixa automática de estoque.
 */
export function produtoConsomeEstoque(produto: MenuItem): boolean {
  if (produto.stockConsumption === "direct") {
    return Boolean(produto.linkedStockItemId);
  }
  if (produto.stockConsumption === "recipe") {
    return Boolean(produto.recipeIngredients && produto.recipeIngredients.length > 0);
  }
  return false;
}

/**
 * Validação de regras para cadastro e atualização de item do cardápio.
 */
export function validarProduto(input: NewProductInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.name || !input.name.trim()) {
    errors.push("O nome do item é obrigatório.");
  }
  if (input.price < 0) {
    errors.push("O preço de venda não pode ser negativo.");
  }
  if (!input.category) {
    errors.push("A categoria do produto é obrigatória.");
  }

  if (input.stockConsumption === "direct") {
    if (!input.linkedStockItemId) {
      errors.push("Selecione o item do estoque vinculado para consumo direto.");
    }
  } else if (input.stockConsumption === "recipe") {
    if (!input.recipeIngredients || input.recipeIngredients.length === 0) {
      errors.push("Adicione ao menos um ingrediente na ficha técnica da receita.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
