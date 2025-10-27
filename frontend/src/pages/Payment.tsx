// src/pages/Payment.tsx
import React from 'react';
import { CreditCard, Banknote, QrCode, Loader2 } from 'lucide-react';
import { OrderSummary } from '../components/common/OrderSummary';
import { Button } from '../components/common/Button';
import { usePaymentHandler } from '../hooks/usePaymentHandler';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getErrorMessage } from '../utils/errors';
import { TipoPagamento } from '../types';
import { useNavigate } from 'react-router-dom';

const Payment: React.FC = () => {
  const {
    pedido,
    total,
    isLoading,
    isSubmitting,
    error,
    tipoPagamento,
    setTipoPagamento,
    handleFinalizarPedido,
    handleLimparCarrinho,
  } = usePaymentHandler();

  const navigate = useNavigate();

  const pagamentoOpcoes = [
    { tipo: TipoPagamento.CREDITO, label: 'Cartão de Crédito', icon: CreditCard },
    { tipo: TipoPagamento.DEBITO, label: 'Cartão de Débito', icon: CreditCard },
    { tipo: TipoPagamento.PIX, label: 'PIX', icon: QrCode },
    { tipo: TipoPagamento.DINHEIRO, label: 'Dinheiro', icon: Banknote },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="animate-spin text-gray-500" size={40} />
        </div>
      );
    }

    // CORREÇÃO: Mostra erro apenas se não estiver submetendo
    if (error && !isSubmitting) {
      return (
        // CORREÇÃO: Removido title prop e usado getErrorMessage
        <ErrorMessage
          message={`Erro ao carregar informações de pagamento: ${getErrorMessage(error)}`}
        />
      );
    }

    if (!pedido || pedido.itens.length === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold mb-4 text-text-primary">
            Seu carrinho está vazio ou expirou
          </h2>
          <p className="text-text-secondary">
            Volte para a tela de Vendas para adicionar produtos.
          </p>
          <Button
            onClick={() => navigate('/vendas')}
            variant="link"
            className="mt-4"
          >
            Voltar para Vendas
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <h1 className="text-2xl font-bold mb-6 text-text-primary">Pagamento</h1>

          <div className="bg-primary-white p-6 rounded-xl shadow-soft border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-text-primary">
              Selecione o método de pagamento
            </h2>

            {/* CORREÇÃO: Exibe o erro de submissão aqui, usando getErrorMessage */}
            {error && isSubmitting && (
              <div className="mb-4">
                 <ErrorMessage
                    message={`Erro ao Finalizar Pedido: ${getErrorMessage(error)}`}
                 />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {pagamentoOpcoes.map((opcao) => {
                const isSelected = tipoPagamento === opcao.tipo;
                const baseClasses =
                  'flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary-blue';
                const selectedClasses =
                  'bg-background-light-blue border-primary-blue ring-2 ring-primary-blue';
                const nonSelectedClasses =
                  'bg-primary-white border-gray-300 hover:bg-background-light-blue';

                return (
                  <button
                    key={opcao.tipo}
                    onClick={() => setTipoPagamento(opcao.tipo)}
                    className={`${baseClasses} ${
                      isSelected ? selectedClasses : nonSelectedClasses
                    }`}
                    aria-pressed={isSelected}
                    disabled={isSubmitting}
                  >
                    <opcao.icon
                      className={`mb-2 ${
                        isSelected ? 'text-primary-blue' : 'text-text-secondary'
                      }`}
                      size={32}
                    />
                    <span
                      className={`font-medium ${
                        isSelected ? 'text-primary-blue' : 'text-text-primary'
                      }`}
                    >
                      {opcao.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:w-1/3 lg:sticky top-[112px] h-fit">
          {pedido && ( // Adiciona verificação para pedido nulo
            <OrderSummary
              pedido={pedido}
              total={total}
            >
              <Button
                onClick={handleFinalizarPedido}
                disabled={isSubmitting || !tipoPagamento}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  'Finalizar Pedido'
                )}
              </Button>
              <Button
                 onClick={handleLimparCarrinho}
                 variant="secondary"
                 className="w-full"
                 disabled={isSubmitting}
               >
                 Cancelar e Voltar
               </Button>
            </OrderSummary>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      {renderContent()}
    </main>
  );
};

export default Payment;
