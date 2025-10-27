// src/pages/admin/AdminCategories.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Categoria } from '../../types';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { CategoryFormModal } from './components/CategoryFormModal';
import { getErrorMessage } from '../../utils/errors';
import { formatarData } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';

// --- Componente de Paginação (Reutilizado - Memoizado) ---
interface PaginationProps {
  paginaAtual: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}
const Pagination: React.FC<PaginationProps> = React.memo(
  ({ paginaAtual, totalPaginas, onPageChange, isLoading }) => {
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
  }
);
Pagination.displayName = 'Pagination';

// --- Tabela de Categorias (Memoizado) ---
const CategoriesTable: React.FC<{
  categorias: Categoria[];
  onEdit: (categoria: Categoria) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}> = React.memo(({ categorias, onEdit, onDelete, isLoading }) => {
  return (
    <div className="bg-primary-white rounded-xl shadow-soft overflow-x-auto border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Nome
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Produtos Assoc.
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Criada em
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {isLoading && !categorias.length ? (
            <SkeletonTable cols={4} rows={5} />
          ) : (
            categorias.map((categoria) => (
              <tr key={categoria.id} className="hover:bg-background-light-blue transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                  {categoria.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                   {categoria._count?.produtos ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {categoria.criado_em ? formatarData(categoria.criado_em, { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onEdit(categoria)}
                    aria-label={`Editar ${categoria.nome}`}
                    className="text-primary-blue hover:underline p-1"
                    title="Editar"
                    disabled={isLoading}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onDelete(categoria.id)}
                    className="text-status-error hover:underline p-1"
                    aria-label={`Excluir ${categoria.nome}`}
                    title="Excluir"
                    disabled={isLoading || (categoria._count?.produtos ?? 0) > 0}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))
          )}
          {!isLoading && categorias.length === 0 && (
             <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-text-secondary">
                    Nenhuma categoria encontrada.
                </td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
CategoriesTable.displayName = 'CategoriesTable';

// --- Página Principal: AdminCategories ---
const AdminCategories: React.FC = () => {
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);

  const termoDebounced = useDebounce(termoBusca, 300);

  const {
    data,
    isLoading,
    error, // Erro geral de carregamento
    mutate,
    handleCreate,
    handleUpdate,
    handleDelete,
    isMutating,
    mutationError, // Erro específico das operações CUD
    setMutationError,
  } = useAdminCategories(pagina, termoDebounced, 10);

  const categorias = data?.data ?? [];

  const totalPaginas = useMemo(() => {
      if (!data) return 1;
      const totalItems = data.meta?.total ?? 0;
      const itemsPerPage = data.meta?.limite ?? 10;
      return Math.ceil(totalItems / itemsPerPage) || 1;
  }, [data]);

  const handleOpenModal = useCallback((categoria: Categoria | null) => {
    setCategoriaSelecionada(categoria);
    setMutationError(null);
    setModalAberto(true);
  }, [setMutationError]);

  const handleCloseModal = useCallback(() => {
    setCategoriaSelecionada(null);
    setModalAberto(false);
  }, []);

  const handleSave = useCallback(async (formData: { nome: string }, id?: string): Promise<Categoria | void> => {
    try {
      if (id) {
        await handleUpdate(id, formData);
      } else {
        await handleCreate(formData);
      }
      handleCloseModal();
      mutate();
    } catch (err) {
      console.error("Erro no handleSave:", err);
      throw err; // Re-lança para o modal tratar a exibição
    }
  }, [handleCreate, handleUpdate, mutate, handleCloseModal]);


  const handleDeleteConfirm = useCallback(async (id: string) => {
    const categoriaParaExcluir = categorias.find(c => c.id === id);
    if ((categoriaParaExcluir?._count?.produtos ?? 0) > 0) {
         alert('Não é possível excluir categorias com produtos associados.');
         return;
    }
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${categoriaParaExcluir?.nome}"?`)) {
      try {
        await handleDelete(id);
        if (categorias.length === 1 && pagina > 1) {
            setPagina(pagina - 1); // Volta para a página anterior se a última foi esvaziada
        } else {
            mutate(); // Revalida a página atual
        }
      } catch (err) {
        alert(`Erro ao excluir categoria: ${getErrorMessage(err)}`);
      }
    }
  }, [handleDelete, mutate, categorias, pagina]);

  const handlePageChange = useCallback((newPage: number) => {
      if (newPage >= 1 && newPage <= totalPaginas) {
          setPagina(newPage);
      }
  }, [totalPaginas]);

  useEffect(() => {
      setPagina(1);
  }, [termoDebounced]);

  // <<< CORREÇÃO: Usa getErrorMessage para exibir o erro geral >>>
  const displayError = error ? getErrorMessage(error) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gestão de Categorias</h1>
        <Button
           variant="primary"
           onClick={() => handleOpenModal(null)}
           disabled={isLoading || isMutating}
        >
          <Plus size={20} className="-ml-1 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <Search size={20} className="text-text-secondary" aria-hidden="true" />
        </div>
        <input
          type="search"
          placeholder="Buscar categorias por nome..."
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

      {/* <<< CORREÇÃO: Exibe displayError (string | null) >>> */}
      {displayError && !isLoading && (
        <ErrorMessage message={displayError} />
      )}

      <CategoriesTable
        categorias={categorias}
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
        <CategoryFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSave={handleSave}
          categoria={categoriaSelecionada}
          isMutating={isMutating}
          mutationError={mutationError} // Passa o erro original (unknown) para o modal
        />
      )}
    </div>
  );
};

export default AdminCategories;
