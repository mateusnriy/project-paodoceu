import React from 'react';
import { Header } from '../components/common/Header';
import { ProductCard } from '../components/common/ProductCard';
import { OrderSummary } from '../components/common/OrderSummary';
import { ShoppingBagIcon } from 'lucide-react';
import { usePOS } from '../hooks/usePOS';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export const POS: React.FC = () => {
  const {
    isLoading,
    error,
    categories,
    filteredProducts,
    activeCategory,
    setActiveCategory,
    cartItems,
    showMobileCart,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleFinishOrder,
    handleCancelOrder,
    toggleMobileCart,
  } = usePOS();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner size={40} />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex-grow flex items-center justify-center p-4">
          <ErrorMessage message={error} />
        </div>
      );
    }
    return (
      <div className="flex-grow p-4 overflow-auto">
        {/* Category Tabs */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-6 py-3 rounded-4xl transition-colors whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.nome}
              </button>
            ))}
          </div>
        </div>
        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.nome}
              price={product.preco}
              image={product.imagem_url || 'https://via.placeholder.com/500?text=Sem+Imagem'}
              available={product.estoque > 0}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row">
        {renderContent()}

        {/* Order Summary - Desktop */}
        <div className="hidden md:block w-96 p-4">
          <OrderSummary
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onFinishOrder={handleFinishOrder}
            onCancelOrder={handleCancelOrder}
          />
        </div>
        
        {/* Mobile Cart Button */}
        <button
          onClick={toggleMobileCart}
          className="md:hidden fixed bottom-4 right-4 bg-primary text-white p-4 rounded-full shadow-soft z-10 flex items-center justify-center"
        >
          <ShoppingBagIcon size={24} />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-accent text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>

        {/* Mobile Cart Drawer */}
        {showMobileCart && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20"
              onClick={toggleMobileCart}
            ></div>
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-4xl shadow-soft z-30 p-4 max-h-[80vh] overflow-auto">
              <OrderSummary
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onFinishOrder={handleFinishOrder}
                onCancelOrder={handleCancelOrder}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// Exportar como default para o Lazy Loading
export default POS;
