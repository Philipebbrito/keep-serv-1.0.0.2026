import type { Role } from "../orders/types";

export type NivelAcesso = "dev" | "gestor" | "colaborador" | "dono_loja";

export const NIVEL_LABEL: Record<NivelAcesso, string> = {
  dev: "Desenvolvedor (Super Admin)",
  gestor: "Gestor",
  dono_loja: "Gestor",
  colaborador: "Colaborador da Loja",
};

export const NIVEL_DESCRIPTION: Record<NivelAcesso, string> = {
  dev: "Acesso total e exclusivo ao cadastro e gestão de lojas cadastradas.",
  gestor: "Acesso total aos dados da sua própria loja e gestão exclusiva da sua equipe.",
  dono_loja: "Acesso total aos dados da sua própria loja e gestão exclusiva da sua equipe.",
  colaborador:
    "Acesso restrito apenas às operações rotineiras da loja (pedidos, cozinha ou caixa).",
};

export type StatusLoja = "ativo" | "inativo";

export interface Loja {
  id: string;
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
  codigo_loja: string; // único no sistema
  status: StatusLoja; // 'ativo' | 'inativo'
  created_at?: number;
  gestor_id?: string;
  dono_id?: string;
  cidade?: string;
  telefone?: string;
}

export interface UserAccount {
  id: string;
  loja_id: string | null; // Chave estrangeira para lojas.id (NULL para desenvolvedor 'dev')
  usuario: string; // Nome de usuário para login
  username: string; // alias para compatibilidade
  nome: string;
  name: string; // alias para retrocompatibilidade
  email: string;
  senha: string;
  password: string; // alias para retrocompatibilidade
  nivel: NivelAcesso; // 'dev' | 'gestor' | 'dono_loja' | 'colaborador'
  cargo?: Role; // Função operacional para colaboradores (garçom, cozinha, etc.)
  role: Role; // alias para compatibilidade com o sistema de pedidos
  phone: string;
  active: boolean;
  createdAt: number;
  lastPasswordChangeAt?: number;
  avatarColor?: string;
}

export interface NewLojaInput {
  nome_fantasia: string;
  codigo_loja: string;
  status?: StatusLoja;
  cidade?: string;
  telefone?: string;
}

export interface NewGestorInput {
  nome: string;
  usuario: string;
  senha: string;
  email: string;
  phone?: string;
}

export interface NewUserInput {
  name: string;
  usuario?: string;
  username?: string;
  email: string;
  phone: string;
  role: Role;
  password?: string;
  avatarColor?: string;
  loja_id?: string;
  nivel?: NivelAcesso;
}

export interface Session {
  id: string;
  name: string;
  nome: string;
  usuario?: string;
  username?: string;
  email: string;
  role: Role;
  cargo: Role;
  nivel: NivelAcesso;
  loja_id: string | null;
  loja: Loja | null;
  user: UserAccount;
}
