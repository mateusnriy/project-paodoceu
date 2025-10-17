import React from 'react';
import { Button } from '../../components/common/Button';
import {
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { ProductFormModal } from './components/ProductFormModal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { formatCurrency } from '../../utils/formatters';
import { SkeletonTable } from '../../components/ui/SkeletonTable';

const AdminProducts: React.FC = () => {
  const {
    isLoading, // Agora indica carregamento de nova página/busca também
    error,
    products,
    categories,
    searchTerm,
    setSearchTerm,
    modalState,
    handleOpenModal,
    handleCloseModal,
    handleSaveProduct,
    handleDeleteProduct,
    currentPage,
    totalPages,
    setCurrentPage,
  } = useAdminProducts();

  // Componente interno para paginação
  const PaginationControls = () => {
    // Não mostra se só há uma página ou no carregamento inicial total
    if (totalPages <= 1 || (isLoading && products.length === 0)) return null;

    return (
      <div className="mt-6 flex items-center justify-center gap-4">
        {/* Botões desabilitados durante QUALQUER carregamento */}
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
    if (isLoading && products.length === 0) {
      return <SkeletonTable rows={5} cols={6} />;
    }
    // Mensagem se não houver produtos após busca/carregamento
    if (products.length === 0 && !isLoading) {
      return <div className="text-center py-10 text-gray-500">Nenhum produto encontrado.</div>;
    }
    // Tabela normal
    return (
      <table className="min-w-full divide-y divide-gray-200 relative">
        {' '}
        {/* Adicionado relative */}
        {/* Overlay de Loading para troca de página/busca */}
        {isLoading && products.length > 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            <LoadingSpinner size={32} />
          </div>
        )}
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Produto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Preço
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Categoria
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Estoque
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${isLoading ? 'opacity-50' : ''}`}>
          {' '}
          {/* Opacidade durante loading */}
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <img
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0 bg-gray-100" // Fundo cinza
                    src={product.imagem_url || 'https://via.placeholder.com/100'}
                    alt={product.nome}
                    loading="lazy"
                  />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{product.nome}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm">R$ {formatCurrency(product.preco)}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm">{product.categoria.nome}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm">{product.estoque}</div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.estoque > 0 ? 'bg-success/20 text-success' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {product.estoque > 0 ? 'Disponível' : 'Indisponível'}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium">
                <button
                  onClick={() => handleOpenModal(product)}
                  className="text-accent hover:text-accent/70 mr-3 disabled:opacity-50"
                  disabled={isLoading}
                >
                  <EditIcon size={18} />
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-error hover:text-error/70 disabled:opacity-50"
                  disabled={isLoading}
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
        <h1 className="text-2xl font-bold text-accent">Produtos</h1>
        <Button
          onClick={() => handleOpenModal(null)}
          color="accent"
          disabled={isLoading && products.length === 0}
        >
          <PlusIcon size={18} /> <span className="ml-2">Novo Produto</span>
        </Button>
      </div>

      <div className="bg-white rounded-4xl shadow-soft p-6">
        <ErrorMessage message={error} />
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={18} className="text-gray-400" />
          </div>
          <input
            type="search" // Use type="search" para melhor semântica e UX
            placeholder="Buscar produtos..."
            className="pl-10 w-full px-4 py-3 rounded-4xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading && products.length === 0}
          />
        </div>

        <div className="overflow-x-auto relative">
          {' '}
          {/* Adicionado relative */}
          {renderTableContent()}
        </div>

        <PaginationControls />
      </div>

      <ProductFormModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveProduct}
        product={modalState.product}
        categories={categories}
      />
    </div>
  );
};

export default AdminProducts;
