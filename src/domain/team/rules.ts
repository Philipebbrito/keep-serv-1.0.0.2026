import type { Role } from "../orders/types";
import type { NewGestorInput, NewLojaInput, NewUserInput, NivelAcesso } from "./types";

/**
 * Validação do nome de usuário para login (mínimo 3 caracteres, sem espaços, alfanumérico e pontos).
 */
export function validarUsuario(usuario: string): { valid: boolean; message?: string } {
  const clean = (usuario || "").trim().toLowerCase();
  if (!clean) {
    return { valid: false, message: "O nome de usuário é obrigatório." };
  }
  if (clean.length < 3) {
    return { valid: false, message: "O usuário deve ter pelo menos 3 caracteres." };
  }
  if (!/^[a-z0-9._-]+$/.test(clean)) {
    return {
      valid: false,
      message: "O usuário só pode conter letras, números, pontos, hífens ou underlines.",
    };
  }
  return { valid: true };
}

/**
 * Validação de senha segura (mínimo 4 caracteres).
 */
export function validarSenha(senha: string): { valid: boolean; message?: string } {
  if (!senha || senha.trim().length < 4) {
    return { valid: false, message: "A senha deve ter no mínimo 4 caracteres." };
  }
  return { valid: true };
}

/**
 * Validação de e-mail para recuperação de senha.
 */
export function validarEmail(email: string): boolean {
  if (!email || !email.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Verifica permissões de acesso por nível (RBAC) e cargo operacional.
 */
export function podeAcessarModulo(
  nivel: NivelAcesso,
  cargo: Role | undefined,
  modulo:
    | "painel_dev"
    | "gestao_loja"
    | "pedidos"
    | "cozinha"
    | "caixa"
    | "financeiro"
    | "cardapio"
    | "estoque"
    | "equipe"
    | "clientes",
): boolean {
  // Desenvolvedor tem acesso à gestão global e painel dev
  if (nivel === "dev") {
    return modulo === "painel_dev";
  }

  // Gestor ou dono de loja tem acesso completo ao seu tenant
  if (nivel === "gestor" || nivel === "dono_loja") {
    return modulo !== "painel_dev";
  }

  // Colaborador tem acesso baseado no seu cargo operacional
  switch (cargo) {
    case "garcom":
      return modulo === "pedidos" || modulo === "cardapio" || modulo === "clientes";
    case "cozinha":
      return modulo === "cozinha" || modulo === "estoque" || modulo === "cardapio";
    case "caixa":
      return modulo === "caixa" || modulo === "pedidos" || modulo === "financeiro";
    case "gestor":
      return modulo !== "painel_dev";
    default:
      return false;
  }
}

/**
 * Valida a criação de um novo estabelecimento com seu gestor inicial.
 */
export function validarNovaLoja(
  lojaInput: NewLojaInput,
  gestorInput: NewGestorInput,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!lojaInput.nome_fantasia || !lojaInput.nome_fantasia.trim()) {
    errors.push("O nome fantasia do estabelecimento é obrigatório.");
  }
  if (!lojaInput.codigo_loja || !lojaInput.codigo_loja.trim()) {
    errors.push("O código único da loja é obrigatório.");
  }

  const userValidation = validarUsuario(gestorInput.usuario);
  if (!userValidation.valid && userValidation.message) {
    errors.push(userValidation.message);
  }

  const passValidation = validarSenha(gestorInput.senha);
  if (!passValidation.valid && passValidation.message) {
    errors.push(passValidation.message);
  }

  if (!validarEmail(gestorInput.email)) {
    errors.push("Um e-mail válido para o gestor é obrigatório para recuperação de senha.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida o formulário de cadastro de um novo colaborador.
 */
export function validarNovoColaborador(input: NewUserInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.name || !input.name.trim()) {
    errors.push("O nome completo do colaborador é obrigatório.");
  }
  if (!validarEmail(input.email)) {
    errors.push("O e-mail do colaborador é obrigatório e deve ser válido.");
  }
  if (!input.phone || !input.phone.trim()) {
    errors.push("O telefone ou WhatsApp do colaborador é obrigatório.");
  }
  if (!input.role) {
    errors.push("Selecione o cargo/função operacional.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
