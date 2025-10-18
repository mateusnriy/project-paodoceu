
import React, { memo, ReactNode } from 'react';
import { Button } from './Button';
import { Trash2, Minus, Plus } from 'lucide-react';
import { Pedido, PedidoItem } from '../../types'; // Importa o tipo 'Pedido'
import { formatarMoeda } from '../../utils/formatters';

// --- Props Refatoradas ---
// O componente agora recebe o objeto 'Pedido', o 'total' (calculado pelo hook),
// e funções de callback com nomes padronizados.
// Os botões de ação (Finalizar/Cancelar) são recebidos como 'children'.
interface OrderSummaryProps {
  pedido: Pedido;
  total: number;
  onItemUpdateQuantity?: (id: string, quantidade: number) => void;
  onItemRemove?: (id: string) => void;
  onLimparCarrinho?: () => void;
  children: ReactNode; // Para os botões de ação (ex: "Ir para Pagamento")
}

// --- Componente ItemdoCarrinho (Interno) ---
// Memoizado para performance, pois será renderizado em uma lista
const CartItem: React.FC<{
  item: PedidoItem;
  onUpdateQuantity: OrderSummaryProps['onItemUpdateQuantity'];
  onRemove: OrderSummaryProps['onItemRemove'];
}> = memo(({ item, onUpdateQuantity, onRemove }) => {
  
  // Handlers de clique (só são definidos se a função for passada)
  const handleDecrease = onUpdateQuantity
    ? () => onUpdateQuantity(item.id, item.quantidade - 1)
    : undefined;
    
  const handleIncrease = onUpdateQuantity
    ? () => onUpdateQuantity(item.id, item.quantidade + 1)
    : undefined;
    
  const handleRemove = onRemove
    ? () => onRemove(item.id)
    : undefined;

  // Define se os botões de update/remove devem ser mostrados
  const isInteractive = !!(onUpdateQuantity && onRemove);

  return (
    <li className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
      {/* Informações do Produto */}
      <div className="flex-1 pr-2">
        <p className="font-semibold text-text-primary truncate">{item.produto.nome}</p>
        <p className="text-sm text-text-secondary">
          {formatarMoeda(item.produto.preco)} x {item.quantidade}
        </p>
      </div>

      {/* Controles (Apenas se for interativo) */}
      {isInteractive && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Botão Diminuir (Acessibilidade: 40x40px) */}
          <button
            onClick={handleDecrease}
            className="
              flex items-center justify-center w-9 h-9 rounded-lg 
              bg-background-light-blue text-text-secondary 
              hover:bg-primary-blue/20 hover:text-primary-blue
              disabled:bg-status-disabled-bg disabled:text-status-disabled-text disabled:cursor-not-allowed
            " // w-9 h-9 (36px) - mais próximo de 44px
            disabled={item.quantidade <= 1}
            aria-label={`Diminuir quantidade de ${item.produto.nome}`}
          >
            <Minus size={16} />
          </button>
          
          {/* Span da quantidade (Acessibilidade) */}
          <span className="w-8 text-center font-medium text-text-primary" aria-live="polite">
            {item.quantidade}
          </span>
          
          {/* Botão Aumentar (Acessibilidade: 40x40px) */}
          <button
            onClick={handleIncrease}
            className="
              flex items-center justify-center w-9 h-9 rounded-lg 
              bg-background-light-blue text-text-secondary 
              hover:bg-primary-blue/20 hover:text-primary-blue
            "
            aria-label={`Aumentar quantidade de ${item.produto.nome}`}
          >
            <Plus size={16} />
          </button>
          
          {/* Botão Remover (Acessibilidade: 40x40px) */}
          <button
            onClick={handleRemove}
            className="
              flex items-center justify-center w-9 h-9 rounded-lg 
              bg-background-light-blue text-text-secondary 
              hover:bg-status-error-bg hover:text-status-error
              ml-1
            "
            aria-label={`Remover ${item.produto.nome} do carrinho`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </li>
  );
});
CartItem.displayName = 'CartItem';

// --- Componente Principal OrderSummary ---
export const OrderSummary = memo<OrderSummaryProps>(({
  pedido,
  total,
  onItemUpdateQuantity,
  onItemRemove,
  onLimparCarrinho,
  children,
}) => {
  const { itens } = pedido;

  return (
    <div className="bg-primary-white rounded-xl shadow-soft p-6 h-full flex flex-col border border-gray-200"> {/* 8px grid (p-6=24px), rounded-xl */}
      
      {/* Cabeçalho do Carrinho */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-blue"> {/* H1 (24px Bold), primary-blue */}
          Carrinho
        </h2>
        {/* Botão Limpar Carrinho (só aparece se houver itens e a função for passada) */}
        {itens.length > 0 && onLimparCarrinho && (
          <Button
            variant="link"
            size="sm"
            className="text-status-error"
            onClick={onLimparCarrinho}
          >
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Lista de Itens */}
      {itens.length === 0 ? (
        <div className="flex-grow flex items-center justify-center py-10">
          <p className="text-text-secondary text-center">
            Nenhum item adicionado
          </p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto mb-4 -mr-2 pr-2"> {/* Scroll interno */}
          <ul className="space-y-2">
            {itens.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onItemUpdateQuantity}
                onRemove={onItemRemove}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Rodapé (Total e Ações) */}
      <div className="border-t border-gray-200 pt-4 mt-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-lg text-text-primary">Total:</span>
          {/* Acessibilidade: Anuncia mudanças no total */}
          <span
            className="font-bold text-xl text-primary-blue"
            aria-live="polite"
          >
            {formatarMoeda(total)}
          </span>
        </div>
        
        {/* Botões de Ação (passados como children) */}
        <div className="flex flex-col gap-2">
          {children}
        </div>
      </div>
    </div>
  );
});

OrderSummary.displayName = 'OrderSummary';
