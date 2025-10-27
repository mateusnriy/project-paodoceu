// src/pages/Orders.tsx
import React, { useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getErrorMessage } from '../utils/errors';
import { Pedido, StatusPedido } from '../types';
import { formatarMoeda, formatarData } from '../utils/formatters';

interface OrderCardProps {
  pedido: Pedido;
  onConcluir: (id: string) => void;
  isUpdating: boolean;
}

const OrderCard: React.FC<OrderCardProps> = React.memo(
  ({ pedido, onConcluir, isUpdating }) => {

    const getStatusClasses = (status: StatusPedido | string) => {
      switch (status) {
        case StatusPedido.PRONTO:
          return {
            bg: 'bg-status-success-bg',
            text: 'text-status-success-text',
            border: 'border-status-success',
          };
        case StatusPedido.ENTREGUE:
          return {
            bg: 'bg-gray-100',
            text: 'text-gray-600',
            border: 'border-gray-300',
          };
        case StatusPedido.PENDENTE:
        default:
          return {
            bg: 'bg-status-warning-bg',
            text: 'text-status-warning-text',
            border: 'border-status-warning',
          };
      }
    };

    const statusClasses = getStatusClasses(pedido.status);
    const statusFormatado = typeof pedido.status === 'string'
        ? pedido.status.charAt(0) + pedido.status.slice(1).toLowerCase()
        : 'Desconhecido';

    return (
      <div className="bg-primary-white shadow-soft rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div
          className={`px-4 py-3 border-b ${statusClasses.bg} ${statusClasses.border}`}
        >
          <div className="flex justify-between items-center">
            <span className={`font-bold text-lg ${statusClasses.text}`}>
              {/* CORRIGIDO: Usar numero_sequencial_dia */}
              Senha: {pedido.numero_sequencial_dia ?? 'N/A'}
            </span>
            <span
              className={`font-semibold px-3 py-1 rounded-full text-sm ${statusClasses.bg} ${statusClasses.text}`}
            >
              {statusFormatado}
            </span>
          </div>
        </div>

        <div className="p-4 flex-1">
          <p className="text-sm text-text-secondary mb-2">
            {/* CORRIGIDO: usar criado_em */}
            {formatarData(pedido.criado_em, {
              timeStyle: 'short',
              dateStyle: 'short',
            })}
          </p>
          <ul className="space-y-1 mb-3">
            {pedido.itens.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-text-primary">{item.produto.nome}</span>
                <span className="text-text-secondary font-medium">
                  x{item.quantidade}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-3">
            <span className="text-base font-semibold text-text-primary">Total:</span>
            <span className="text-lg font-bold text-text-primary">
              {/* CORRIGIDO: usar valor_total */}
              {formatarMoeda(pedido.valor_total)}
            </span>
          </div>

          {pedido.status === StatusPedido.PRONTO && (
            <Button
              onClick={() => onConcluir(pedido.id)}
              disabled={isUpdating}
              className="w-full"
              variant="secondary"
              size="sm"
            >
              {isUpdating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                'Marcar como Entregue' // Texto ajustado
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }
);
OrderCard.displayName = 'OrderCard';

// Página Principal da Fila
const Orders: React.FC = () => {
  const {
    pedidos,
    isLoading,
    error,
    handleConcluirPedido,
    isUpdating,
  } = useOrders();

  const handleConcluirCallback = useCallback(
    (id: string) => {
      handleConcluirPedido(id);
    },
    [handleConcluirPedido]
  );

  const renderContent = () => {
    if (isLoading && pedidos.length === 0) {
      return (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="animate-spin text-gray-500" size={40} />
        </div>
      );
    }

    if (error) {
      return (
         <div className="pt-10">
            {/* CORREÇÃO: Removido title prop */}
            <ErrorMessage
               message={`Erro ao carregar pedidos: ${getErrorMessage(error)}`}
            />
         </div>
      );
    }

    if (pedidos.length === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Nenhum pedido pronto na fila
          </h2>
          <p className="text-text-secondary">
            Novos pedidos aparecerão aqui assim que forem marcados como prontos.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {pedidos.map((pedido) => (
          <OrderCard
            key={pedido.id}
            pedido={pedido}
            onConcluir={handleConcluirCallback}
            isUpdating={isUpdating === pedido.id} // Verifica se este card está sendo atualizado
          />
        ))}
      </div>
    );
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 text-center text-text-primary">
        Fila de Pedidos
      </h1>
      {renderContent()}
    </main>
  );
};

export default Orders;
