import type { Loja, UserAccount } from "../../domain/team/types";
import { INITIAL_LOJAS, INITIAL_USERS } from "../mock/team.mock";

export interface ITeamRepository {
  listLojas(): Promise<Loja[]>;
  getLojaById(id: string): Promise<Loja | null>;
  getLojaByCodigo(code: string): Promise<Loja | null>;
  createLoja(loja: Loja): Promise<Loja>;
  updateLoja(id: string, data: Partial<Loja>): Promise<Loja>;
  deleteLoja(id: string): Promise<boolean>;

  listUsers(lojaId?: string | null): Promise<UserAccount[]>;
  getUserById(id: string): Promise<UserAccount | null>;
  getUserByUsernameOrEmail(identifier: string, lojaId?: string | null): Promise<UserAccount | null>;
  createUser(user: UserAccount): Promise<UserAccount>;
  updateUser(id: string, data: Partial<UserAccount>): Promise<UserAccount>;
  deleteUser(id: string): Promise<boolean>;
}

export class MockTeamRepository implements ITeamRepository {
  private lojas: Loja[] = [];
  private users: UserAccount[] = [];

  constructor() {
    this.lojas = [...INITIAL_LOJAS];
    this.users = [...INITIAL_USERS];
  }

  async listLojas(): Promise<Loja[]> {
    return [...this.lojas];
  }

  async getLojaById(id: string): Promise<Loja | null> {
    const item = this.lojas.find((l) => l.id === id);
    return item ? { ...item } : null;
  }

  async getLojaByCodigo(code: string): Promise<Loja | null> {
    const clean = code.trim().toUpperCase();
    const item = this.lojas.find((l) => l.codigo_loja.toUpperCase() === clean);
    return item ? { ...item } : null;
  }

  async createLoja(loja: Loja): Promise<Loja> {
    this.lojas.push(loja);
    return { ...loja };
  }

  async updateLoja(id: string, data: Partial<Loja>): Promise<Loja> {
    const idx = this.lojas.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Estabelecimento com ID ${id} não encontrado.`);
    this.lojas[idx] = { ...this.lojas[idx], ...data };
    return { ...this.lojas[idx] };
  }

  async deleteLoja(id: string): Promise<boolean> {
    const len = this.lojas.length;
    this.lojas = this.lojas.filter((l) => l.id !== id);
    return this.lojas.length < len;
  }

  async listUsers(lojaId?: string | null): Promise<UserAccount[]> {
    if (lojaId === undefined) return [...this.users];
    return this.users.filter((u) => u.loja_id === lojaId);
  }

  async getUserById(id: string): Promise<UserAccount | null> {
    const item = this.users.find((u) => u.id === id);
    return item ? { ...item } : null;
  }

  async getUserByUsernameOrEmail(
    identifier: string,
    lojaId?: string | null,
  ): Promise<UserAccount | null> {
    const clean = identifier.trim().toLowerCase();
    const found = this.users.find((u) => {
      const matchLogin =
        (u.usuario && u.usuario.toLowerCase() === clean) ||
        (u.username && u.username.toLowerCase() === clean) ||
        (u.email && u.email.toLowerCase() === clean);

      if (!matchLogin) return false;
      if (u.nivel === "dev") return true; // dev é global
      if (lojaId !== undefined && lojaId !== null) {
        return u.loja_id === lojaId;
      }
      return true;
    });

    return found ? { ...found } : null;
  }

  async createUser(user: UserAccount): Promise<UserAccount> {
    this.users.push(user);
    return { ...user };
  }

  async updateUser(id: string, data: Partial<UserAccount>): Promise<UserAccount> {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`Usuário com ID ${id} não encontrado.`);
    this.users[idx] = { ...this.users[idx], ...data };
    return { ...this.users[idx] };
  }

  async deleteUser(id: string): Promise<boolean> {
    const len = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    return this.users.length < len;
  }
}

export const teamRepository: ITeamRepository = new MockTeamRepository();
