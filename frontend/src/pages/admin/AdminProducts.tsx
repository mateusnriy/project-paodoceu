// src/pages/admin/AdminProducts.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
// import { Categoria, Produto, ProdutoFormData, PaginatedResponse } from '../../types'; // Removido Categoria e PaginatedResponse
import { Produto, ProdutoFormData } from '../../types';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ProductFormModal } from './components/ProductFormModal';
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';
import { formatarMoeda } from '../../utils/formatters'; // formatarData removido

// --- Componente de Tabela de Produtos (Memoizado) ---
const ProductsTable: React.FC<{
  produtos: Produto[];
  onEdit: (produto: Produto) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}> = React.memo(({ produtos, onEdit, onDelete, isLoading }) => {
  const StatusBadge: React.FC<{ disponivel: boolean }> = ({ disponivel }) => (
    <span
      className={`
        inline-block px-3 py-1 text-xs font-semibold rounded-full leading-tight
        ${
          disponivel
            ? 'bg-status-success-bg text-status-success-text'
            : 'bg-status-disabled-bg text-status-disabled-text'
        }
      `}
    >
      {disponivel ? 'Disponível' : 'Indisponível'}
    </span>
  );
  StatusBadge.displayName = 'StatusBadge';

  return (
    <div className="bg-primary-white rounded-xl shadow-soft overflow-x-auto border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Nome
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Preço
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Estoque
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Categoria
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {isLoading && !produtos.length ? (
             <SkeletonTable cols={6} rows={5} />
          ) : (
            produtos.map((produto) => (
              <tr key={produto.id} className="hover:bg-background-light-blue transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                  {produto.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  <StatusBadge disponivel={produto.quantidadeEstoque > 0} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  {formatarMoeda(produto.preco)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  {produto.quantidadeEstoque}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  {produto.categoria?.nome ?? 'Sem categoria'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onEdit(produto)}
                    aria-label={`Editar ${produto.nome}`}
                    className="text-primary-blue hover:underline p-1"
                    title="Editar"
                    disabled={isLoading}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onDelete(produto.id)}
                    className="text-status-error hover:underline p-1"
                    aria-label={`Excluir ${produto.nome}`}
                    title="Excluir"
                     disabled={isLoading}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))
          )}
          {!isLoading && produtos.length === 0 && (
              <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-secondary">
                      Nenhum produto encontrado.
                  </td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
ProductsTable.displayName = 'ProductsTable';

// --- Componente de Paginação (Memoizado) ---
const Pagination: React.FC<{
  paginaAtual: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}> = React.memo(({ paginaAtual, totalPaginas, onPageChange, isLoading }) => {
    if (totalPaginas <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(paginaAtual - 1)}
          disabled={paginaAtual === 1 || isLoading}
          aria-label="Página anterior"
        >
          Anterior
        </Button>
        <span className="text-sm text-text-secondary font-medium">
          Página {paginaAtual} de {totalPaginas}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(paginaAtual + 1)}
          disabled={paginaAtual === totalPaginas || isLoading}
          aria-label="Próxima página"
        >
          Próxima
        </Button>
      </div>
    );
});
Pagination.displayName = 'Pagination';

// --- Página Principal: AdminProducts ---
const AdminProducts: React.FC = () => {
  const [pagina, setPagina] = useState(1); // CORRIGIDO: useState(1) completo
  const [termoBusca, setTermoBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] =
    useState<Produto | null>(null);

  const termoDebounced = useDebounce(termoBusca, 300);

  // Hook de Produtos (principal)
  const {
    data: productData,
    isLoading: isLoadingProducts,
    error: errorProducts,
    mutate: mutateProducts,
    handleCreate,
    handleUpdate,
    handleDelete,
    isMutating,
    mutationError,
    setMutationError,
  } = useAdminProducts(pagina, termoDebounced);

  // Hook de Categorias (para o <select> do modal)
  const {
    data: categoryData,
    isLoading: isLoadingCategories,
    error: errorCategories,
  } = useAdminCategories(1, '', 1000); // Pega todas as categorias para o dropdown

  const produtos = productData?.data ?? [];

  const totalPaginas = useMemo(() => {
    if (!productData) return 1;
    // CORREÇÃO: Acessando data.meta e 'limite'
    const totalItems = productData.meta?.total ?? 0;
    const itemsPerPage = productData.meta?.limite ?? 10;
    return Math.ceil(totalItems / itemsPerPage) || 1;
  }, [productData]);

  const handleOpenModal = useCallback((produto: Produto | null) => {
    setProdutoSelecionado(produto);
    setMutationError(null);
    setModalAberto(true);
  }, [setMutationError]);

  const handleCloseModal = useCallback(() => {
    setProdutoSelecionado(null);
    setModalAberto(false);
  }, []);

  const handleSave = useCallback(
    async (formData: ProdutoFormData, id?: string): Promise<Produto | void> => { // Corrigido retorno
      try {
        let result: Produto;
        if (id) {
          result = await handleUpdate(id, formData);
        } else {
          result = await handleCreate(formData);
        }
        handleCloseModal();
        mutateProducts(); // Atualiza a lista
        return result;
      } catch (err) {
        throw err;
      }
    },
    [handleCreate, handleUpdate, mutateProducts, handleCloseModal]
  );

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      const produtoParaExcluir = produtos.find((p) => p.id === id);
      if (
        window.confirm(
          `Tem certeza que deseja excluir o produto "${produtoParaExcluir?.nome}"?`
        )
      ) {
        try {
          await handleDelete(id);
          if (produtos.length === 1 && pagina > 1) {
            setPagina(pagina - 1);
          } else {
            mutateProducts();
          }
        } catch (err) {
          alert(`Erro ao excluir produto: ${getErrorMessage(err)}`);
        }
      }
    },
    [handleDelete, mutateProducts, produtos, pagina]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPaginas) {
        setPagina(newPage);
      }
    },
    [totalPaginas]
  );

  useEffect(() => {
    setPagina(1);
  }, [termoDebounced]);

  const displayError = errorProducts || errorCategories;
  const isLoading = isLoadingProducts || (modalAberto && isLoadingCategories);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gestão de Produtos</h1>
        <Button
          variant="primary"
          onClick={() => handleOpenModal(null)}
          disabled={isLoading || isMutating}
        >
          <Plus size={20} className="-ml-1 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <Search size={20} className="text-text-secondary" aria-hidden="true" />
        </div>
        <input
          type="search"
          placeholder="Buscar produtos por nome..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          disabled={isMutating}
          className="
            block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
            leading-5 bg-primary-white text-text-primary placeholder-gray-500
            focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue
            sm:text-sm
          "
        />
      </div>

      {displayError && !isLoading && (
        <ErrorMessage message={getErrorMessage(displayError)} />
      )}

      <ProductsTable
        produtos={produtos}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        isLoading={isLoading || isMutating}
      />

      <Pagination
        paginaAtual={pagina}
        totalPaginas={totalPaginas}
        onPageChange={handlePageChange}
        isLoading={isLoading || isMutating}
      />

      {modalAberto && (
        <ProductFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSave={handleSave}
          produto={produtoSelecionado}
          categorias={categoryData?.data ?? []}
          isMutating={isMutating}
          mutationError={mutationError} // Passa o erro original (unknown)
          isLoadingCategorias={isLoadingCategories}
        />
      )}
    </div>
  );
};

export default AdminProducts;
