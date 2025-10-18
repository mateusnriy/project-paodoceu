import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Usuario, PaginatedResponse, UsuarioFormData, PerfilUsuario } from '../types';
import { logError } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

/**
 * @hook useAdminUsers
 * @description Hook para buscar e gerenciar dados paginados de Usuários.
 * @param pagina A página atual a ser buscada.
 * @param termoBusca O termo de busca (debounced).
 * @returns Um objeto contendo dados, estado de loading, erro e função mutate.
 */
export const useAdminUsers = (pagina: number, termoBusca: string) => {
  const [data, setData] = useState<PaginatedResponse<Usuario> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const { usuario: usuarioLogado } = useAuth(); // Pega o usuário logado

  /**
   * @function mutate
   * @description Função para forçar a re-busca dos dados da página atual.
   */
  const mutate = useCallback(async () => {
    setIsLoading(true);
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
      setError(null);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logError('Erro ao re-buscar usuários:', err, { pagina, termoBusca });
    } finally {
      setIsLoading(false);
    }
  }, [pagina, termoBusca]);

  // Efeito para buscar dados quando a página ou a busca (debounced) mudam
  useEffect(() => {
    mutate();
  }, [mutate]);

  // --- Funções de Mutação ---

  /**
   * @function handleCreate
   * @description Cria um novo usuário.
   * @throws {Error} Lança um erro se a API falhar.
   */
  const handleCreate = async (data: UsuarioFormData): Promise<Usuario> => {
    if (!data.senha) {
      const errorMsg = 'A senha é obrigatória para criar um novo usuário.';
      logError(errorMsg, new Error(errorMsg), { data });
      throw new Error(errorMsg);
    }
    try {
      const response = await api.post<Usuario>('/usuarios', data);
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      logError('Erro ao CRIAR usuário:', err, { data });
      throw new Error(message);
    }
  };

  /**
   * @function handleUpdate
   * @description Atualiza um usuário existente.
   * @throws {Error} Lança um erro se a API falhar.
   */
  const handleUpdate = async (
    id: string,
    data: UsuarioFormData
  ): Promise<Usuario> => {
    const dataToSend = { ...data };
    // Remove a senha se estiver vazia (não atualiza)
    if (!dataToSend.senha) {
      delete dataToSend.senha;
    }
    
    try {
      const response = await api.put<Usuario>(`/usuarios/${id}`, dataToSend);
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err);
      logError('Erro ao ATUALIZAR usuário:', err, { id, data: dataToSend });
      throw new Error(message);
    }
  };

  /**
   * @function handleDelete
   * @description Deleta um usuário.
   * @throws {Error} Lança um erro se a API falhar.
   */
  const handleDelete = async (id: string): Promise<void> => {
    if (id === usuarioLogado?.id) {
      const errorMsg = 'Você não pode excluir seu próprio usuário.';
      logError(errorMsg, new Error(errorMsg), { id });
      throw new Error(errorMsg);
    }
    try {
      await api.delete(`/usuarios/${id}`);
    } catch (err) {
      const message = getErrorMessage(err);
      logError('Erro ao DELETAR usuário:', err, { id });
      throw new Error(message);
    }
  };
  
  // Estado e handlers para controlar o estado de 'isMutating' (ex: no botão salvar)
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<unknown>(null);

  return {
    // Dados SWR
    data,
    isLoading,
    error,
    mutate,
    // Funções de Mutação
    handleCreate,
    handleUpdate,
    handleDelete,
    // Estado da Mutação (para a UI)
    isMutating,
    setIsMutating,
    mutationError,
    setMutationError,
    // Extra: ID do usuário logado para a UI
    idUsuarioLogado: usuarioLogado?.id,
  };
};
