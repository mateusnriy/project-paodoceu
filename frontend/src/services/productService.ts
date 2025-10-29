// frontend/src/services/productService.ts
import api from './api';
import { Produto, PaginatedResponse, ProdutoFormData } from '../types';

// Interface para parâmetros de listagem
interface ListProductParams {
  pagina?: number;
  limite?: number;
  nome?: string; // Backend usa 'nome' para buscar em nome/email/desc
  categoriaId?: string | 'todos';
  // incluirInativos?: boolean; // Backend Admin agora inclui por padrão
}

// Função auxiliar para mapear FormData (camelCase ou snake_case) para API (snake_case)
// Se ProdutoFormData já for snake_case, este mapeamento é mais simples.
const mapFormDataToApi = (data: Partial<ProdutoFormData>): any => {
  const payload: any = {};
  // Mapeia os campos garantindo snake_case
  if (data.nome !== undefined) payload.nome = data.nome;
  if (data.descricao !== undefined) payload.descricao = data.descricao || null; // Envia null se vazio
  if (data.preco !== undefined) payload.preco = Number(data.preco);
  if (data.estoque !== undefined) payload.estoque = Number(data.estoque); // Usa 'estoque'
  if (data.categoria_id !== undefined) payload.categoria_id = data.categoria_id; // Usa 'categoria_id'
  if (data.imagem_url !== undefined) payload.imagem_url = data.imagem_url || null; // Usa 'imagem_url', envia null se vazio
  if (data.ativo !== undefined) payload.ativo = data.ativo;

  return payload;
};

// Função auxiliar para mapear resposta da API (snake_case) para Tipo Frontend (snake_case)
// Se os tipos já são snake_case, este mapeamento é direto.
const mapProdutoFromApi = (apiProduto: any): Produto => ({
  id: apiProduto.id,
  nome: apiProduto.nome,
  preco: Number(apiProduto.preco), // Garante que seja número
  estoque: apiProduto.estoque,
  imagem_url: apiProduto.imagem_url,
  descricao: apiProduto.descricao,
  categoria: apiProduto.categoria, // Assumindo que a categoria já vem correta
  categoria_id: apiProduto.categoria_id,
  criado_em: apiProduto.criado_em,
  atualizado_em: apiProduto.atualizado_em,
  ativo: apiProduto.ativo,
});

export const productService = {
  /**
   * Lista produtos com paginação e filtros.
   */
  async list(params: ListProductParams): Promise<PaginatedResponse<Produto>> {
    const queryParams = new URLSearchParams();

    if (params.pagina) queryParams.append('pagina', String(params.pagina));
    if (params.limite) queryParams.append('limite', String(params.limite));
    if (params.nome) queryParams.append('nome', params.nome); // Backend usa 'nome'
    if (params.categoriaId && params.categoriaId !== 'todos') {
      queryParams.append('categoriaId', params.categoriaId); // Backend pode precisar de outro nome aqui
    }

    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.get<PaginatedResponse<any>>(`/produtos?${queryParams.toString()}`);

    // Mapeia a resposta para o tipo do frontend
    return {
      ...response.data,
      data: response.data.data.map(mapProdutoFromApi),
    };
  },

  /**
   * Busca um produto pelo ID.
   */
  async getById(id: string): Promise<Produto> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.get<any>(`/produtos/${id}`);
    return mapProdutoFromApi(response.data);
  },

  /**
   * Cria um novo produto.
   */
  async create(data: ProdutoFormData): Promise<Produto> {
    const payload = mapFormDataToApi(data);
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.post<any>('/produtos', payload);
    return mapProdutoFromApi(response.data);
  },

  /**
   * Atualiza um produto existente.
   */
  async update(id: string, data: Partial<ProdutoFormData>): Promise<Produto> {
    const payload = mapFormDataToApi(data);
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.put<any>(`/produtos/${id}`, payload);
    return mapProdutoFromApi(response.data);
  },

  /**
   * Ajusta o estoque de um produto (RF22).
   */
  async adjustStock(id: string, quantidade: number): Promise<Produto> {
    // Correção A.1: Backend espera { "estoque": number } (ajustado no backend para esperar 'quantidade' como no código original)
    // Se backend esperar 'estoque', mudar aqui para { estoque: quantidade }
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.patch<any>(`/produtos/${id}/estoque`, { quantidade });
    return mapProdutoFromApi(response.data);
  },

  /**
   * Deleta um produto pelo ID.
   */
  async delete(id: string): Promise<void> {
    // Correção A.3: Chamada SEM /api duplicado
    await api.delete(`/produtos/${id}`);
  },
};
