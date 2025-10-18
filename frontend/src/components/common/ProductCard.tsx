import React, { useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Produto } from '../../types';
import { formatarMoeda } from '../../utils/formatters';

interface ProductCardProps {
  produto: Produto;
  onAddToCart: (produto: Produto) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ produto, onAddToCart }) => {
  // Define se o produto está indisponível (estoque <= 0)
  const indisponivel = produto.quantidadeEstoque <= 0;

  // Memoiza a função de clique para evitar re-renderizações desnecessárias
  const handleAddToCart = useCallback(() => {
    if (!indisponivel) {
      onAddToCart(produto);
    }
  }, [produto, onAddToCart, indisponível]);

  return (
    <div
      className="
        relative bg-primary-white border border-gray-200 
        rounded-xl shadow-soft overflow-hidden 
        flex flex-col
        transition-shadow hover:shadow-md
      " // rounded-xl (12px) e shadow-soft
    >
      {/* Imagem */}
      <div className="w-full h-40 overflow-hidden">
        <img
          src={produto.imagemUrl || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}
          alt={produto.nome}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Informações do Produto */}
      <div className="p-4 flex flex-col flex-1"> {/* 8px grid (p-4 = 16px) */}
        <h3 className="text-lg font-bold text-text-primary mb-1 truncate"> {/* H1/H2 (18px Bold) text-primary */}
          {produto.nome}
        </h3>
        <p className="text-sm text-text-secondary flex-1 mb-3"> {/* Body (14px) text-secondary */}
          {produto.descricao}
        </p>

        {/* Preço e Botão de Adicionar */}
        <div className="flex justify-between items-center mt-auto">
          <span className="text-xl font-bold text-primary-blue"> {/* 20px Bold, primary-blue */}
            {formatarMoeda(produto.preco)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={indisponivel}
            aria-label={`Adicionar ${produto.nome} ao carrinho`}
            className="
              flex items-center justify-center w-10 h-10 
              bg-primary-blue text-white rounded-lg 
              transition-colors 
              hover:bg-primary-blue-hover
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue
              disabled:bg-status-disabled-bg disabled:text-status-disabled-text disabled:cursor-not-allowed
            " // Tamanho 40x40 (w-10, h-10) e rounded-lg (8px)
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Overlay de Produto Indisponível (Guia de Estilo item 4.1.2) */}
      {indisponivel && (
        <div
          className="
            absolute inset-0 bg-status-disabled-bg/80 
            flex items-center justify-center 
            backdrop-blur-[2px]
          "
          aria-hidden="true"
        >
          <span className="text-lg font-bold text-status-disabled-text px-4 py-2 bg-white rounded-lg shadow-md">
            Indisponível
          </span>
        </div>
      )}
    </div>
  );
});

export { ProductCard };
