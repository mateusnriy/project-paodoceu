import api from './api';
import { Categoria, PaginatedResponse } from '../types';

interface ListCategoryParams {
    pagina?: number;
    limite?: number;
    nome?: string;
}

export const categoryService = {
  /**
   * Lista categorias com paginação e filtro por nome (usado no Admin).
   */
  async listPaginated(params: ListCategoryParams): Promise<PaginatedResponse<Categoria>> {
    const queryParams = new URLSearchParams();
    if (params.pagina) queryParams.append('pagina', String(params.pagina));
    if (params.limite) queryParams.append('limite', String(params.limite));
    if (params.nome) queryParams.append('nome', params.nome);

    const response = await api.get<PaginatedResponse<Categoria>>(`/categorias?${queryParams.toString()}`);
    // Assumindo que backend retorna camelCase ou Axios transforma
    return response.data;
  },

  /**
   * Lista todas as categorias (usado no POS).
   * O backend diferencia pela ausência do parâmetro 'pagina'.
   */
   async listAll(): Promise<Categoria[]> {
     // A requisição GET /categorias sem paginação retorna a lista completa
     const response = await api.get<Categoria[]>('/categorias');
     // Assumindo que backend retorna camelCase ou Axios transforma
     return response.data;
   },


  /**
   * Busca uma categoria pelo ID.
   */
  async getById(id: string): Promise<Categoria> {
    const response = await api.get<Categoria>(`/categorias/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova categoria.
   */
  async create(data: { nome: string }): Promise<Categoria> {
    const response = await api.post<Categoria>('/categorias', data);
    return response.data;
  },

  /**
   * Atualiza uma categoria existente.
   */
  async update(id: string, data: { nome?: string }): Promise<Categoria> {
     const response = await api.put<Categoria>(`/categorias/${id}`, data);
     return response.data;
  },

  /**
   * Deleta uma categoria pelo ID.
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/categorias/${id}`);
  },
};
