import api from './api';
import { Usuario, PaginatedResponse, UsuarioFormData, PerfilUsuario } from '../types';

// Interface para parâmetros de listagem
interface ListUserParams {
    pagina?: number;
    limite?: number;
    nome?: string; // O backend busca por nome ou email com este parâmetro
}

export const userService = {
  /**
   * Lista usuários com paginação e filtro por nome/email (Admin).
   */
  async list(params: ListUserParams): Promise<PaginatedResponse<Usuario>> {
    const queryParams = new URLSearchParams();
    if (params.pagina) queryParams.append('pagina', String(params.pagina));
    if (params.limite) queryParams.append('limite', String(params.limite));
    if (params.nome) queryParams.append('nome', params.nome); // Backend usa 'nome' para buscar em nome/email

    // A rota /usuarios no backend já retorna dados paginados
    const response = await api.get<PaginatedResponse<Usuario>>(`/usuarios?${queryParams.toString()}`);
    // Assumindo que o backend retorna camelCase e omite a senha
    return response.data;
  },

  /**
   * Busca um usuário pelo ID (Admin).
   */
  async getById(id: string): Promise<Usuario> {
    const response = await api.get<Usuario>(`/usuarios/${id}`);
    // Assumindo que o backend retorna camelCase e omite a senha
    return response.data;
  },

  /**
   * Cria um novo usuário (Admin).
   * A senha é obrigatória.
   */
  async create(data: UsuarioFormData): Promise<Usuario> {
    if (!data.senha) {
      throw new Error("A senha é obrigatória para criar um novo usuário.");
    }
    const payload = {
        ...data,
        // Garante que o perfil seja enviado corretamente
        perfil: data.perfil || PerfilUsuario.ATENDENTE, // Default para segurança, embora o form envie
    };
    const response = await api.post<Usuario>('/usuarios', payload);
    // Assumindo que o backend retorna camelCase e omite a senha
    return response.data;
  },

  /**
   * Atualiza um usuário existente (Admin).
   * A senha é opcional; se não fornecida, não é alterada.
   */
  async update(id: string, data: Partial<UsuarioFormData>): Promise<Usuario> {
     // Remover senha se for uma string vazia para não tentar atualizar
     const payload: Partial<UsuarioFormData> = { ...data };
     if (payload.senha === '') {
       delete payload.senha;
     }

     const response = await api.put<Usuario>(`/usuarios/${id}`, payload);
     // Assumindo que o backend retorna camelCase e omite a senha
     return response.data;
  },

  /**
   * Deleta um usuário pelo ID (Admin).
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/usuarios/${id}`);
  },
};
