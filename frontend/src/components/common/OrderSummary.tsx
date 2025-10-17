import React, { memo } from 'react'; // Importado memo
import { Button } from './Button';
import { TrashIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { CartItem } from '../../types'; // Barrel file
import { formatCurrency } from '../../utils/formatters'; // Formatador

interface OrderSummaryProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onFinishOrder: () => void;
  onCancelOrder: () => void;
}

// Envolvido com React.memo
export const OrderSummary = memo<OrderSummaryProps>(({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onFinishOrder,
  onCancelOrder,
}) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-white rounded-4xl shadow-soft p-4 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-accent mb-4">Carrinho</h2>

      {items.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500 text-center">Nenhum item adicionado</p>
        </div>
      ) : (
        <div className="flex-grow overflow-auto mb-4">
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                <div className="flex-grow pr-2"> {/* Adicionado padding para evitar sobreposição */}
                  <p className="font-medium truncate">{item.name}</p> {/* Truncate para nomes longos */}
                  <p className="text-sm text-gray-600">
                    R$ {formatCurrency(item.price)} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0"> {/* Evita que botões encolham */}
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={item.quantity <= 1}
                    aria-label={`Diminuir quantidade de ${item.name}`} // Acessibilidade
                  >
                    <MinusIcon size={14} />
                  </button>
                  <span className="w-6 text-center" aria-live="polite">{item.quantity}</span> {/* Notifica mudanças */}
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                     aria-label={`Aumentar quantidade de ${item.name}`} // Acessibilidade
                     // Adicionar disabled se houver lógica de estoque máximo aqui
                  >
                    <PlusIcon size={14} />
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-error hover:text-white"
                     aria-label={`Remover ${item.name} do carrinho`} // Acessibilidade
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t pt-4 mt-auto"> {/* mt-auto para empurrar para baixo */}
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium text-lg">Total:</span>
          <span className="font-bold text-xl text-accent">
            R$ {formatCurrency(total)}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={onFinishOrder}
            disabled={items.length === 0}
            color="accent"
            fullWidth
          >
            Finalizar Pedido
          </Button>
          <Button
            onClick={onCancelOrder}
            disabled={items.length === 0}
            variant="outlined"
            color="error"
            fullWidth
          >
            Cancelar Pedido
          </Button>
        </div>
      </div>
    </div>
  );
});

OrderSummary.displayName = 'OrderSummary'; // DisplayName adicionado
