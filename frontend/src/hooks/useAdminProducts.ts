import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Produto, PaginatedResponse, ProdutoFormData } from '../types'; // Importa tipos necessários
import { logError } from '../utils/logger';

/**
 * @hook useAdminProducts
 * @description Hook para buscar e gerenciar dados paginados de Produtos.
 * Lida com data fetching (paginação, busca) e operações CUD (Create, Update, Delete).
 *
 * CORREÇÃO: Removido o subcomponente StatusBadge JSX que estava aqui incorretamente.
 *
 * @param pagina A página atual a ser buscada.
 * @param termoBusca O termo de busca (debounced).
 * @returns Um objeto contendo dados, estados de loading/erro, função mutate e handlers CUD.
 */
export const useAdminProducts = (pagina: number, termoBusca: string) => {
  // Estado para os dados paginados
  const [data, setData] = useState<PaginatedResponse<Produto> | null>(null);
  // Estado de loading para busca/paginação
  const [isLoading, setIsLoading] = useState(true);
  // Estado de erro para busca/paginação
  const [error, setError] = useState<unknown>(null);

  /**
   * @function mutate
   * @description Função para forçar a re-busca dos dados da página atual.
   * Geralmente chamada após uma mutação (create, update, delete).
   * Memoizada com useCallback.
   */
  const mutate = useCallback(async () => {
    // Só mostra loading na primeira busca ou se não houver dados
    if (!data) setIsLoading(true);
    setError(null); // Limpa erro anterior
    try {
      // Monta os parâmetros da query para a API
      const params = {
        pagina: pagina,
        limite: 10, // Limite fixo de 10 itens por página (pode ser configurável)
        nome: termoBusca || undefined, // Envia 'nome' apenas se termoBusca não for vazio
      };
      // Busca os produtos na API
      const response = await api.get<PaginatedResponse<Produto>>('/produtos', {
        params,
      });
      setData(response.data); // Atualiza o estado com os dados recebidos
    } catch (err) {
      // Em caso de erro na busca
      const message = getErrorMessage(err);
      setError(err); // Armazena o erro original
      logError('Erro ao (re)buscar produtos:', err, { pagina, termoBusca });
      setData(null); // Limpa dados antigos em caso de erro
    } finally {
      setIsLoading(false); // Finaliza o estado de loading da busca
    }
  }, [pagina, termoBusca, data]); // Depende da página, busca e se já tem dados (para loading inicial)

  // Efeito para executar a busca inicial e re-buscar quando página/busca mudam
  useEffect(() => {
    mutate();
  }, [mutate]); // A dependência `mutate` já inclui `pagina` e `termoBusca`

  // --- Funções de Mutação (CUD) ---
  // Estados para controlar o loading e erro das operações CUD separadamente
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<unknown>(null);

  /**
   * @function handleCreate
   * @description Cria um novo produto via API POST /produtos.
   * @param data Os dados do formulário do produto (ProdutoFormData).
   * @returns {Promise<Produto>} A promessa com o produto criado.
   * @throws {Error} Lança um erro se a API falhar.
   */
  const handleCreate = useCallback(async (data: ProdutoFormData): Promise<Produto> => {
    setIsMutating(true);      // Ativa loading da mutação
    setMutationError(null);  // Limpa erro anterior
    try {
      const response = await api.post<Produto>('/produtos', data);
      return response.data; // Retorna o produto criado
    } catch (err) {
      const message = getErrorMessage(err);
      setMutationError(err); // Armazena o erro da mutação
      logError('Erro ao CRIAR produto:', err, { data });
      throw new Error(message); // Relança o erro para a UI tratar
    } finally {
      setIsMutating(false);     // Desativa loading da mutação
    }
  }, []); // useCallback sem dependências, pois usa apenas API

  /**
   * @function handleUpdate
   * @description Atualiza um produto existente via API PUT /produtos/:id.
   * @param id O ID do produto a ser atualizado.
   * @param data Os dados do formulário do produto (ProdutoFormData).
   * @returns {Promise<Produto>} A promessa com o produto atualizado.
   * @throws {Error} Lança um erro se a API falhar.
   */
  const handleUpdate = useCallback(async (id: string, data: ProdutoFormData): Promise<Produto> => {
    setIsMutating(true);
      setMutationError(null);
    try {
      const response = await api.put<Produto>(`/produtos/${id}`, data);
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      setMutationError(err);
      logError('Erro ao ATUALIZAR produto:', err, { id, data });
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, []); // useCallback sem dependências

  /**
   * @function handleDelete
   * @description Deleta um produto via API DELETE /produtos/:id.
   * @param id O ID do produto a ser deletado.
   * @returns {Promise<void>} Promessa vazia.
   * @throws {Error} Lança um erro se a API falhar.
   */
  const handleDelete = useCallback(async (id: string): Promise<void> => {
     setIsMutating(true);
      setMutationError(null);
    try {
      await api.delete(`/produtos/${id}`);
      // Não retorna nada em caso de sucesso
    } catch (err) {
      const message = getErrorMessage(err);
      setMutationError(err);
      logError('Erro ao DELETAR produto:', err, { id });
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, []); // useCallback sem dependências

  // Retorna todos os estados e funções para a página consumir
  return {
    // Dados e estados da busca/paginação
    data,
    isLoading,
    error,
    mutate, // Função para revalidar
    // Funções CUD (para serem chamadas pela página)
    handleCreate,
    handleUpdate,
    handleDelete,
    // Estados das operações CUD (para feedback na UI)
    isMutating,
    setIsMutating, // Exporta o setter se a página precisar controlar
    mutationError,
    setMutationError, // Exporta o setter se a página precisar limpar/definir
  };
};
