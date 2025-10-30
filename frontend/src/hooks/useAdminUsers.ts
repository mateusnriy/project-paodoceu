// frontend/src/hooks/useAdminUsers.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { userService } from '../services/userService';
import { Usuario, PaginatedResponse, UsuarioFormData } from '../types';
import { logError } from '../utils/logger';
import { getErrorMessage } from '../utils/errors';
import { useAuth } from '../contexts/AuthContext'; // Para o idUsuarioLogado

const ITEMS_PER_PAGE = 10;

export const useAdminUsers = (pagina: number, termoBusca: string, limite: number = ITEMS_PER_PAGE) => {
  const { usuario } = useAuth(); // Pega o usuário logado
  const [data, setData] = useState<PaginatedResponse<Usuario> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<unknown>(null);

  const loadUsers = useCallback(async () => {
    if (!data) setIsLoading(true);
    setError(null);
    try {
      const params = { pagina, limite, nome: termoBusca || undefined };
      // CORREÇÃO (Erro 1): O interceptador do Axios já retorna 'response.data'.
      // O 'response' aqui *é* o PaginatedResponse<Usuario>.
      const response = await userService.list(params);
      
      // CORREÇÃO (Erro 1): Atribuir o 'response' (PaginatedResponse) diretamente.
      setData(response);
    } catch (err) {
      setError(err);
      logError('Erro ao carregar usuários:', err, { pagina, termoBusca });
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, termoBusca, data]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const mutate = useCallback(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = useCallback(async (formData: Partial<UsuarioFormData>): Promise<Usuario> => {
    setIsMutating(true);
    setMutationError(null);
    try {
      // Garantir que o formData completo seja enviado para criação
      const response = await userService.create(formData as UsuarioFormData);
      toast.success('Usuário criado com sucesso!');
      mutate();
      return response;
    } catch (err) {
      setMutationError(err);
      logError('Erro ao CRIAR usuário:', err, { formData });
      toast.error(`Erro ao criar usuário: ${getErrorMessage(err)}`);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [mutate]);

  const handleUpdate = useCallback(async (id: string, formData: Partial<UsuarioFormData>): Promise<Usuario> => {
    setIsMutating(true);
    setMutationError(null);
    try {
      const response = await userService.update(id, formData);
      toast.success('Usuário atualizado com sucesso!');
      mutate();
      return response;
    } catch (err) {
      setMutationError(err);
      logError('Erro ao ATUALIZAR usuário:', err, { id, formData });
      toast.error(`Erro ao atualizar usuário: ${getErrorMessage(err)}`);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [mutate]);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    setIsMutating(true);
    setMutationError(null);
    try {
      await userService.delete(id);
      toast.success('Usuário excluído com sucesso!');
      mutate();
    } catch (err) {
      setMutationError(err);
      logError('Erro ao DELETAR usuário:', err, { id });
      toast.error(`Erro ao excluir usuário: ${getErrorMessage(err)}`);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [mutate]);

  return {
    data,
    isLoading,
    error: error ? getErrorMessage(error) : null,
    mutate,
    handleCreate,
    handleUpdate,
    handleDelete,
    isMutating,
    mutationError: mutationError ? getErrorMessage(mutationError) : null,
    setMutationError,
    idUsuarioLogado: usuario?.id, // Exporta o ID do usuário logado
  };
};

