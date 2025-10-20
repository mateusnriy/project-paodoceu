import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Usuario, PaginatedResponse, UsuarioFormData, PerfilUsuario } from '../types';
import { logError } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

export const useAdminUsers = (pagina: number, termoBusca: string) => {
  const [data, setData] = useState<PaginatedResponse<Usuario> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const { usuario: usuarioLogado } = useAuth(); 

  const mutate = useCallback(async () => {
    // <<< CORREÇÃO DE LÓGICA: Mostrar loading apenas na primeira carga >>>
    if (!data) setIsLoading(true);
    // else setIsLoading(true); // Remover 'true' aqui evita o piscar
    setError(null); // Limpar erro
    try {
      const params = {
        pagina: pagina,
        limite: 10,
        nome: termoBusca || undefined,
      };
      const response = await api.get<PaginatedResponse<Usuario>>('/usuarios', {
        params,
      });
      setData(response.data);
    } catch (err) {
      // <<< CORREÇÃO: Armazenar o erro original >>>
      setError(err);
      logError('Erro ao re-buscar usuários:', err, { pagina, termoBusca });
      setData(null); // Limpar dados em caso de erro
    } finally {
      setIsLoading(false);
    }
  // <<< CORREÇÃO DE LOOP: Removido 'data' da dependência >>>
  }, [pagina, termoBusca]);

  useEffect(() => {
    mutate();
  }, [mutate]);

  // --- Funções de Mutação ---
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<unknown>(null);

  const handleCreate = useCallback(async (data: UsuarioFormData): Promise<Usuario> => {
    setIsMutating(true);
    setMutationError(null);
    if (!data.senha) {
      const errorMsg = 'A senha é obrigatória para criar um novo usuário.';
      logError(errorMsg, new Error(errorMsg), { data });
      setIsMutating(false); // Parar loading
      throw new Error(errorMsg);
    }
    try {
      const response = await api.post<Usuario>('/usuarios', data);
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      setMutationError(err); // Armazenar erro
      logError('Erro ao CRIAR usuário:', err, { data });
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const handleUpdate = useCallback(async (
    id: string,
    data: UsuarioFormData
  ): Promise<Usuario> => {
    setIsMutating(true);
    setMutationError(null);
    const dataToSend = { ...data };
    if (!dataToSend.senha) {
      delete dataToSend.senha;
    }
    
    try {
      const response = await api.put<Usuario>(`/usuarios/${id}`, dataToSend);
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      setMutationError(err); // Armazenar erro
      logError('Erro ao ATUALIZAR usuário:', err, { id, data: dataToSend });
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    setIsMutating(true);
    setMutationError(null);
    if (id === usuarioLogado?.id) {
      const errorMsg = 'Você não pode excluir seu próprio usuário.';
      logError(errorMsg, new Error(errorMsg), { id });
      setMutationError(new Error(errorMsg)); // Armazenar erro
      setIsMutating(false); // Parar loading
      throw new Error(errorMsg);
    }
    try {
      await api.delete(`/usuarios/${id}`);
    } catch (err) {
      const message = getErrorMessage(err);
      setMutationError(err); // Armazenar erro
      logError('Erro ao DELETAR usuário:', err, { id });
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, [usuarioLogado?.id]);
  

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
    idUsuarioLogado: usuarioLogado?.id,
  };
};
