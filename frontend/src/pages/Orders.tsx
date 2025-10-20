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

    const getStatusClasses = (status: StatusPedido | string) => { // Aceita string para 'LOCAL' etc.
      switch (status) {
        case StatusPedido.PRONTO:
          return {
            bg: 'bg-status-success-bg',
            text: 'text-status-success-text',
            border: 'border-status-success',
          };
        // <<< CORREÇÃO: Usa ENTREGUE para status concluído >>>
        case StatusPedido.ENTREGUE:
          return {
            bg: 'bg-gray-100',
            text: 'text-gray-600',
            border: 'border-gray-300',
          };
        // <<< CORREÇÃO: Usa PENDENTE para status aguardando >>>
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
              Senha: {pedido.senha ?? 'N/A'}
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
            {formatarData(pedido.dataCriacao, {
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
              {formatarMoeda(pedido.total)}
            </span>
          </div>

          {/* <<< CORREÇÃO: Mostra botão apenas se PRONTO >>> */}
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
                'Marcar como Concluído'
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
  // <<< CORREÇÃO: Pega 'pedidos' diretamente, não mais 'pedidosProntos' e 'pedidosAguardando' >>>
  const {
    pedidos, // Contém apenas os pedidos PRONTOS e não completed
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

  // <<< CORREÇÃO: Não precisa mais separar as listas aqui >>>
  // const { pedidosAguardando, pedidosProntos } = useMemo(() => { ... }, [pedidos]);

  const renderContent = () => {
    if (isLoading && pedidos.length === 0) { // Verifica se está carregando E a lista está vazia
      return (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="animate-spin text-gray-500" size={40} />
        </div>
      );
    }

    if (error) {
      return (
         <div className="pt-10">
            <ErrorMessage
               title="Erro ao carregar pedidos"
               message={getErrorMessage(error)}
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
        {/* <<< CORREÇÃO: Mapeia diretamente a lista 'pedidos' do hook >>> */}
        {pedidos.map((pedido) => (
          <OrderCard
            key={pedido.id}
            pedido={pedido}
            onConcluir={handleConcluirCallback}
            isUpdating={isUpdating === pedido.id}
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
