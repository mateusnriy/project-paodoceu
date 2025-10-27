// src/pages/POS.tsx
import React, { useCallback } from 'react';
// import { Loader2 } from 'lucide-react'; // REMOVIDO
import { OrderSummary } from '../components/common/OrderSummary';
import { ProductCard } from '../components/common/ProductCard';
import { Button } from '../components/common/Button';
import { usePOS } from '../hooks/usePOS';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getErrorMessage } from '../utils/errors';
import { Categoria, Produto } from '../types';

interface CategoriaPillProps {
  categoria: Categoria | { id: 'todos'; nome: string };
  categoriaAtiva: string | null;
  onClick: (id: string | null) => void;
}

const CategoriaPill: React.FC<CategoriaPillProps> = React.memo(
  ({ categoria, categoriaAtiva, onClick }) => {
    const id = categoria.id === 'todos' ? null : categoria.id;
    const isActive = categoriaAtiva === id;

    const baseClasses =
      'px-4 py-2 rounded-full font-semibold text-base transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue';

    const activeClasses = 'bg-primary-blue text-white';

    const inactiveClasses =
      'bg-primary-white text-text-secondary border border-gray-300 hover:bg-background-light-blue';

    return (
      <button
        onClick={() => onClick(id)}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        aria-pressed={isActive}
      >
        {categoria.nome}
      </button>
    );
  }
);
CategoriaPill.displayName = 'CategoriaPill'; // Adicionado displayName


const POS: React.FC = () => {
  const {
    pedido,
    total,
    produtosFiltrados,
    categorias,
    categoriaAtiva,
    setCategoriaAtiva,
    isLoadingProdutos,
    isLoadingCategorias,
    errorProdutos,
    errorCategorias,
    handleAddToCart,
    handleRemoveFromCart,
    handleUpdateQuantity,
    handleLimparCarrinho,
    handleNavigateToPayment,
  } = usePOS();

  // Callbacks memoizados
  const handleRemoveCallback = useCallback(handleRemoveFromCart, [handleRemoveFromCart]);
  const handleUpdateCallback = useCallback(handleUpdateQuantity, [handleUpdateQuantity]);
  const handleLimparCallback = useCallback(handleLimparCarrinho, [handleLimparCarrinho]);
  const handleCheckoutCallback = useCallback(handleNavigateToPayment, [handleNavigateToPayment]);
  const handleAddCallback = useCallback(handleAddToCart, [handleAddToCart]);
  const handleCategoriaClick = useCallback(setCategoriaAtiva, [setCategoriaAtiva]);


  const renderFiltroCategorias = () => {
    if (isLoadingCategorias) {
      return <div className="h-10 animate-pulse bg-gray-200 rounded-full w-full" />;
    }
    if (errorCategorias) {
      // CORREÇÃO: Removido 'title'
      return <ErrorMessage message="Erro ao carregar categorias." />;
    }
    return (
      <nav className="flex flex-wrap gap-3">
        <CategoriaPill
          categoria={{ id: 'todos', nome: 'Todos' }}
          categoriaAtiva={categoriaAtiva}
          onClick={handleCategoriaClick}
        />
        {categorias.map((cat) => (
          <CategoriaPill
            key={cat.id}
            categoria={cat}
            categoriaAtiva={categoriaAtiva}
            onClick={handleCategoriaClick}
          />
        ))}
      </nav>
    );
  };


  const renderListaProdutos = () => {
    if (isLoadingProdutos) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-soft h-64 animate-pulse" />
          ))}
        </div>
      );
    }
    if (errorProdutos) {
      // CORREÇÃO: Removido 'title' prop e usado getErrorMessage
      return <ErrorMessage message={getErrorMessage(errorProdutos)} />;
    }
    if (produtosFiltrados.length === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Nenhum produto encontrado
          </h2>
          <p className="text-text-secondary">
            Tente selecionar outra categoria ou verificar os filtros.
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {produtosFiltrados.map((produto: Produto) => (
          <ProductCard
            key={produto.id}
            produto={produto}
            onAddToCart={handleAddCallback}
          />
        ))}
      </div>
    );
  };

  return (

    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col lg:flex-row lg:gap-8">

        {/* Lado Esquerdo: Produtos e Categorias */}
        <div className="lg:w-2/3">
          <div className="mb-6">
            {renderFiltroCategorias()}
          </div>
          <div>
            {renderListaProdutos()}
          </div>
        </div>

        {/* Lado Direito: Resumo do Pedido (fixo) */}
        <div className="lg:w-1/3 lg:sticky top-[104px] h-fit mt-8 lg:mt-0">
          <OrderSummary
            pedido={pedido}
            total={total}
            onItemRemove={handleRemoveCallback}
            onItemUpdateQuantity={handleUpdateCallback}
            // CORREÇÃO: onLimparCarrinho removido daqui
          >
            {/* Botão de Pagamento */}
            <Button
              onClick={handleCheckoutCallback}
              disabled={pedido.itens.length === 0 || isLoadingProdutos || isLoadingCategorias}
              className="w-full"
              size="lg"
            >
              Ir para Pagamento
            </Button>

            {/* Botão Limpar Carrinho adicionado aqui */}
            {pedido.itens.length > 0 && (
              <Button
                onClick={handleLimparCallback}
                variant="link"
                size="sm"
                className="text-status-error w-full mt-2" // Adicionado mt-2 para espaçamento
                disabled={isLoadingProdutos || isLoadingCategorias}
              >
                Limpar Carrinho
              </Button>
            )}
          </OrderSummary>
        </div>
      </div>
    </main>
  );
};

export default POS;
