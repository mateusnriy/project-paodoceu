import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { CheckIcon, ArrowLeftIcon, ClockIcon } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { orders, isLoading, error, handleCompleteOrder } = useOrders();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner size={40} />
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-white rounded-4xl shadow-soft p-8 text-center">
          <ErrorMessage message={error} />
        </div>
      );
    }
    if (orders.length === 0) {
      return (
        <div className="bg-white rounded-4xl shadow-soft p-8 text-center">
          <p className="text-gray-600">Não há pedidos aguardando retirada.</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`bg-white rounded-4xl shadow-soft overflow-hidden transition-all duration-500 ${
              order.completed ? 'bg-success/20 scale-95 opacity-50' : ''
            }`}
          >
            <div className="p-4 bg-primary/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-accent">
                  #{order.numero_sequencial_dia}
                </span>
                <span className="text-sm text-gray-600">
                  {new Date(order.criado_em).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <ClockIcon size={16} />
                <span className="text-sm">Aguardando</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium mb-2">Itens:</h3>
              <ul className="space-y-1 mb-4 max-h-24 overflow-y-auto">
                {order.itens.map((item, index) => (
                  <li key={index} className="text-gray-700 text-sm">
                    {item.quantidade}x {item.produto.nome}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleCompleteOrder(order.id)}
                color="primary"
                fullWidth
                className="mt-2"
                disabled={order.completed}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckIcon size={18} />
                  <span>Marcar como Entregue</span>
                </div>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-2 text-gray-600 hover:text-accent"
            >
              <ArrowLeftIcon size={20} />
              <span className="hidden sm:inline">Voltar ao PDV</span>
            </button>
            <h1 className="text-2xl font-bold text-accent">Pedidos Aguardando Retirada</h1>
          </div>
          <button
            onClick={() => navigate('/display')}
            className="text-accent hover:underline flex items-center gap-2"
          >
            <span className="hidden sm:inline">Ver Tela de Chamada</span>
            <span className="sm:hidden">Tela de Chamada</span>
          </button>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

// Exportar como default para o Lazy Loading
export default Orders;
