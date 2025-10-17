import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Category, PaginatedResponse } from '../types'; // Barrel file
import { logError } from '../utils/logger'; // Log

type ModalState = {
  isOpen: boolean;
  category: Category | null;
};

const ITEMS_PER_PAGE = 15; // Geralmente mais categorias cabem na tela

export const useAdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, category: null });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Carrega categorias paginadas
  const loadCategories = async (page = currentPage) => {
    try {
      if (categories.length === 0) setIsLoading(true);
      setError(null);
      const params = { page, limit: ITEMS_PER_PAGE };
      // Assumindo que o backend suporta paginação para categorias
      const response = await api.get<PaginatedResponse<Category>>('/categorias', { params });

      setCategories(response.data.data);
      setTotalPages(Math.ceil(response.data.total / ITEMS_PER_PAGE));
      setCurrentPage(page);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logError('Erro ao carregar categorias:', err, { page });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // Recarrega ao mudar de página

  const handleOpenModal = useCallback((category: Category | null) => {
    setModalState({ isOpen: true, category });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, category: null });
  }, []);

  // Retorna boolean
  const handleSaveCategory = useCallback(
    async (nome: string): Promise<boolean> => {
      try {
        setError(null);
        if (modalState.category) {
          await api.put(`/categorias/${modalState.category.id}`, { nome });
        } else {
          await api.post('/categorias', { nome });
        }
        handleCloseModal();
        await loadCategories(modalState.category ? currentPage : 1); // Recarrega
        return true; // Sucesso
      } catch (err) {
        const message = getErrorMessage(err);
        logError('Erro ao salvar categoria:', err, { categoryId: modalState.category?.id });
        throw new Error(message); // Lança para o modal
      }
    },
    [modalState.category, handleCloseModal, currentPage]
  ); // Removido loadCategories

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      if (
        window.confirm(
          'Tem certeza? A exclusão falhará se a categoria estiver em uso por produtos.'
        )
      ) {
        try {
          setError(null);
          await api.delete(`/categorias/${categoryId}`);
          const newPage =
            categories.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
          await loadCategories(newPage);
        } catch (err) {
          const message = getErrorMessage(err);
          setError(message);
          logError('Erro ao excluir categoria:', err, { categoryId });
        }
      }
    },
    [categories, currentPage]
  ); // Removido loadCategories

  return {
    isLoading,
    error,
    categories, // Lista paginada
    modalState,
    handleOpenModal,
    handleCloseModal,
    handleSaveCategory,
    handleDeleteCategory,
    // Paginação
    currentPage,
    totalPages,
    setCurrentPage,
  };
};
