// frontend/src/services/productService.ts
import api from './api';
import { Produto, PaginatedResponse, ProdutoFormData } from '@/types'; // Usar alias

// Interface para parâmetros de listagem
interface ListProductParams {
  pagina?: number;
  limite?: number;
  nome?: string;
  categoriaId?: string | 'todos';
}

export const productService = {
  /**
   * Lista produtos com paginação e filtros.
   */
  async list(params: ListProductParams): Promise<PaginatedResponse<Produto>> {
    const queryParams = new URLSearchParams();

    if (params.pagina) queryParams.append('pagina', String(params.pagina));
    if (params.limite) queryParams.append('limite', String(params.limite));
    if (params.nome) queryParams.append('nome', params.nome);
    if (params.categoriaId && params.categoriaId !== 'todos') {
      // (Suposição) O backend deve filtrar por 'categoria_id' ou 'categoriaId'
      queryParams.append('categoriaId', params.categoriaId);
    }

    const response = await api.get<PaginatedResponse<Produto>>(
      `/produtos?${queryParams.toString()}`,
    );

    // Converte 'preco' para number, pois o Prisma ORM pode retornar como string
    // O backend já retorna 'Decimal', mas o JSON o transforma em string.
    const data = response.data.data.map((produto) => ({
      ...produto,
      preco: Number(produto.preco),
    }));

    return {
      ...response.data,
      data,
    };
  },

  /**
   * Busca um produto pelo ID.
   */
  async getById(id: string): Promise<Produto> {
    const response = await api.get<Produto>(`/produtos/${id}`);
    return {
      ...response.data,
      preco: Number(response.data.preco),
    };
  },

  /**
   * Cria um novo produto.
   * Os tipos ProdutoFormData (frontend) já batem com o DTO do backend (snake_case)
   */
  async create(data: ProdutoFormData): Promise<Produto> {
    const response = await api.post<Produto>('/produtos', data);
    return {
      ...response.data,
      preco: Number(response.data.preco),
    };
  },

  /**
   * Atualiza um produto existente.
   */
  async update(id: string, data: Partial<ProdutoFormData>): Promise<Produto> {
    const response = await api.put<Produto>(`/produtos/${id}`, data);
    return {
      ...response.data,
      preco: Number(response.data.preco),
    };
  },

  /**
   * Ajusta o estoque de um produto (RF22).
   * O backend espera { "quantidade": number } (Validations/produtoValidation.ts)
   */
  async adjustStock(id: string, quantidade: number): Promise<Produto> {
    const response = await api.patch<Produto>(`/produtos/${id}/estoque`, {
      quantidade,
    });
    return {
      ...response.data,
      preco: Number(response.data.preco),
    };
  },

  /**
   * Deleta um produto pelo ID.
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/produtos/${id}`);
  },
};
