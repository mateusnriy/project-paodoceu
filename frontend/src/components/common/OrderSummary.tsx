// frontend/src/components/common/OrderSummary.tsx
import React, { memo, ReactNode } from 'react';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Pedido, PedidoItem } from '../../types'; // Tipos já usam snake_case
import { formatarMoeda } from '../../utils/formatters';

interface OrderSummaryProps {
  pedido: Pedido; // Recebe Pedido (que contém PedidoItem[])
  total: number;
  onItemUpdateQuantity?: (produtoId: string, quantidade: number) => void; // Passa ID do PRODUTO
  onItemRemove?: (produtoId: string) => void; // Passa ID do PRODUTO
  children?: ReactNode; // Tornar children opcional
}

// Componente interno para item do carrinho
const CartItem: React.FC<{
  item: PedidoItem;
  onUpdateQuantity: OrderSummaryProps['onItemUpdateQuantity'];
  onRemove: OrderSummaryProps['onItemRemove'];
}> = memo(({ item, onUpdateQuantity, onRemove }) => {

  const handleDecrease = onUpdateQuantity
    ? () => onUpdateQuantity(item.produto.id, item.quantidade - 1) // Usa produto.id
    : undefined;

  const handleIncrease = onUpdateQuantity
    ? () => onUpdateQuantity(item.produto.id, item.quantidade + 1) // Usa produto.id
    : undefined;

  const handleRemove = onRemove
    ? () => onRemove(item.produto.id) // Usa produto.id
    : undefined;

  const isInteractive = !!(onUpdateQuantity && onRemove);
  // Correção A.1: Usa produto.estoque
  const isOutOfStock = item.quantidade >= item.produto.estoque;
  const isMinQuantity = item.quantidade <= 1;

  return (
    <li className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
      {/* Info Produto */}
      <div className="flex-1 pr-2 overflow-hidden">
        <p className="font-semibold text-text-primary truncate" title={item.produto.nome}>{item.produto.nome}</p>
        <p className="text-sm text-text-secondary">
          {/* Correção A.1: Usa item.preco_unitario */}
          {formatarMoeda(item.preco_unitario)} x {item.quantidade}
        </p>
      </div>

      {/* Controles Interativos */}
      {isInteractive && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={handleDecrease} disabled={isMinQuantity} className="p-1 rounded-md text-text-secondary hover:bg-gray-100 disabled:opacity-50" aria-label={`Diminuir ${item.produto.nome}`}> <Minus size={16} /> </button>
          <span className="w-8 text-center text-sm font-medium" aria-live="polite"> {item.quantidade} </span>
          <button onClick={handleIncrease} disabled={isOutOfStock} className="p-1 rounded-md text-text-secondary hover:bg-gray-100 disabled:opacity-50" aria-label={`Aumentar ${item.produto.nome}`}> <Plus size={16} /> </button>
          <button onClick={handleRemove} className="p-1 rounded-md text-status-error hover:bg-status-error/10" aria-label={`Remover ${item.produto.nome}`}> <Trash2 size={16} /> </button>
        </div>
      )}

      {/* Subtotal (não interativo) */}
      {!isInteractive && (
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-sm font-semibold text-text-primary">
            {/* Correção A.1: Usa item.preco_unitario */}
            {formatarMoeda(item.preco_unitario * item.quantidade)}
          </p>
        </div>
      )}
    </li>
  );
});
CartItem.displayName = 'CartItem';

// Componente Principal OrderSummary
export const OrderSummary = memo<OrderSummaryProps>(({
  pedido,
  total,
  onItemUpdateQuantity,
  onItemRemove,
  children,
}) => {
  const { itens } = pedido;

  return (
    <div className="bg-primary-white rounded-xl shadow-soft h-full flex flex-col border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg md:text-xl font-bold text-primary-blue flex items-center gap-2">
          <ShoppingCart size={20}/> Carrinho
        </h2>
        <div className="flex gap-2">
          {children} {/* Botões como Limpar Carrinho */}
        </div>
      </div>

      {/* Lista de Itens */}
      {itens.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-10 text-center">
          <ShoppingCart size={40} className="text-gray-300 mb-3" />
          <p className="text-text-secondary font-medium">Seu carrinho está vazio</p>
          <p className="text-sm text-text-secondary/80 mt-1">Adicione produtos da lista ao lado.</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto p-4 md:p-6 pt-3">
          <ul className="space-y-0">
            {itens.map((item) => (
              // Correção A.1: Key deve ser única, usar produto.id se item.id não for confiável
              <CartItem
                key={item.produto.id} // Usando produto.id como chave mais segura
                item={item}
                onUpdateQuantity={onItemUpdateQuantity}
                onRemove={onItemRemove}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Rodapé Total */}
      {itens.length > 0 && (
        <div className="border-t border-gray-200 p-4 md:p-6 pt-4 flex-shrink-0 bg-gray-50">
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-base md:text-lg text-text-primary">Total:</span>
            <span className="font-bold text-lg md:text-xl text-primary-blue" aria-live="polite">
              {formatarMoeda(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
OrderSummary.displayName = 'OrderSummary';
