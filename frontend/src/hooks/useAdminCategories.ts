// src/hooks/useAdminCategories.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
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
     if (!data) setIsLoading(true); // Só mostra loading na primeira vez
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
  }, [pagina, limite, termoBusca, data]); // Adicionada dependência 'data' para resetar loading

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
      throw err; // Re-lança para o modal saber que houve erro
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
      throw err; // Re-lança para o modal saber que houve erro
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
        throw err; // Re-lança para a página saber que houve erro
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
    categorias: data?.data ?? [], // Mantém para compatibilidade, se necessário
  };
};
