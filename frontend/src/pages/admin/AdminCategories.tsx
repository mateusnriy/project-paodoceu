import React from 'react';
import { Button } from '../../components/common/Button';
import { PlusIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'; // Ícones de paginação
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { CategoryFormModal } from './components/CategoryFormModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { SkeletonTable } from '../../components/ui/SkeletonTable'; // Import Skeleton

const AdminCategories: React.FC = () => {
  const {
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
  } = useAdminCategories();

  // Componente interno para paginação
  const PaginationControls = () => {
    // Não mostra se só há uma página ou no carregamento inicial
    if (totalPages <= 1 || (isLoading && categories.length === 0)) return null;

    return (
      <div className="mt-6 flex items-center justify-center gap-4">
        {/* Desabilita botões durante qualquer carregamento */}
        <Button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          variant="outlined"
          className="px-4 py-2"
          aria-label="Página anterior"
        >
          <ChevronLeftIcon size={18} /> <span className="ml-1 hidden sm:inline">Anterior</span>
        </Button>
        <span className="text-gray-600">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          variant="outlined"
          className="px-4 py-2"
          aria-label="Próxima página"
        >
          <span className="mr-1 hidden sm:inline">Próxima</span> <ChevronRightIcon size={18} />
        </Button>
      </div>
    );
  };

  const renderTableContent = () => {
    // Skeleton no carregamento inicial absoluto
    if (isLoading && categories.length === 0) {
      // Ajustar número de colunas para Categoria (3 cols)
      return <SkeletonTable rows={5} cols={3} />;
    }
    // Mensagem se não houver categorias
    if (categories.length === 0 && !isLoading) {
      return <div className="text-center py-10 text-gray-500">Nenhuma categoria encontrada.</div>;
    }
    // Tabela normal
    return (
      <table className="min-w-full divide-y divide-gray-200 relative">
        {' '}
        {/* Adicionado relative */}
        {/* Overlay de Loading para troca de página */}
        {isLoading && categories.length > 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 rounded-b-4xl">
            {' '}
            {/* Rounded bottom */}
            <LoadingSpinner size={32} />
          </div>
        )}
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Nome da Categoria
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Produtos
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${isLoading ? 'opacity-50' : ''}`}>
          {' '}
          {/* Opacidade durante loading */}
          {categories.map((category) => (
            <tr key={category.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{category.nome}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{category._count?.produtos ?? 0}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="text-accent hover:text-accent/70 mr-3 disabled:opacity-50"
                  disabled={isLoading} // Desabilita durante carregamento
                  aria-label={`Editar ${category.nome}`}
                >
                  <EditIcon size={18} />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-error hover:text-error/70 disabled:opacity-50"
                  disabled={isLoading} // Desabilita durante carregamento
                  aria-label={`Excluir ${category.nome}`}
                >
                  <TrashIcon size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-accent">Categorias</h1>
        <Button
          onClick={() => handleOpenModal(null)}
          color="accent"
          disabled={isLoading && categories.length === 0} // Desabilita no load inicial
        >
          <PlusIcon size={18} /> <span className="ml-2">Nova Categoria</span>
        </Button>
      </div>

      <div className="bg-white rounded-4xl shadow-soft p-6">
        <ErrorMessage message={error} />
        {/* Adicionado relative aqui */}
        <div className="overflow-x-auto relative">{renderTableContent()}</div>
        <PaginationControls /> {/* Controles de Paginação */}
      </div>

      <CategoryFormModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveCategory}
        category={modalState.category}
      />
    </div>
  );
};

export default AdminCategories;
