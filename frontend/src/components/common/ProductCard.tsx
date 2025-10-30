// frontend/src/components/common/ProductCard.tsx
import React, { useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Produto } from '../../types'; // Tipo já usa snake_case
import { formatarMoeda } from '../../utils/formatters';

interface ProductCardProps {
  produto: Produto;
  onAddToCart: (produto: Produto) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ produto, onAddToCart }) => {
  // Correção A.1: Usa 'estoque'
  const indisponivel = produto.estoque <= 0 || !produto.ativo;

  const handleAddToCart = useCallback(() => {
    if (!indisponivel) {
      onAddToCart(produto);
    }
  }, [produto, onAddToCart, indisponivel]);

  return (
    <div
      className={`
        relative bg-primary-white border ${indisponivel ? 'border-gray-200' : 'border-gray-200'}
        rounded-xl shadow-soft overflow-hidden flex flex-col
        transition-shadow hover:shadow-md ${indisponivel ? 'opacity-70' : ''}
      `}
    >
      {/* Imagem */}
      <div className="w-full h-40 overflow-hidden bg-gray-100">
        <img
          // Correção A.1: Usa 'imagem_url'
          src={produto.imagem_url || '/placeholder-image.png'} // Usar placeholder local
          alt={produto.nome}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = '/placeholder-image.png')} // Fallback se URL falhar
        />
      </div>

      {/* Informações */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-base font-bold text-text-primary mb-1 truncate" title={produto.nome}>
          {produto.nome}
        </h3>
        <p className="text-sm text-text-secondary flex-1 mb-3 line-clamp-2">
          {produto.descricao || ''} {/* Mostra vazio se não houver descrição */}
        </p>

        {/* Preço e Botão */}
        <div className="flex justify-between items-center mt-auto pt-2">
          <span className="text-lg font-bold text-primary-blue">
            {formatarMoeda(produto.preco)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={indisponivel}
            aria-label={`Adicionar ${produto.nome} ao carrinho`}
            className="
              flex items-center justify-center w-9 h-9 
              bg-primary-blue text-white rounded-lg 
              hover:bg-primary-blue-hover
              disabled:bg-status-disabled-bg disabled:text-status-disabled-text
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-1
            "
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Overlay Indisponível */}
      {indisponivel && (
        <div
          className="
            absolute inset-0 bg-white/70 backdrop-blur-[2px] 
            flex items-center justify-center
          "
          aria-hidden="true"
        >
          <span
            className="
              px-3 py-1 bg-gray-700 text-white 
              text-sm font-semibold rounded-full
            "
          >
            {produto.ativo ? 'Indisponível' : 'Inativo'} {/* Diferencia motivo */}
          </span>
        </div>
      )}
    </div>
  );
});

ProductCard.displayName = 'ProductCard'; // Adicionar display name
export { ProductCard };
