import React, { useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getErrorMessage } from '../utils/errors';
import { Pedido, StatusPedido } from '../types';
import { formatarMoeda, formatarData } from '../utils/formatters';

/**
 * REFATORAÇÃO (Commit 2.4):
 * - Removido o Link "Voltar ao PDV" (já feito no Commit 1.5, mas garantido aqui).
 * - Corrigidos os estilos de status dos cards (item 4.1.4):
 * - "Aguardando" agora usa 'status-warning' (Laranja/Amarelo).
 * - "Pronto" agora usa 'status-success' (Verde).
 * - Aplicados novos tokens de design (tipografia, cores, bordas, sombras).
 */

// --- Componente OrderCard (Refatorado com novos tokens) ---

interface OrderCardProps {
  pedido: Pedido;
  onConcluir: (id: string) => void;
  isUpdating: boolean;
}

const OrderCard: React.FC<OrderCardProps> = React.memo(
  ({ pedido, onConcluir, isUpdating }) => {
    
    // Função de classes de status ATUALIZADA (item 4.1.4)
    const getStatusClasses = (status: StatusPedido) => {
      switch (status) {
        // Status PRONTO (Verde)
        case StatusPedido.PRONTO:
          return {
            bg: 'bg-status-success-bg', // bg-[#D1FAE5]
            text: 'text-status-success-text', // text-[#065F46]
            border: 'border-status-success', // border-[#10B981]
          };
        // Status CONCLUÍDO (Cinza)
        case StatusPedido.CONCLUIDO:
          return {
            bg: 'bg-gray-100',
            text: 'text-gray-600',
            border: 'border-gray-300',
          };
        // Status AGUARDANDO (Laranja/Amarelo)
        case StatusPedido.AGUARDANDO:
        default:
          return {
            bg: 'bg-status-warning-bg', // bg-[#FFF8E9]
            text: 'text-status-warning-text', // text-[#B37C17]
            border: 'border-status-warning', // border-[#FFB020]
          };
      }
    };
    
    const statusClasses = getStatusClasses(pedido.status);

    // Capitaliza a primeira letra (ex: Aguardando)
    const statusFormatado =
      pedido.status.charAt(0) + pedido.status.slice(1).toLowerCase();

    return (
      <div className="bg-primary-white shadow-soft rounded-xl border border-gray-200 overflow-hidden flex flex-col"> {/* rounded-xl (12px), shadow-soft */}
        {/* Header do Card (com classes de status) */}
        <div
          className={`px-4 py-3 border-b ${statusClasses.bg} ${statusClasses.border}`}
        >
          <div className="flex justify-between items-center">
            <span className={`font-bold text-lg ${statusClasses.text}`}>
              Senha: {pedido.senha}
            </span>
            <span
              className={`font-semibold px-3 py-1 rounded-full text-sm ${statusClasses.bg} ${statusClasses.text}`}
            >
              {statusFormatado}
            </span>
          </div>
        </div>

        {/* Corpo do Card */}
        <div className="p-4 flex-1">
          <p className="text-sm text-text-secondary mb-2"> {/* text-secondary */}
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

        {/* Rodapé do Card */}
        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-3">
            <span className="text-base font-semibold text-text-primary">Total:</span>
            <span className="text-lg font-bold text-text-primary">
              {formatarMoeda(pedido.total)}
            </span>
          </div>
          
          {/* Botão de Concluir (só aparece se PRONTO) */}
          {pedido.status === StatusPedido.PRONTO && (
            <Button
              onClick={() => onConcluir(pedido.id)}
              disabled={isUpdating}
              className="w-full"
              variant="secondary" // Botão secundário (cinza claro)
              size="sm" // Botão pequeno
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
// --- Fim do Componente OrderCard ---


// Página Principal da Fila
const Orders: React.FC = () => {
  const {
    pedidos,
    isLoading,
    error,
    handleConcluirPedido,
    isUpdating,
  } = useOrders();

  // Memoiza a função de concluir para passar ao OrderCard
  const handleConcluirCallback = useCallback(
    (id: string) => {
      handleConcluirPedido(id);
    },
    [handleConcluirPedido]
  );

  // Separa as listas de pedidos
  const { pedidosAguardando, pedidosProntos } = useMemo(() => {
    const aguardando = pedidos.filter(
      (p) => p.status === StatusPedido.AGUARDANDO
    );
    const prontos = pedidos.filter(
      (p) => p.status === StatusPedido.PRONTO
    );
    // Pedidos "Prontos" são exibidos primeiro
    return { pedidosAguardando: aguardando, pedidosProntos: prontos };
  }, [pedidos]);

  // Renderização do conteúdo principal
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="animate-spin text-gray-500" size={40} />
        </div>
      );
    }

    if (error) {
      return (
        <ErrorMessage
          title="Erro ao carregar pedidos"
          message={getErrorMessage(error)}
        />
      );
    }

    if (pedidos.length === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Nenhum pedido na fila
          </h2>
          <p className="text-text-secondary">
            Novos pedidos aparecerão aqui assim que forem pagos.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"> {/* 8px grid (gap-4 / gap-6) */}
        {/* Mapeia Pedidos Prontos Primeiro */}
        {pedidosProntos.map((pedido) => (
          <OrderCard
            key={pedido.id}
            pedido={pedido}
            onConcluir={handleConcluirCallback}
            isUpdating={isUpdating === pedido.id}
          />
        ))}
        {/* Mapeia Pedidos Aguardando */}
        {pedidosAguardando.map((pedido) => (
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
    // Container principal da página (padding 8px grid)
    <main className="container mx-auto p-4 md:p-8">
      
      {/* Título (H1 - 24px Bold) */}
      <h1 className="text-2xl font-bold mb-6 text-center text-text-primary">
        Fila de Pedidos
      </h1>
      
      {renderContent()}
    </main>
  );
};

export default Orders;
