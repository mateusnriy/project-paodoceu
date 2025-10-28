import api from './api';
import { AuthUsuario, LoginPayload, RegisterPayload } from '../types'; // Importar tipos relevantes

export const authService = {
  /**
   * Verifica se existe algum usuário administrador no sistema.
   * Usado antes de exibir a tela de Registro pela primeira vez.
   */
  async checkFirstUser(): Promise<{ hasAdmin: boolean }> {
    // O backend retorna { hasAdmin: boolean }
    const response = await api.get<{ hasAdmin: boolean }>('/auth/check-first');
    return response.data;
  },

  /**
   * Realiza o login do usuário.
   * O backend define os cookies HttpOnly e CSRF em caso de sucesso.
   * Retorna os dados do usuário logado (sem senha).
   */
  async login(payload: LoginPayload): Promise<AuthUsuario> {
    // O backend retorna { usuario: AuthUsuario }
    const response = await api.post<{ usuario: AuthUsuario }>('/auth/login', payload);
    return response.data.usuario;
  },

  /**
   * Registra um novo usuário.
   * O backend define o perfil (ADMINISTRADOR se for o primeiro, ATENDENTE senão)
   * e o status (ativo apenas para o primeiro admin).
   * O backend define os cookies HttpOnly e CSRF se o registro for bem-sucedido E o usuário ficar ativo (primeiro admin).
   * Retorna os dados do usuário criado (sem senha).
   */
  async register(payload: RegisterPayload): Promise<AuthUsuario> {
    // O backend pode retornar 201 com { usuario } ou { message } se o usuário ficar inativo
    const response = await api.post<{ usuario: AuthUsuario; message?: string }>('/auth/register', payload);

    // Se criou um usuário inativo (atendente), a API pode retornar uma mensagem em vez do usuário completo.
    // Lançamos um erro customizado para o AuthContext tratar.
    if (response.data.message && !response.data.usuario) {
        throw new Error(response.data.message); // Ex: "Usuário registrado com sucesso. Aguarde ativação..."
    }
    if (!response.data.usuario) {
        throw new Error("Resposta inesperada do servidor durante o registro.");
    }

    return response.data.usuario;
  },

  /**
   * Realiza o logout do usuário.
   * O backend invalida/limpa os cookies HttpOnly e CSRF.
   */
  async logout(): Promise<{ message: string }> {
    // O backend retorna { message: '...' }
    const response = await api.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  /**
   * Busca os dados do usuário autenticado atualmente.
   * Usa o cookie HttpOnly enviado automaticamente pelo navegador.
   * Retorna os dados do usuário (sem senha) ou lança erro 401 se não autenticado.
   */
  async getCurrentUser(): Promise<AuthUsuario> {
    const response = await api.get<AuthUsuario>('/auth/me');
    return response.data;
  },
};
