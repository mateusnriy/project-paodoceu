// frontend/src/pages/admin/AdminProducts.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react'; // CORREÇÃO (Causa 8, 10)
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { Produto, ProdutoFormData } from '../../types'; // (Causa 10: Categoria removida)
import { formatarMoeda } from '../../utils/formatters'; // (Causa 10: formatarData removida)
import { Button } from '../../components/common/Button';
import { ProductFormModal } from './components/ProductFormModal';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../../components/ui/Pagination';
import { getErrorMessage } from '../../utils/errors';
import { useAdminCategories } from '../../hooks/useAdminCategories';

// --- Componente QuickStockAdjust (sem alterações) ---
const QuickStockAdjust: React.FC<{
  produto: Produto;
  onSave: (id: string, novaQuantidade: number) => Promise<void>;
  isMutating: boolean;
}> = ({ produto, onSave, isMutating }) => {
  const [estoqueLocal, setEstoqueLocal] = useState(produto.estoque);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving || isMutating) return;
    const novaQuantidade = Number(estoqueLocal);
    if (novaQuantidade !== produto.estoque && novaQuantidade >= 0) {
      setIsSaving(true);
      try {
        await onSave(produto.id, novaQuantidade);
      } catch (error) {
        setEstoqueLocal(produto.estoque);
      } finally {
        setIsSaving(false);
        setIsEditing(false);
      }
    } else {
      setEstoqueLocal(produto.estoque);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEstoqueLocal(produto.estoque);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 150);
  };

  const handleEditClick = () => {
    if (!isMutating) {
      setIsEditing(true);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 relative">
        <input
          type="number"
          value={estoqueLocal}
          onChange={(e) => setEstoqueLocal(Number(e.target.value))}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-20 px-2 py-1 border rounded-md focus:ring-1 focus:ring-primary-blue focus:border-primary-blue"
          autoFocus
          min="0"
          disabled={isSaving}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 group ${
        isMutating ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
      }`}
      onClick={handleEditClick}
      title="Clique para editar estoque"
    >
      <span>{produto.estoque}</span>
      {!isMutating && (
        <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil size={14} />
        </span>
      )}
    </div>
  );
};

// --- Componente ProductsTable ---
const ProductsTable: React.FC<{
  produtos: Produto[];
  onEdit: (produto: Produto) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (id: string, novaQuantidade: number) => Promise<void>;
  isLoading: boolean;
  isMutating: boolean;
}> = React.memo(
  ({ produtos, onEdit, onDelete, onAdjustStock, isLoading, isMutating }) => {
    return (
      <div className="bg-primary-white rounded-xl shadow-soft overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="...">Nome</th>
              <th scope="col" className="...">Categoria</th>
              <th scope="col" className="...">Preço</th>
              <th scope="col" className="...">Estoque (Editar)</th>
              <th scope="col" className="...">Ativo</th>
              <th scope="col" className="...">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading && !produtos.length ? (
              <SkeletonTable cols={6} rows={5} />
            ) : (
              produtos.map((produto) => (
                <tr
                  key={produto.id}
                  className="hover:bg-background-light-blue transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* CORREÇÃO (Causa 5): imagem_url */}
                      {produto.imagem_url && (
                        <img
                          src={produto.imagem_url}
                          alt={produto.nome}
                          className="w-10 h-10 object-cover rounded-md mr-3 flex-shrink-0"
                        />
                      )}
                      <div className="text-sm font-medium text-text-primary truncate">
                        {produto.nome}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {produto.categoria?.nome || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {formatarMoeda(produto.preco)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <QuickStockAdjust
                      produto={produto}
                      onSave={onAdjustStock}
                      isMutating={isMutating}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        produto.ativo
                          ? 'bg-status-success-bg text-status-success-text'
                          : 'bg-status-error-bg text-status-error-text'
                      }`}
                    >
                      {produto.ativo ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onEdit(produto)}
                      disabled={isMutating}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onDelete(produto.id)}
                      disabled={isMutating}
                      className="text-status-error"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
            {!isLoading && produtos.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-text-secondary"
                >
                  Nenhum produto encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  },
);
ProductsTable.displayName = 'ProductsTable';

// --- Componente principal (AdminProducts) ---
export default function AdminProducts() {
  // CORREÇÃO (Causa 8): Estado gerenciado pela página
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEdit, setProdutoEdit] = useState<Produto | null>(null);

  const termoDebounced = useDebounce(termoBusca, 300);

  // CORREÇÃO (Causa 8): Passa estado para o hook
  const {
    data: paginatedResponse,
    isLoading,
    error: fetchError,
    isMutating,
    mutationError,
    setMutationError,
    // setPagina, // (Removido, gerenciado localmente)
    // setTermoBusca, // (Removido, gerenciado localmente)
    // fetchData, // (Removido, mutate é usado internamente)
    handleCreate,
    handleUpdate,
    handleDelete,
    handleAdjustStock,
  } = useAdminProducts(pagina, termoDebounced); // (Chamada correta)

  // Hook de categorias (mantido)
  const {
    data: categoriasResponse,
    isLoading: isLoadingCategorias,
    error: categoriasError,
  } = useAdminCategories(1, '', 1000);
  const categorias = categoriasResponse?.data ?? [];

  // CORREÇÃO (Causa 8): Extrai dados da resposta paginada
  const produtos = paginatedResponse?.data ?? [];
  const meta = paginatedResponse?.meta;

  const totalPaginas = useMemo(() => {
    if (!meta) return 1;
    return meta.totalPaginas || 1;
  }, [meta]);

  // handleOpenModal (mantido)
  const handleOpenModal = useCallback(
    (produto: Produto | null = null) => {
      setProdutoEdit(produto);
      setMutationError(null);
      setModalAberto(true);
    },
    [setMutationError],
  );

  // handleCloseModal (mantido)
  const handleCloseModal = useCallback(() => {
    setProdutoEdit(null);
    setModalAberto(false);
  }, []);

  // handleSave (mantido)
  const handleSave = useCallback(
    async (formData: ProdutoFormData, id?: string): Promise<void> => {
      try {
        if (id) {
          await handleUpdate(id, formData);
        } else {
          await handleCreate(formData);
        }
        handleCloseModal();
        // O hook já revalida (mutate)
      } catch (err) {
        console.error('Erro no handleSave (AdminProducts):', err);
      }
    },
    [handleCreate, handleUpdate, handleCloseModal],
  );

  // handleDeleteConfirm (mantido)
  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      // CORREÇÃO (Causa 9): Tipagem explícita
      const produtoParaExcluir = produtos.find((p: Produto) => p.id === id);
      if (!produtoParaExcluir) return;

      if (
        window.confirm(
          `Tem certeza que deseja excluir o produto "${produtoParaExcluir.nome}"? Esta ação não pode ser desfeita.`,
        )
      ) {
        try {
          await handleDelete(id);
          // CORREÇÃO (Causa 8): Lógica de paginação movida para a página
          if (produtos.length === 1 && pagina > 1) {
            setPagina(pagina - 1);
          }
          // (O hook já revalida)
        } catch (err) {
          alert(`Erro ao excluir produto: ${getErrorMessage(err)}`);
        }
      }
    },
    [handleDelete, produtos, pagina],
  );

  // handlePageChange (mantido)
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPaginas) {
        setPagina(newPage);
      }
    },
    [totalPaginas],
  );

  // useEffect (debounce) (mantido)
  useEffect(() => {
    setPagina(1);
  }, [termoDebounced]);

  const displayFetchError = fetchError ? getErrorMessage(fetchError) : null;
  const displayCategoriasError = categoriasError
    ? getErrorMessage(categoriasError)
    : null;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">
          Gerenciamento de Produtos
        </h1>
        <Button
          onClick={() => handleOpenModal(null)}
          disabled={isLoading || isMutating || isLoadingCategorias}
        >
          <Plus size={18} className="mr-1" /> Novo Produto
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-text-secondary" aria-hidden="true" />
        </div>
        <input
          type="search"
          placeholder="Buscar produtos por nome..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)} // (Causa 8) Usa estado local
          disabled={isMutating}
          className="
            block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
            leading-5 bg-primary-white text-text-primary placeholder-text-secondary/70
            focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue
            sm:text-sm transition-colors duration-150
          "
        />
      </div>

      {displayFetchError && !isLoading && (
        <ErrorMessage message={displayFetchError} title="Erro ao Carregar Produtos" />
      )}
      {displayCategoriasError && !isLoadingCategorias && (
        <ErrorMessage
          message={`Erro ao carregar categorias: ${displayCategoriasError}`}
          title="Erro Interno"
        />
      )}

      {/* Tabela de Produtos */}
      <ProductsTable
        produtos={produtos}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        onAdjustStock={handleAdjustStock}
        isLoading={isLoading}
        isMutating={isMutating}
      />

      {/* Paginação */}
      {meta && (
        <Pagination
          paginaAtual={meta.pagina}
          totalPaginas={totalPaginas}
          onPageChange={handlePageChange}
          isLoading={isLoading || isMutating}
        />
      )}

      {/* Modal de Formulário */}
      {modalAberto && (
        <ProductFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSubmit={handleSave} // CORREÇÃO (Causa 7)
          produto={produtoEdit} // (Nome corrigido)
          categorias={categorias}
          isMutating={isMutating}
          mutationError={mutationError}
          isLoadingCategorias={isLoadingCategorias}
        />
      )}
    </div>
  );
}
