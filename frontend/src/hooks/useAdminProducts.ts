import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Product, Category, PaginatedResponse } from '../types'; // Barrel file
import { useDebounce } from './useDebounce';
import { logError } from '../utils/logger'; // Log

type ModalState = {
  isOpen: boolean;
  product: Product | null;
};

// Tipo para os dados do formulário
export type ProductFormData = Omit<Product, 'id' | 'categoria'>;

const ITEMS_PER_PAGE = 10;

export const useAdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, product: null });

  // Carrega produtos paginados e categorias
  const loadData = async (page = currentPage, search = debouncedSearchTerm) => {
    try {
      // Mostra loading apenas se não for uma simples mudança de página/busca com dados já na tela
      if (products.length === 0) setIsLoading(true);
      setError(null);

      const params = {
        page: page,
        limit: ITEMS_PER_PAGE,
        search: search || undefined,
      };

      const [prodRes, catRes] = await Promise.all([
        api.get<PaginatedResponse<Product>>('/produtos', { params }),
        // Carrega categorias apenas se ainda não foram carregadas
        categories.length === 0 ? api.get<Category[]>('/categorias') : Promise.resolve({ data: categories }),
      ]);

      setProducts(prodRes.data.data);
      setTotalPages(Math.ceil(prodRes.data.total / ITEMS_PER_PAGE));
      setCurrentPage(page);

      // Atualiza categorias apenas se foram buscadas
      if (catRes.data !== categories) {
        setCategories(catRes.data);
      }

    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logError('Erro ao carregar produtos/categorias:', err, { page, search });
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para carregar dados na montagem e ao mudar página/busca
  useEffect(() => {
    // Quando a busca muda, sempre volta para a página 1
    const pageToLoad = debouncedSearchTerm !== searchTerm ? 1 : currentPage;
    loadData(pageToLoad, debouncedSearchTerm);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm]); // Depende da página e da busca debounced

  const handleOpenModal = useCallback((product: Product | null) => {
    setModalState({ isOpen: true, product });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, product: null });
  }, []);

  // Retorna boolean para indicar sucesso/falha ao modal
  const handleSaveProduct = useCallback(async (formData: ProductFormData): Promise<boolean> => {
    try {
      setError(null);
      if (modalState.product) {
        await api.put(`/produtos/${modalState.product.id}`, formData);
      } else {
        await api.post('/produtos', formData);
      }
      handleCloseModal();
      // Recarrega na página atual ou na primeira se for novo item
      await loadData(modalState.product ? currentPage : 1);
      return true; // Sucesso
    } catch (err) {
      const message = getErrorMessage(err);
      // Define o erro no hook para ser exibido no modal através do retorno
      logError('Erro ao salvar produto:', err, { productId: modalState.product?.id });
      // Lança o erro para o modal poder pegar e exibir
      throw new Error(message);
    }
  }, [modalState.product, handleCloseModal, currentPage]); // Removido loadData

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        setError(null);
        await api.delete(`/produtos/${productId}`);
        // Decide se volta uma página
        const newPage = products.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        await loadData(newPage);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        logError('Erro ao excluir produto:', err, { productId });
      }
    }
  }, [products, currentPage]); // Removido loadData

  return {
    isLoading,
    error,
    products, // Lista paginada
    categories,
    searchTerm,
    setSearchTerm,
    modalState,
    handleOpenModal,
    handleCloseModal,
    handleSaveProduct,
    handleDeleteProduct,
    // Paginação
    currentPage,
    totalPages,
    setCurrentPage, // A página usará isso para mudar a página
  };
};
