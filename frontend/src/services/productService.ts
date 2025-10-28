import api from './api';
import { Produto, PaginatedResponse, ProdutoFormData, Categoria } from '../types';

// Interface para parâmetros de listagem
interface ListProductParams {
    pagina?: number;
    limite?: number;
    termo?: string;
    categoriaId?: string | 'todos'; // Aceitar 'todos'
    // incluirInativos?: boolean; // Se for implementar no backend
}

export const productService = {
  /**
   * Lista produtos com paginação e filtros.
   */
  async list(params: ListProductParams): Promise<PaginatedResponse<Produto>> {
    const queryParams = new URLSearchParams();

    // Adiciona parâmetros à query string se eles existirem
    if (params.pagina) queryParams.append('pagina', String(params.pagina));
    if (params.limite) queryParams.append('limite', String(params.limite));
    if (params.termo) queryParams.append('termo', params.termo);
    // Só adiciona categoriaId se não for 'todos' e existir
    if (params.categoriaId && params.categoriaId !== 'todos') {
        queryParams.append('categoriaId', params.categoriaId);
    }
    // Adicionar outros filtros como 'incluirInativos' se necessário

    const response = await api.get<PaginatedResponse<Produto>>(`/produtos?${queryParams.toString()}`);

    // Nota: Assumindo que o backend já retorna camelCase ou o interceptor do Axios faz a transformação.
    // Se o backend retornar snake_case (e.g., imagem_url, categoria_id, quantidade_estoque),
    // seria necessário mapear os dados aqui antes de retornar. Exemplo:
    // return {
    //   ...response.data,
    //   data: response.data.data.map(mapProdutoFromApi) // Usaria uma função mapProdutoFromApi
    // };
    return response.data;
  },

  /**
   * Busca um produto pelo ID.
   */
  async getById(id: string): Promise<Produto> {
    const response = await api.get<Produto>(`/produtos/${id}`);
    // Mapear se necessário
    return response.data;
  },

  /**
   * Cria um novo produto.
   */
  async create(data: ProdutoFormData): Promise<Produto> {
    // Garante que números sejam enviados como números
    const payload = {
      ...data,
      preco: Number(data.preco),
      quantidadeEstoque: Number(data.quantidadeEstoque),
      // Remover campos vazios opcionais para evitar enviar strings vazias
      descricao: data.descricao || undefined,
      imagemUrl: data.imagemUrl || undefined,
    };
    const response = await api.post<Produto>('/produtos', payload);
    // Mapear se necessário
    return response.data;
  },

  /**
   * Atualiza um produto existente.
   */
  async update(id: string, data: Partial<ProdutoFormData>): Promise<Produto> {
     // Garante que números sejam enviados como números, se presentes
     const payload: Partial<ProdutoFormData> = {};
     for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const typedKey = key as keyof ProdutoFormData;
            if (typedKey === 'preco' && data.preco !== undefined) {
                payload.preco = Number(data.preco);
            } else if (typedKey === 'quantidadeEstoque' && data.quantidadeEstoque !== undefined) {
                payload.quantidadeEstoque = Number(data.quantidadeEstoque);
            } else if (typedKey === 'descricao') {
                 payload.descricao = data.descricao || undefined; // Enviar undefined se vazio
            } else if (typedKey === 'imagemUrl') {
                 payload.imagemUrl = data.imagemUrl || undefined; // Enviar undefined se vazio
            } else {
                 (payload as any)[typedKey] = data[typedKey];
            }
        }
     }

     const response = await api.put<Produto>(`/produtos/${id}`, payload);
     // Mapear se necessário
     return response.data;
  },

  /**
   * Ajusta o estoque de um produto.
   */
  async adjustStock(id: string, quantidade: number): Promise<Produto> {
      // O backend espera um objeto { quantidade: number } no body
      const response = await api.patch<Produto>(`/produtos/${id}/estoque`, { quantidade });
      // Mapear se necessário
      return response.data;
  },

  /**
   * Deleta um produto pelo ID.
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/produtos/${id}`);
  },
};

// Exemplo de função de mapeamento (descomentar e ajustar se backend retornar snake_case)
/*
const mapProdutoFromApi = (apiProduto: any): Produto => ({
    id: apiProduto.id,
    nome: apiProduto.nome,
    preco: apiProduto.preco,
    quantidadeEstoque: apiProduto.estoque, // Mapeamento estoque -> quantidadeEstoque
    imagemUrl: apiProduto.imagem_url || null, // Mapeamento imagem_url -> imagemUrl
    descricao: apiProduto.descricao,
    categoria: mapCategoriaFromApi(apiProduto.categoria), // Mapear categoria aninhada
    categoriaId: apiProduto.categoria_id, // Mapeamento categoria_id -> categoriaId
    criado_em: apiProduto.criado_em,
    atualizado_em: apiProduto.atualizado_em,
    // ativo: apiProduto.ativo, // Adicionar se o backend retornar e for útil no frontend
});

const mapCategoriaFromApi = (apiCategoria: any): Categoria => ({
    id: apiCategoria.id,
    nome: apiCategoria.nome,
    criado_em: apiCategoria.criado_em,
    atualizado_em: apiCategoria.atualizado_em,
    _count: apiCategoria._count,
});
*/