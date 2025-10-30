// frontend/src/hooks/useAdminProducts.ts
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { productService } from '@/services/productService'; // (Causa 1)
import { Produto, ProdutoFormData, PaginatedResponse } from '@/types'; // CORREÇÃO (TS6133): ApiMeta removida
import { logError } from '@/utils/logger';
// import { useDebounce } from './useDebounce'; // (Causa 8 - Removido, página faz debounce)
import { getErrorMessage } from '@/utils/errors';

// CORREÇÃO (Causa 8): Hook aceita estado da página
export const useAdminProducts = (
  pagina: number,
  termoBusca: string,
  limit = 10,
) => {
  // const [data, setData] = useState<Produto[]>([]);
  // const [meta, setMeta] = useState<ApiMeta | null>(null);
  // CORREÇÃO (Causa 8): Armazena a resposta paginada completa
  const [paginatedResponse, setPaginatedResponse] =
    useState<PaginatedResponse<Produto> | null>(null);

  // (Causa 8): Remove gerenciamento interno de página/busca
  // const [pagina, setPagina] = useState(initialPage);
  // const [termoBusca, setTermoBusca] = useState('');
  // const debouncedTermoBusca = useDebounce(termoBusca, 500);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<unknown>(null);

  const fetchAdminProducts = useCallback(
    async (currentPage: number, currentSearch: string) => {
      // Evita piscar o loading se já houver dados
      if (!paginatedResponse) setIsLoading(true); // (Causa 8)
      setError(null);
      try {
        const params = {
          pagina: currentPage,
          limite: limit, // CORREÇÃO (Causa 8): Usar 'limit'
          nome: currentSearch || undefined,
        };
        const responseData = await productService.list(params);
        setPaginatedResponse(responseData); // (Causa 8)
        // setData(responseData.data); // (Removido)
        // setMeta(responseData.meta); // (Removido)
      } catch (err) {
        logError('Erro ao buscar produtos (admin)', err);
        setError(err);
        setPaginatedResponse(null); // (Causa 8)
      } finally {
        setIsLoading(false);
      }
    },
    [limit, paginatedResponse], // CORREÇÃO (Causa 8): Deps corretas
  );

  // Efeito para buscar dados quando pagina ou termo (debounced) mudam
  useEffect(() => {
    fetchAdminProducts(pagina, termoBusca); // (Causa 8) Usa args
  }, [pagina, termoBusca, fetchAdminProducts]); // (Causa 8) Usa args

  // (Causa 8) Efeito para voltar à página 1 é removido (agora é responsabilidade da página)

  // Função para revalidar dados (ex: após CUD)
  const mutate = useCallback(() => {
    fetchAdminProducts(pagina, termoBusca); // (Causa 8) Usa args
  }, [pagina, termoBusca, fetchAdminProducts]);

  // --- Funções CRUD ---
  const handleCreate = useCallback(
    async (formData: ProdutoFormData): Promise<Produto> => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const novoProduto = await productService.create(formData);
        toast.success('Produto criado com sucesso!');
        mutate(); // Revalida a lista
        return novoProduto;
      } catch (err) {
        setMutationError(err);
        logError('Erro ao CRIAR produto:', err, { formData });
        toast.error(`Erro ao criar produto: ${getErrorMessage(err)}`);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [mutate],
  );

  const handleUpdate = useCallback(
    async (id: string, formData: Partial<ProdutoFormData>): Promise<Produto> => {
      setIsMutating(true);
      setMutationError(null);
      try {
        const produtoAtualizado = await productService.update(id, formData);
        toast.success('Produto atualizado com sucesso!');
        mutate(); // Revalida a lista
        return produtoAtualizado;
      } catch (err) {
        setMutationError(err);
        logError('Erro ao ATUALIZAR produto:', err, { id, formData });
        toast.error(`Erro ao atualizar produto: ${getErrorMessage(err)}`);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [mutate],
  );

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      setIsMutating(true);
      setMutationError(null);
      try {
        await productService.delete(id);
        toast.success('Produto excluído com sucesso!');
        // (Causa 8) A lógica de mudança de página é tratada pela página (AdminProducts.tsx)
        mutate(); // Apenas revalida
      } catch (err) {
        setMutationError(err);
        logError('Erro ao DELETAR produto:', err, { id });
        toast.error(`Erro ao excluir produto: ${getErrorMessage(err)}`);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [mutate], // (Causa 8) Remove dependência de 'pagina' e 'data'
  );

  // --- Função Ajuste Rápido de Estoque (RF22) ---
  const handleAdjustStock = useCallback(
    async (produtoId: string, novaQuantidade: number) => {
      if (isNaN(novaQuantidade) || novaQuantidade < 0) {
        toast.error('Quantidade inválida.');
        return;
      }

      const produtoOriginal = paginatedResponse?.data.find(
        (p) => p.id === produtoId,
      );
      if (!produtoOriginal) return;

      // UI Otimista
      setPaginatedResponse((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          data: prev.data.map((p) =>
            p.id === produtoId ? { ...p, estoque: novaQuantidade } : p,
          ),
        };
      });
      setIsMutating(true);

      try {
        await productService.adjustStock(produtoId, novaQuantidade);
        toast.success('Estoque atualizado!');
      } catch (err) {
        logError(`Erro ao ajustar estoque do produto ${produtoId}`, err);
        toast.error(`Falha ao ajustar estoque: ${getErrorMessage(err)}`);
        // Rollback da UI otimista
        setPaginatedResponse((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            data: prev.data.map((p) =>
              p.id === produtoId ? produtoOriginal : p,
            ),
          };
        });
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [paginatedResponse], // (Causa 8)
  );

  return {
    data: paginatedResponse, // CORREÇÃO (Causa 8): Retorna o objeto paginado
    isLoading,
    error: error ? getErrorMessage(error) : null,
    isMutating,
    mutationError: mutationError ? getErrorMessage(mutationError) : null,
    setMutationError,
    fetchData: mutate, // Renomeia mutate
    handleCreate,
    handleUpdate,
    handleDelete,
    handleAdjustStock,
    // (Causa 8) Remove setPagina e setTermoBusca, pois são gerenciados pela página
  };
};
