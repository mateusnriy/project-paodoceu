import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import {
  Produto,
  ProdutoFormData,
  PaginatedResponse,
  ApiMeta,
} from '../types';
import { logError } from '../utils/logger';
import { useDebounce } from './useDebounce';
// Importar toast (RF24) - Assumindo que será implementado
// import { toast } from 'react-hot-toast';

export const useAdminProducts = () => {
  const [data, setData] = useState<Produto[]>([]);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const debouncedTermoBusca = useDebounce(termoBusca, 500);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const fetchAdminProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('pagina', String(pagina));
      params.append('limite', '10');
      if (debouncedTermoBusca) {
        params.append('termo', debouncedTermoBusca);
      }
      
      // *Nota: O backend deve ser ajustado para listar 'ativo: false' também
      // params.append('incluirInativos', 'true');

      const response = await api.get<PaginatedResponse<Produto>>(
        `/api/produtos?${params.toString()}`,
      );
      setData(response.data.dados);
      setMeta(response.data.meta);
    } catch (err) {
      logError('Erro ao buscar produtos (admin)', err);
      setError('Falha ao carregar produtos.');
    } finally {
      setIsLoading(false);
    }
  }, [pagina, debouncedTermoBusca]);

  useEffect(() => {
    fetchAdminProducts();
  }, [fetchAdminProducts]);

  // ... (handleCreate, handleUpdate, handleDelete - sem alteração)
  
  // --- Nova Função (RF22) ---
  const handleAdjustStock = async (
    produtoId: string,
    novaQuantidade: number,
  ) => {
    // Validação simples
    if (isNaN(novaQuantidade) || novaQuantidade < 0) {
      // toast.error('Quantidade inválida.');
      alert('Quantidade inválida.');
      return;
    }
    
    // Otimista (opcional, mas bom para UX)
    const stateAnterior = [...data];
    setData((prev) =>
      prev.map((p) =>
        p.id === produtoId ? { ...p, estoque: novaQuantidade } : p,
      ),
    );

    try {
      await api.patch(`/api/produtos/${produtoId}/estoque`, {
        quantidade: novaQuantidade,
      });
      // toast.success('Estoque atualizado!');
      
      // Se não for UI otimista, chamar fetchAdminProducts() aqui.
      
    } catch (err) {
      logError(`Erro ao ajustar estoque do produto ${produtoId}`, err);
      // toast.error('Falha ao ajustar estoque.');
      alert('Falha ao ajustar estoque.');
      // Rollback da UI otimista
      setData(stateAnterior);
    }
  };

  // (Funções CRUD omitidas para brevidade)
  const handleCreate = async (data: ProdutoFormData) => { /* ... */ };
  const handleUpdate = async (id: string, data: ProdutoFormData) => { /* ... */ };
  const handleDelete = async (id: string) => { /* ... */ };


  return {
    data,
    meta,
    isLoading,
    error,
    isMutating,
    mutationError,
    setPagina,
    setTermoBusca,
    termoBusca,
    fetchData: fetchAdminProducts,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleAdjustStock, // <--- EXPORTAR
  };
};
