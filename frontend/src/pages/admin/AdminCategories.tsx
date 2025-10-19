import React, { useState, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Categoria, PaginatedResponse } from '../../types';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { CategoryFormModal } from './components/CategoryFormModal';
import { getErrorMessage } from '../../utils/errors';
import { formatarData } from '../../utils/formatters';

// --- Componente de Paginação (Reutilizado - Memoizado) ---
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
              Criada em
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {isLoading && !categorias.length ? (
            <SkeletonTable cols={3} rows={5} />
          ) : (
            categorias.map((categoria) => (
              <tr key={categoria.id} className="hover:bg-background-light-blue transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                  {categoria.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {categoria.dataCriacao ? formatarData(categoria.dataCriacao, { dateStyle: 'short', timeStyle: 'short' }) : '-'}
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
                    disabled={isLoading}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))
          )}
          {!isLoading && categorias.length === 0 && (
             <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-text-secondary">
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
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);

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
    setMutationError,   // <<< Faltava esta linha >>>
  } = useAdminCategories(pagina, '', 10);

  const categorias = data?.data ?? [];
  const totalPaginas = data?.meta?.totalPaginas ?? 1;

  // <<< CORREÇÃO: Agora 'setMutationError' existe >>>
  const handleOpenModal = useCallback((categoria: Categoria | null) => {
    setCategoriaSelecionada(categoria);
    setMutationError(null);
    setModalAberto(true);
  }, [setMutationError]);

  const handleCloseModal = useCallback(() => {
    setCategoriaSelecionada(null);
    setModalAberto(false);
  }, []);

  const handleSave = useCallback(async (formData: { nome: string }, id?: string): Promise<Categoria> => {
    // A lógica de loading/erro agora é pega do hook
    try {
      let result: Categoria;
      if (id) {
        result = await handleUpdate(id, formData);
      } else {
        result = await handleCreate(formData);
      }
      handleCloseModal();
      mutate();
      return result;
    } catch (err) {
      // O erro já está em 'mutationError' (definido pelo hook)
      // Apenas relançamos para o modal (que é controlado por 'mutationError')
      throw err;
    }
  }, [handleCreate, handleUpdate, mutate, handleCloseModal]); // <<< CORREÇÃO: Removidos setters que vêm do hook >>>

  const handleDeleteConfirm = useCallback(async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria? Atenção: Produtos associados podem ser afetados.')) {
      // O hook 'handleDelete' já controla isMutating e mutationError
      try {
        await handleDelete(id);
        mutate();
      } catch (err) {
        alert(`Erro ao excluir categoria: ${getErrorMessage(err)}`);
        // O erro já está em 'mutationError'
      }
    }
  }, [handleDelete, mutate]); // <<< CORREÇÃO: Removidos setters que vêm do hook >>>

  const handlePageChange = useCallback((newPage: number) => {
      if (newPage >= 1 && newPage <= totalPaginas) {
          setPagina(newPage);
      }
  }, [totalPaginas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gestão de Categorias</h1>
        <Button
           variant="primary"
           onClick={() => handleOpenModal(null)}
           disabled={isLoading || isMutating} // Desabilita se carregando ou fazendo CUD
        >
          <Plus size={20} className="-ml-1 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {error && !isLoading && (
        <ErrorMessage
          title="Erro ao carregar categorias"
          message={getErrorMessage(error)}
        />
      )}

      <CategoriesTable
        categorias={categorias}
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
        <CategoryFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSave={handleSave}
          categoria={categoriaSelecionada}
          isMutating={isMutating}      // Passa estado de loading CUD
          mutationError={mutationError} // Passa erro CUD
        />
      )}
    </div>
  );
};

export default AdminCategories;
