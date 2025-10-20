import React from 'react';
import { CreditCard, Banknote, QrCode, Loader2 } from 'lucide-react';
import { OrderSummary } from '../components/common/OrderSummary';
import { Button } from '../components/common/Button';
// <<< CORREÇÃO: Importar o novo hook >>>
import { usePaymentHandler } from '../hooks/usePaymentHandler';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getErrorMessage } from '../utils/errors';
import { TipoPagamento } from '../types';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

const Payment: React.FC = () => {
  // <<< CORREÇÃO: Usar o novo hook >>>
  const {
    pedido, // Nome ajustado
    total,  // Nome ajustado
    isLoading, // Estado para carregar do localStorage
    isSubmitting, // Estado para envio à API
    error,
    tipoPagamento,
    setTipoPagamento,
    handleFinalizarPedido,
    // handleLimparCarrinho, // <- Removido ou renomeado se necessário (use handleLimparCarrinhoLocal se precisar)
  } = usePaymentHandler();

  const navigate = useNavigate(); // Hook para navegação

  const pagamentoOpcoes = [
    // <<< CORREÇÃO: Mapear para os valores do Enum TipoPagamento >>>
    { tipo: TipoPagamento.CREDITO, label: 'Cartão de Crédito', icon: CreditCard },
    { tipo: TipoPagamento.DEBITO, label: 'Cartão de Débito', icon: CreditCard },
    { tipo: TipoPagamento.PIX, label: 'PIX', icon: QrCode },
    { tipo: TipoPagamento.DINHEIRO, label: 'Dinheiro', icon: Banknote },
  ];

  // Renderização principal
  const renderContent = () => {
    // Mostra loading enquanto lê do localStorage
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="animate-spin text-gray-500" size={40} />
        </div>
      );
    }

    // Exibe erro geral (localStorage ou API)
    if (error && !isSubmitting) { // Só mostra erro se não estiver submetendo
      return (
        <ErrorMessage
          title="Erro no Pagamento"
          message={getErrorMessage(error)}
        />
      );
    }

    // Se não carregou pedido ou está vazio (ex: localStorage limpo)
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
            onClick={() => navigate('/vendas')} // Navega de volta para /vendas
            variant="link"
            className="mt-4"
          >
            Voltar para Vendas
          </Button>
        </div>
      );
    }

    // Layout principal da página de pagamento
    return (
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Lado Esquerdo: Opções de Pagamento */}
        <div className="lg:w-2/3">
          <h1 className="text-2xl font-bold mb-6 text-text-primary">Pagamento</h1>

          <div className="bg-primary-white p-6 rounded-xl shadow-soft border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-text-primary">
              Selecione o método de pagamento
            </h2>

            {/* Exibe erro da API durante a submissão, se houver */}
            {error && isSubmitting && (
              <div className="mb-4">
                 <ErrorMessage
                    title="Erro ao Finalizar Pedido"
                    message={getErrorMessage(error)}
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
                    disabled={isSubmitting} // Desabilita durante o envio
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

        {/* Lado Direito: Resumo do Pedido */}
        <div className="lg:w-1/3 lg:sticky top-[112px] h-fit">
          <OrderSummary
            pedido={pedido}
            total={total}
            // <<< CORREÇÃO: Remover onLimparCarrinho daqui >>>
            // onLimparCarrinho={handleLimparCarrinho} // Removido
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
             {/* Opcional: Botão para limpar localmente e voltar */}
             {/*
             <Button
               onClick={handleLimparCarrinho}
               variant="secondary"
               className="w-full mt-2"
               disabled={isSubmitting}
             >
               Cancelar e Limpar Carrinho
             </Button>
            */}
          </OrderSummary>
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
