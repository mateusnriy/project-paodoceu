import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Produto, PaginatedResponse, ProdutoFormData } from '../types';
import { logError } from '../utils/logger';

export const useAdminProducts = (pagina: number, termoBusca: string) => {
  const [data, setData] = useState<PaginatedResponse<Produto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(async () => {
    // <<< CORREÇÃO DE LÓGICA: Mostrar loading apenas na primeira carga >>>
    if (!data) setIsLoading(true);
    // else setIsLoading(true); // Remover 'true' aqui evita o piscar
    setError(null);
    try {
      const params = {
        pagina: pagina,
        limite: 10, 
        nome: termoBusca || undefined,
      };
      const response = await api.get<PaginatedResponse<Produto>>('/produtos', {
        params,
      });
      setData(response.data);
    } catch (err) {
      setError(err); 
      logError('Erro ao (re)buscar produtos:', err, { pagina, termoBusca });
      setData(null); 
    } finally {
      setIsLoading(false); 
    }
  // <<< CORREÇÃO DE LOOP: Removido 'data' da dependência >>>
  }, [pagina, termoBusca]); 

  useEffect(() => {
    mutate();
  }, [mutate]); 

  // --- Funções de Mutação (CUD) ---
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<unknown>(null);

  const handleCreate = useCallback(async (data: ProdutoFormData): Promise<Produto> => {
    setIsMutating(true);      
    setMutationError(null);  
    try {
      const response = await api.post<Produto>('/produtos', data);
      return response.data; 
    } catch (err) {
      const message = getErrorMessage(err);
      setMutationError(err); 
      logError('Erro ao CRIAR produto:', err, { data });
      throw new Error(message); 
    } finally {
      setIsMutating(false);     
    }
  }, []); 

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
  }, []); 

  const handleDelete = useCallback(async (id: string): Promise<void> => {
     setIsMutating(true);
      setMutationError(null);
    try {
      await api.delete(`/produtos/${id}`);
    } catch (err) {
      const message = getErrorMessage(err);
      setMutationError(err);
      logError('Erro ao DELETAR produto:', err, { id });
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, []); 

  return {
    data,
    isLoading,
    error,
    mutate, 
    handleCreate,
    handleUpdate,
    handleDelete,
    isMutating,
    setIsMutating, 
    mutationError,
    setMutationError, 
  };
};
