import React, { memo, ReactNode } from 'react';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react'; 
import { Pedido, PedidoItem } from '../../types'; 
import { formatarMoeda } from '../../utils/formatters';

interface OrderSummaryProps {
  pedido: Pedido; 
  total: number;
  onItemUpdateQuantity?: (itemId: string, quantidade: number) => void; 
  onItemRemove?: (itemId: string) => void; 
  children: ReactNode;
}

const CartItem: React.FC<{
  item: PedidoItem;
  onUpdateQuantity: OrderSummaryProps['onItemUpdateQuantity'];
  onRemove: OrderSummaryProps['onItemRemove'];
}> = memo(({ item, onUpdateQuantity, onRemove }) => {

  const handleDecrease = onUpdateQuantity
    ? () => onUpdateQuantity(item.id, item.quantidade - 1)
    : undefined;

  const handleIncrease = onUpdateQuantity
    ? () => onUpdateQuantity(item.id, item.quantidade + 1)
    : undefined;

  const handleRemove = onRemove
    ? () => onRemove(item.id)
    : undefined;

  // Verifica se as funções foram passadas para habilitar interatividade
  const isInteractive = !!(onUpdateQuantity && onRemove);
  // Verifica se o produto está em estoque para desabilitar o botão '+'
  const isOutOfStock = item.quantidade >= item.produto.quantidadeEstoque;
  // Verifica se a quantidade é 1 para desabilitar o botão '-'
  const isMinQuantity = item.quantidade <= 1;

  return (
    <li className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
      {/* Informações do Produto */}
      <div className="flex-1 pr-2 overflow-hidden"> {/* Adicionado overflow-hidden */}
        <p className="font-semibold text-text-primary truncate" title={item.produto.nome}>{item.produto.nome}</p>
        <p className="text-sm text-text-secondary">
          {formatarMoeda(item.preco)} x {item.quantidade} {/* Usar item.preco */}
        </p>
      </div>

      {/* Controles (Apenas se for interativo) */}
      {isInteractive && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleDecrease}
            className="
              flex items-center justify-center w-8 h-8 rounded-md {/* Tamanho um pouco menor */}
              bg-background-light-blue text-text-secondary
              hover:bg-primary-blue/20 hover:text-primary-blue
              disabled:bg-status-disabled-bg disabled:text-status-disabled-text disabled:cursor-not-allowed
              transition-colors duration-150
            "
            disabled={isMinQuantity} // Desabilitar se quantidade for 1
            aria-label={`Diminuir quantidade de ${item.produto.nome}`}
          >
            <Minus size={16} />
          </button>

          {/* Exibe a quantidade atual */}
          <span className="w-8 text-center font-medium text-text-primary text-sm" aria-live="polite">
            {item.quantidade}
          </span>

          <button
            onClick={handleIncrease}
            className="
              flex items-center justify-center w-8 h-8 rounded-md
              bg-background-light-blue text-text-secondary
              hover:bg-primary-blue/20 hover:text-primary-blue
              disabled:bg-status-disabled-bg disabled:text-status-disabled-text disabled:cursor-not-allowed
              transition-colors duration-150
            "
            disabled={isOutOfStock} // Desabilitar se estiver sem estoque
            aria-label={`Aumentar quantidade de ${item.produto.nome}`}
          >
            <Plus size={16} />
          </button>

          {/* Botão Remover */}
          <button
            onClick={handleRemove}
            className="
              flex items-center justify-center w-8 h-8 rounded-md
              bg-background-light-blue text-text-secondary
              hover:bg-status-error/10 hover:text-status-error
              ml-1 transition-colors duration-150
            "
            aria-label={`Remover ${item.produto.nome} do carrinho`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

       {/* Exibe subtotal se não for interativo (ex: tela de pagamento) */}
       {!isInteractive && (
            <div className="text-right flex-shrink-0 ml-2">
                 <p className="text-sm font-semibold text-text-primary">
                    {formatarMoeda(item.preco * item.quantidade)}
                 </p>
            </div>
       )}
    </li>
  );
});
CartItem.displayName = 'CartItem';


// --- Componente Principal OrderSummary ---
export const OrderSummary = memo<OrderSummaryProps>(({
  pedido, // Recebe Pedido
  total,
  onItemUpdateQuantity,
  onItemRemove,
  children, // Botões como Limpar ou Finalizar
}) => {
  const { itens } = pedido; // Extrai itens do objeto Pedido

  return (
    // Container principal com altura flexível e scroll interno
    <div className="bg-primary-white rounded-xl shadow-soft h-full flex flex-col border border-gray-200 overflow-hidden">

      {/* Cabeçalho do Carrinho */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0"> {/* Padding ajustado */}
        <h2 className="text-xl font-bold text-primary-blue flex items-center gap-2"> {/* Tamanho ajustado */}
           <ShoppingCart size={22}/> Carrinho
        </h2>
        {/* Renderiza os botões passados como children (ex: Limpar Carrinho) */}
        <div className="flex gap-2">
           {children}
        </div>
      </div>

      {/* Lista de Itens */}
      {itens.length === 0 ? (
        // Mensagem de carrinho vazio
        <div className="flex-grow flex flex-col items-center justify-center p-10 text-center">
          <ShoppingCart size={48} className="text-gray-300 mb-4" />
          <p className="text-text-secondary font-medium">
            Seu carrinho está vazio
          </p>
          <p className="text-sm text-text-secondary/80 mt-1">
             Adicione produtos da lista ao lado.
          </p>
        </div>
      ) : (
        // Container da lista com scroll
        <div className="flex-grow overflow-y-auto p-6 pt-3"> {/* Padding ajustado */}
          <ul className="space-y-0"> {/* Remover space-y, CartItem já tem padding/border */}
            {itens.map((item) => (
              <CartItem
                key={item.id} // Usar item.id (produtoId temporário) como chave
                item={item}
                onUpdateQuantity={onItemUpdateQuantity}
                onRemove={onItemRemove}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Rodapé (Total) - Só mostra se houver itens */}
      {itens.length > 0 && (
          <div className="border-t border-gray-200 p-6 pt-4 flex-shrink-0 bg-gray-50"> {/* Fundo diferente */}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg text-text-primary">Total:</span>
              <span
                className="font-bold text-xl text-primary-blue"
                aria-live="polite"
              >
                {formatarMoeda(total)}
              </span>
            </div>
             {/* Ações principais (como "Ir para Pagamento") podem ficar fora do OrderSummary, no layout pai */}
          </div>
      )}
    </div>
  );
});

OrderSummary.displayName = 'OrderSummary';
