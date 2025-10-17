import React, { memo, useCallback } from 'react'; // Importado memo e useCallback
import { PlusIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters'; // Formatador

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  onAddToCart: (id: string) => void;
}

// Envolvido com React.memo
export const ProductCard = memo<ProductCardProps>(({
  id,
  name,
  price,
  image,
  available,
  onAddToCart,
}) => {
  // useCallback para estabilizar a função passada para o botão
  const handleAddToCartClick = useCallback(() => {
    if (available) {
      onAddToCart(id);
    }
  }, [available, onAddToCart, id]);

  return (
    <div
      className={`relative bg-white rounded-4xl shadow-soft overflow-hidden transition-opacity duration-300 ${
        !available ? 'grayscale opacity-70 cursor-not-allowed' : ''
      }`}
    >
      <div className="aspect-square overflow-hidden bg-gray-100"> {/* Fundo cinza enquanto carrega */}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy" // Adiciona lazy loading nativo para imagens
        />
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-800 truncate" title={name}>{name}</h3> {/* title para nome completo */}
        <div className="flex justify-between items-center mt-1">
          <p className="text-accent font-semibold">
            R$ {formatCurrency(price)}
          </p>
          <button
            onClick={handleAddToCartClick}
            disabled={!available}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              available
                ? 'bg-primary text-white hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            aria-label={`Adicionar ${name} ao carrinho`} // Acessibilidade
          >
            <PlusIcon size={16} />
          </button>
        </div>
      </div>
      {!available && (
        <div className="absolute top-2 right-2 bg-error text-white text-xs font-medium py-1 px-2 rounded-full pointer-events-none">
          Indisponível
        </div>
      )}
    </div>
  );
});

ProductCard.displayName = 'ProductCard'; // DisplayName adicionado
