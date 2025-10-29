// frontend/src/hooks/useAdminProducts.ts
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast'; // Correção B.1
import { productService } from '../services/productService'; // Correção B.2
import { Produto, ProdutoFormData, PaginatedResponse, ApiMeta } from '../types'; // Tipos já corrigidos (A.1)
import { logError } from '../utils/logger';
import { useDebounce } from './useDebounce';
import { getErrorMessage } from '../utils/errors';

export const useAdminProducts = (initialPage = 1, limit = 10) => {
  const [data, setData] = useState<Produto[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [pagina, setPagina] = useState(initialPage);
  const [termoBusca, setTermoBusca] = useState('');
  const debouncedTermoBusca = useDebounce(termoBusca, 500);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null); // Armazena erro original
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<unknown>(null); // Erro original da mutação

  const fetchAdminProducts = useCallback(async (currentPage: number, currentSearch: string) => {
    // Evita piscar o loading se já houver dados
    if (data.length === 0) setIsLoading(true);
    setError(null);
    try {
      const params = {
        pagina: currentPage,
        limite,
        nome: currentSearch || undefined, // Backend usa 'nome' para busca
      };
      // Correção B.2: Usar productService
      const responseData = await productService.list(params);
      // Correção A.6: Acessar responseData.data (já mapeado pelo service)
      setData(responseData.data);
      setMeta(responseData.meta);
    } catch (err) {
      logError('Erro ao buscar produtos (admin)', err);
      setError(err); // Armazena erro original
      setData([]); // Limpa dados em caso de erro
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [limite, data.length]); // Inclui data.length para reavaliar loading inicial

  // Efeito para buscar dados quando pagina ou termo (debounced) mudam
  useEffect(() => {
    fetchAdminProducts(pagina, debouncedTermoBusca);
  }, [pagina, debouncedTermoBusca, fetchAdminProducts]);

  // Efeito para voltar à página 1 quando a busca muda
  useEffect(() => {
    setPagina(1);
  }, [debouncedTermoBusca]);

  // Função para revalidar dados (ex: após CUD)
  const mutate = useCallback(() => {
    fetchAdminProducts(pagina, debouncedTermoBusca);
  }, [pagina, debouncedTermoBusca, fetchAdminProducts]);

  // --- Funções CRUD ---
  const handleCreate = useCallback(async (formData: ProdutoFormData): Promise<Produto> => {
    setIsMutating(true);
    setMutationError(null);
    try {
      // Correção B.2: Usar productService
      const novoProduto = await productService.create(formData);
      toast.success('Produto criado com sucesso!'); // Correção B.1
      mutate(); // Revalida a lista
      return novoProduto;
    } catch (err) {
      setMutationError(err);
      logError('Erro ao CRIAR produto:', err, { formData });
      toast.error(`Erro ao criar produto: ${getErrorMessage(err)}`); // Correção B.1
      throw err; // Re-lança para o modal tratar se necessário
    } finally {
      setIsMutating(false);
    }
  }, [mutate]);

  const handleUpdate = useCallback(async (id: string, formData: Partial<ProdutoFormData>): Promise<Produto> => {
    setIsMutating(true);
    setMutationError(null);
    try {
      // Correção B.2: Usar productService
      const produtoAtualizado = await productService.update(id, formData);
      toast.success('Produto atualizado com sucesso!'); // Correção B.1
      mutate(); // Revalida a lista
      return produtoAtualizado;
    } catch (err) {
      setMutationError(err);
      logError('Erro ao ATUALIZAR produto:', err, { id, formData });
      toast.error(`Erro ao atualizar produto: ${getErrorMessage(err)}`); // Correção B.1
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [mutate]);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    setIsMutating(true);
    setMutationError(null);
    try {
      // Correção B.2: Usar productService
      await productService.delete(id);
      toast.success('Produto excluído com sucesso!'); // Correção B.1
      // Verifica se a página atual ficará vazia após a exclusão
      if (data.length === 1 && pagina > 1) {
        setPagina(pagina - 1); // Volta para a página anterior
      } else {
        mutate(); // Revalida a página atual
      }
    } catch (err) {
      setMutationError(err);
      logError('Erro ao DELETAR produto:', err, { id });
      toast.error(`Erro ao excluir produto: ${getErrorMessage(err)}`); // Correção B.1
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [mutate, pagina, data.length]);

  // --- Função Ajuste Rápido de Estoque (RF22) ---
  const handleAdjustStock = useCallback(async (
    produtoId: string,
    novaQuantidade: number,
  ) => {
    if (isNaN(novaQuantidade) || novaQuantidade < 0) {
      toast.error('Quantidade inválida.'); // Correção B.1
      return; // Retorna void, não precisa lançar erro aqui
    }

    const produtoOriginal = data.find(p => p.id === produtoId);
    if (!produtoOriginal) return;

    // UI Otimista
    setData((prev) =>
      prev.map((p) =>
        p.id === produtoId ? { ...p, estoque: novaQuantidade } : p,
      ),
    );
    setIsMutating(true); // Indica que uma mutação está ocorrendo

    try {
      // Correção B.2: Usar productService
      await productService.adjustStock(produtoId, novaQuantidade);
      toast.success('Estoque atualizado!'); // Correção B.1
      // Não precisa chamar mutate() aqui se a UI otimista funcionou
    } catch (err) {
      logError(`Erro ao ajustar estoque do produto ${produtoId}`, err);
      toast.error(`Falha ao ajustar estoque: ${getErrorMessage(err)}`); // Correção B.1
      // Rollback da UI otimista
      setData((prev) =>
        prev.map((p) =>
          p.id === produtoId ? produtoOriginal : p // Volta ao estado original
        ),
      );
      throw err; // Re-lança para o componente QuickStockAdjust tratar se necessário
    } finally {
      setIsMutating(false);
    }
  }, [data]); // Dependência 'mutate' removida pois não é mais chamada aqui

  return {
    produtos: data, // Renomeado para clareza
    meta,
    isLoading,
    error: error ? getErrorMessage(error) : null, // Retorna string de erro formatada
    isMutating,
    mutationError: mutationError ? getErrorMessage(mutationError) : null, // Retorna string de erro formatada
    setMutationError, // Para limpar no modal
    pagina, // Exporta página atual
    setPagina: irParaPagina, // Renomeia para clareza
    setTermoBusca,
    termoBusca,
    fetchData: mutate, // Renomeia mutate para fetchData para consistência externa
    handleCreate,
    handleUpdate,
    handleDelete,
    handleAdjustStock,
  };
};

// Helper fora do hook para setPagina
function irParaPagina(this: any, novaPagina: number) {
    if (novaPagina > 0 && (!this.meta || novaPagina <= this.meta.totalPaginas)) {
        this.setPagina(novaPagina);
    }
}
