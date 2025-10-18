import React from 'react';
import { CreditCard, Banknote, QrCode, Loader2 } from 'lucide-react';
import { OrderSummary } from '../components/common/OrderSummary';
import { Button } from '../components/common/Button';
import { usePayment } from '../hooks/usePayment';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getErrorMessage } from '../utils/errors';
import { TipoPagamento } from '../types';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

/**
 * REFATORAÇÃO (Commit 2.3):
 * - Corrigida a seleção de Método de Pagamento (item 4.1.3).
 * - Aplicados novos tokens de design (tipografia, cores).
 * - Botão "Voltar para Vendas" agora usa useNavigate.
 */

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
  } = usePayment();
  
  const navigate = useNavigate(); // Hook para navegação

  const pagamentoOpcoes = [
    { tipo: TipoPagamento.CREDITO, label: 'Cartão de Crédito', icon: CreditCard },
    { tipo: TipoPagamento.DEBITO, label: 'Cartão de Débito', icon: CreditCard },
    { tipo: TipoPagamento.PIX, label: 'PIX', icon: QrCode },
    { tipo: TipoPagamento.DINHEIRO, label: 'Dinheiro', icon: Banknote },
  ];

  // Renderização principal
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
          title="Erro ao carregar pedido"
          message={getErrorMessage(error)}
        />
      );
    }

    if (!pedido || pedido.itens.length === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold mb-4 text-text-primary">
            Seu carrinho está vazio
          </h2>
          <p className="text-text-secondary">
            Adicione produtos na tela de Vendas para continuar.
          </p>
          <Button
            onClick={() => navigate('/vendas')} // Navega de volta para /vendas
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
        {/* Lado Esquerdo: Opções de Pagamento */}
        <div className="lg:w-2/3">
          {/* Título (H1 - 24px Bold) */}
          <h1 className="text-2xl font-bold mb-6 text-text-primary">Pagamento</h1>

          <div className="bg-primary-white p-6 rounded-xl shadow-soft border border-gray-200"> {/* rounded-xl (12px) */}
            <h2 className="text-lg font-semibold mb-4 text-text-primary">
              Selecione o método de pagamento
            </h2>
            
            {/* Grid de opções de pagamento (CORRIGIDO) */}
            <div className="grid grid-cols-2 gap-4">
              {pagamentoOpcoes.map((opcao) => {
                const isSelected = tipoPagamento === opcao.tipo;
                
                // Classes base (Guia de Estilo item 4.1.3)
                const baseClasses =
                  'flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary-blue';
                
                // Classes para SELECIONADO (primary-blue, background-light-blue)
                const selectedClasses =
                  'bg-background-light-blue border-primary-blue ring-2 ring-primary-blue';
                  
                // Classes para NÃO SELECIONADO
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

        {/* Lado Direito: Resumo do Pedido (fixo) */}
        {/* 'top-[104px]' = 80px (Header) + 24px (padding p-8 da main) */}
        <div className="lg:w-1/3 lg:sticky top-[112px] h-fit"> {/* Ajustado para p-8 (32px) -> 80+32=112 */}
          <OrderSummary
            pedido={pedido}
            total={total}
            onLimparCarrinho={handleLimparCarrinho}
          >
            {/* Botão de Finalizar Pedido */}
            <Button
              onClick={handleFinalizarPedido}
              disabled={isSubmitting || !tipoPagamento}
              className="w-full mt-4"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Finalizar Pedido'
              )}
            </Button>
          </OrderSummary>
        </div>
      </div>
    );
  };

  return (
    // Container da página (padding 8px grid)
    <main className="container mx-auto p-4 md:p-8"> {/* p-8 = 32px */}
      {renderContent()}
    </main>
  );
};

export default Payment;
