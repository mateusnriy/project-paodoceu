import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Categoria, Produto, ProdutoFormData, PaginatedResponse } from '../../types';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ProductFormModal } from './components/ProductFormModal';
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';
import { formatarMoeda, formatarData } from '../../utils/formatters';

// --- Componente de Tabela de Produtos (Memoizado) ---
const ProductsTable: React.FC<{
  produtos: Produto[];
  onEdit: (produto: Produto) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}> = React.memo(({ produtos, onEdit, onDelete, isLoading }) => {

  // <<< CORREÇÃO: StatusBadge movido para cá, de volta do hook >>>
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
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);

  const termoDebounced = useDebounce(termoBusca, 300);

  // <<< CORREÇÃO: Destructuring completo do hook >>>
  const {
    data,
    isLoading,
    error,
    mutate,
    handleCreate,
    handleUpdate,
    handleDelete,
    isMutating,
    setIsMutating,     // <<< Faltava esta linha >>>
    mutationError,
    setMutationError,  // <<< Faltava esta linha >>>
  } = useAdminProducts(pagina, termoDebounced);

  const {
    categorias,
    isLoading: isLoadingCategorias,
    error: errorCategorias,
  } = useAdminCategories(1, '', 999);

  const produtos = data?.data ?? [];
  const totalPaginas = data?.meta?.totalPaginas ?? 1;

  // <<< CORREÇÃO: 'setMutationError' existe agora >>>
  const handleOpenModal = useCallback((produto: Produto | null) => {
    setProdutoSelecionado(produto);
    setMutationError(null);
    setModalAberto(true);
  }, [setMutationError]);

  const handleCloseModal = useCallback(() => {
    setProdutoSelecionado(null);
    setModalAberto(false);
  }, []);

  const handleSave = useCallback(async (formData: ProdutoFormData, id?: string): Promise<Produto> => {
    // Hook controla o 'isMutating' e 'mutationError'
    try {
      let result: Produto;
      if (id) {
        result = await handleUpdate(id, formData);
      } else {
        result = await handleCreate(formData);
      }
      handleCloseModal();
      mutate();
      return result;
    } catch (err) {
      // Erro é setado pelo hook, apenas relançamos
      throw err;
    }
  }, [handleCreate, handleUpdate, mutate, handleCloseModal]); // <<< CORREÇÃO: Removidos setters >>>

  const handleDeleteConfirm = useCallback(async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await handleDelete(id);
        mutate();
      } catch (err) {
        alert(`Erro ao excluir produto: ${getErrorMessage(err)}`);
        // Erro é setado pelo hook
      }
    }
  }, [handleDelete, mutate]); // <<< CORREÇÃO: Removidos setters >>>

  const handlePageChange = useCallback((newPage: number) => {
      if (newPage >= 1 && newPage <= totalPaginas) {
        setPagina(newPage);
      }
  }, [totalPaginas]);

   return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gestão de Produtos</h1>
        <Button
          variant="primary"
          onClick={() => handleOpenModal(null)}
          disabled={isLoading || isMutating || isLoadingCategorias}
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

      {error && !isLoading && (
        <ErrorMessage
          title="Erro ao carregar produtos"
          message={getErrorMessage(error)}
        />
      )}
      {errorCategorias && !isLoadingCategorias && (
          <ErrorMessage
              title="Erro ao carregar categorias para o formulário"
              message={getErrorMessage(errorCategorias)}
              variant="warning"
          />
      )}

      <ProductsTable
        produtos={produtos}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        isLoading={isLoading || isMutating} // Passa loading combinado
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
          categorias={categorias ?? []}
          isMutating={isMutating}      // <<< CORREÇÃO: Passa prop correta >>>
          mutationError={mutationError} // <<< CORREÇÃO: Passa prop correta >>>
          isLoadingCategorias={isLoadingCategorias}
        />
      )}
    </div>
  );
};

export default AdminProducts;
