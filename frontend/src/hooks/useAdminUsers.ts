import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { User, PaginatedResponse } from '../types'; // Barrel file
import { logError } from '../utils/logger'; // Log

type ModalState = {
  isOpen: boolean;
  user: User | null;
};

export type UserFormData = Partial<User> & { senha?: string };

const ITEMS_PER_PAGE = 10;

export const useAdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, user: null });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Carrega usuários paginados
  const loadUsers = async (page = currentPage) => {
    try {
      if (users.length === 0) setIsLoading(true);
      setError(null);
      const params = { page, limit: ITEMS_PER_PAGE };
      // Assumindo que o backend suporta paginação para usuários
      const response = await api.get<PaginatedResponse<User>>('/usuarios', { params });

      setUsers(response.data.data);
      setTotalPages(Math.ceil(response.data.total / ITEMS_PER_PAGE));
      setCurrentPage(page);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logError('Erro ao carregar usuários:', err, { page });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // Recarrega ao mudar de página

  const handleOpenModal = useCallback((user: User | null) => {
    setModalState({ isOpen: true, user });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, user: null });
  }, []);

  // Retorna boolean
  const handleSaveUser = useCallback(
    async (formData: UserFormData): Promise<boolean> => {
      try {
        setError(null);
        const dataToSend = { ...formData }; // Copia para não modificar o original

        if (modalState.user) {
          // Atualizar: Remove senha se vazia
          if (!dataToSend.senha) {
            delete dataToSend.senha;
          }
          await api.put(`/usuarios/${modalState.user.id}`, dataToSend);
        } else {
          // Criar: Senha é obrigatória
          if (!dataToSend.senha) {
            throw new Error('A senha é obrigatória para criar um novo usuário.');
          }
          await api.post('/usuarios', dataToSend);
        }
        handleCloseModal();
        await loadUsers(modalState.user ? currentPage : 1);
        return true; // Sucesso
      } catch (err) {
        const message = getErrorMessage(err);
        logError('Erro ao salvar usuário:', err, { userId: modalState.user?.id });
        throw new Error(message); // Lança para o modal
      }
    },
    [modalState.user, handleCloseModal, currentPage]
  ); // Removido loadUsers

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
          setError(null);
          await api.delete(`/usuarios/${userId}`);
          const newPage = users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
          await loadUsers(newPage);
        } catch (err) {
          const message = getErrorMessage(err);
          setError(message);
          logError('Erro ao excluir usuário:', err, { userId });
        }
      }
    },
    [users, currentPage]
  ); // Removido loadUsers

  return {
    isLoading,
    error,
    users, // Lista paginada
    modalState,
    handleOpenModal,
    handleCloseModal,
    handleSaveUser,
    handleDeleteUser,
    // Paginação
    currentPage,
    totalPages,
    setCurrentPage,
  };
};
