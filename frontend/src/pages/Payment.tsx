import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import {
  BanknoteIcon,
  CreditCardIcon,
  ZapIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from 'lucide-react';
import { usePayment } from '../hooks/usePayment';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { formatCurrency } from '../utils/formatters';
import { PaymentMethod } from '../types/order';

// Mapeamento dos métodos de pagamento para UI
const paymentMethodsUI = [
  { id: 'DINHEIRO', name: 'Dinheiro', icon: <BanknoteIcon size={20} /> },
  { id: 'CARTAO_CREDITO', name: 'Cartão de Crédito', icon: <CreditCardIcon size={20} /> },
  { id: 'CARTAO_DEBITO', name: 'Cartão de Débito', icon: <CreditCardIcon size={20} /> },
  { id: 'PIX', name: 'Pix', icon: <ZapIcon size={20} /> },
];

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    isSubmitting,
    isPaymentComplete,
    error,
    order,
    orderTotal,
    selectedMethod,
    setSelectedMethod,
    receivedAmount,
    setReceivedAmount,
    change,
    isConfirmDisabled,
    handlePaymentConfirmation,
  } = usePayment();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <LoadingSpinner size={40} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center gap-2 text-gray-600 hover:text-accent mb-6"
        >
          <ArrowLeftIcon size={20} />
          <span>Voltar ao PDV</span>
        </button>
        <div className="bg-white rounded-4xl shadow-soft p-6 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-accent mb-6">
            Pagamento do Pedido #{order?.numero_sequencial_dia || '...'}
          </h1>

          <ErrorMessage message={error} />

          {isPaymentComplete ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-success/10 p-4 rounded-full mb-4">
                <CheckCircleIcon size={64} className="text-success" />
              </div>
              <h2 className="text-xl font-semibold text-success mb-2">Pagamento Confirmado!</h2>
              <p className="text-gray-600">Redirecionando para a tela de pedidos...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Payment Methods */}
                <div className="flex-1">
                  <h2 className="text-lg font-medium mb-4">Forma de Pagamento</h2>
                  <div className="space-y-3">
                    {paymentMethodsUI.map((method) => (
                      <button
                        key={method.id}
                        className={`w-full flex items-center gap-3 p-4 rounded-4xl border-2 transition-colors ${
                          selectedMethod === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                        disabled={isSubmitting}
                      >
                        <div
                          className={`p-2 rounded-full ${
                            selectedMethod === method.id ? 'bg-primary text-white' : 'bg-gray-100'
                          }`}
                        >
                          {method.icon}
                        </div>
                        <span className="font-medium">{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Order Summary */}
                <div className="flex-1">
                  <h2 className="text-lg font-medium mb-4">Resumo</h2>
                  <div className="bg-neutral p-4 rounded-4xl">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b">
                      <span className="text-gray-600">Valor Total</span>
                      <span className="text-xl font-bold text-accent">
                        R$ {formatCurrency(orderTotal)}
                      </span>
                    </div>
                    {selectedMethod === 'DINHEIRO' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="received" className="block text-sm text-gray-600">
                            Valor Recebido (R$)
                          </label>
                          <input
                            id="received"
                            type="text" // Usar 'text' para permitir vírgula
                            inputMode="decimal" // Melhora a experiência mobile
                            value={receivedAmount}
                            onChange={(e) => setReceivedAmount(e.target.value)}
                            className="w-full px-4 py-2 rounded-4xl border focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0,00"
                            disabled={isSubmitting}
                          />
                        </div>
                        {change > 0 && (
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-600">Troco</span>
                            <span className="font-medium">R$ {formatCurrency(change)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/pos')}
                  className="sm:flex-1"
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
                <Button
                  color="accent"
                  onClick={handlePaymentConfirmation}
                  disabled={isConfirmDisabled}
                  className="sm:flex-1"
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// Exportar como default para o Lazy Loading
export default Payment;
