// src/hooks/useAdminCategories.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // CORREÇÃO (TS2614): Importação default
// import { getErrorMessage } from '../utils/errors'; // REMOVIDO
import { Categoria, PaginatedResponse } from '../types';
import { logError } from '../utils/logger';

interface CategoriaFormData {
    nome: string;
}

const ITEMS_PER_PAGE = 10;

export const useAdminCategories = (pagina: number, termoBusca: string, limite: number = ITEMS_PER_PAGE) => {
  const [data, setData] = useState<PaginatedResponse<Categoria> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<unknown>(null);

  const loadCategories = useCallback(async () => {
     if (!data) setIsLoading(true);
     setError(null);
     try {
        const params = { pagina, limite, nome: termoBusca || undefined };
        const response = await api.get<PaginatedResponse<Categoria>>('/categorias', { params });
        setData(response.data);
     } catch (err) {
        setError(err);
        logError('Erro ao carregar categorias:', err, { pagina, termoBusca });
        setData(null);
     } finally {
        setIsLoading(false);
     }
  }, [pagina, limite, termoBusca, data]); 

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const mutate = useCallback(() => {
      loadCategories();
  }, [loadCategories]);

  const handleCreate = useCallback(async (formData: CategoriaFormData): Promise<Categoria> => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const response = await api.post<Categoria>('/categorias', formData);
      return response.data;
    } catch (err) {
      setMutationError(err);
      logError('Erro ao CRIAR categoria:', err, { formData });
      throw err; 
    } finally {
      setIsMutating(false);
    }
  }, []);

  const handleUpdate = useCallback(async (id: string, formData: CategoriaFormData): Promise<Categoria> => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const response = await api.put<Categoria>(`/categorias/${id}`, formData);
      return response.data;
    } catch (err) {
      setMutationError(err);
      logError('Erro ao ATUALIZAR categoria:', err, { id, formData });
      throw err; 
    } finally {
      setIsMutating(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
     setIsMutating(true);
     setMutationError(null);
     try {
        await api.delete(`/categorias/${id}`);
     } catch (err) {
        setMutationError(err);
        logError('Erro ao DELETAR categoria:', err, { id });
        throw err; 
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
    categorias: data?.data ?? [],
  };
};
