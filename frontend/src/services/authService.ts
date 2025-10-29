// frontend/src/services/authService.ts
import api from './api';
import { AuthUsuario, LoginPayload, RegisterPayload } from '../types';

export const authService = {
  /**
   * Verifica se existe algum usuário administrador no sistema. RF15
   */
  async checkFirstUser(): Promise<{ hasMaster: boolean }> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.get<{ hasMaster: boolean }>('/auth/check-first');
    return response.data;
  },

  /**
   * Realiza o login do usuário. RF01
   */
  async login(payload: LoginPayload): Promise<AuthUsuario> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.post<{ usuario: AuthUsuario }>('/auth/login', payload);
    // Assumindo que backend retorna AuthUsuario com snake_case (se Usuario for snake_case)
    return response.data.usuario;
  },

  /**
   * Registra um novo usuário. RF15
   */
  async register(payload: RegisterPayload): Promise<{ usuario: AuthUsuario; message?: string }> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.post<{ usuario: AuthUsuario; message?: string }>('/auth/register', payload);

    if (!response.data.usuario && response.data.message) {
      // Caso especial: usuário criado inativo
       return { usuario: {} as AuthUsuario, message: response.data.message }; // Retorna obj vazio e msg
    }
    if (!response.data.usuario) {
        throw new Error("Resposta inesperada do servidor durante o registro.");
    }
    // Assumindo que backend retorna AuthUsuario com snake_case
    return { usuario: response.data.usuario, message: response.data.message };
  },

  /**
   * Realiza o logout do usuário.
   */
  async logout(): Promise<{ message: string }> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  /**
   * Busca os dados do usuário autenticado atualmente.
   */
  async getCurrentUser(): Promise<AuthUsuario> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.get<AuthUsuario>('/auth/me');
    // Assumindo que backend retorna AuthUsuario com snake_case
    return response.data;
  },

  // ADDED: Função para atualizar o próprio perfil (RF18, UC13)
  /**
   * Atualiza os dados (nome, senha) do próprio usuário logado.
   */
  async updateOwnProfile(payload: { nome?: string; currentPassword: string; newPassword?: string }): Promise<AuthUsuario> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.put<AuthUsuario>('/auth/profile', payload);
    return response.data;
  }
};
