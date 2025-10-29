// frontend/src/hooks/usePaymentHandler.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'; // Correção B.1
import { orderService } from '../services/orderService'; // Correção B.2
import { Pedido, TipoPagamento, PaymentPayload, CreateOrderPayload } from '../types'; // Tipos já corrigidos (A.1)
import { logError } from '../utils/logger';
import { getErrorMessage } from '../utils/errors';

export const usePaymentHandler = () => {
  const navigate = useNavigate();

  const [pedidoLocal, setPedidoLocal] = useState<Pedido | null>(null);
  const [totalLocal, setTotalLocal] = useState<number>(0);
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null); // Armazena erro original

  // Carrega pedido do localStorage
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      const pedidoString = localStorage.getItem('pedidoLocal');
      if (pedidoString) {
        const pedidoData = JSON.parse(pedidoString) as Pedido;
        if (pedidoData?.itens?.length > 0 && typeof pedidoData.valor_total === 'number') {
          setPedidoLocal(pedidoData);
          setTotalLocal(pedidoData.valor_total);
        } else {
          throw new Error('Dados do carrinho inválidos.');
        }
      } else {
        setPedidoLocal(null); // Define como null se não houver carrinho
        setTotalLocal(0);
      }
    } catch (err) {
      logError('Erro ao carregar pedido do localStorage:', err);
      setError(err);
      localStorage.removeItem('pedidoLocal'); // Limpa em caso de erro
      setPedidoLocal(null);
      setTotalLocal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFinalizarPedido = useCallback(async () => {
    if (!pedidoLocal?.itens?.length || !tipoPagamento) {
      toast.error('Carrinho vazio ou método de pagamento não selecionado.'); // Correção B.1
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Payload para criar pedido
      const criarPedidoPayload: CreateOrderPayload = {
        cliente_nome: pedidoLocal.cliente_nome,
        // Correção A.1: Mapeia para produto_id
        itens: pedidoLocal.itens.map(item => ({
          produto_id: item.produto.id, // Usa o ID do produto dentro do item
          quantidade: item.quantidade,
        })),
      };

      // 2. Criar o pedido via orderService (Correção B.2)
      const pedidoCriado = await orderService.create(criarPedidoPayload);

      // 3. Payload para pagar o pedido
      const processarPagamentoPayload: PaymentPayload = {
        metodo: tipoPagamento,
        valor_pago: totalLocal, // Usa o total salvo localmente
      };

      // 4. Processar o pagamento via orderService (Correção B.2 e Rota)
      await orderService.pay(pedidoCriado.id, processarPagamentoPayload);

      // 5. Sucesso
      localStorage.removeItem('pedidoLocal');
      toast.success('Pedido finalizado com sucesso!'); // Correção B.1
      navigate('/fila'); // Redireciona para a fila

    } catch (err) {
      logError('Erro ao finalizar pedido e pagamento:', err, { tipoPagamento });
      setError(err); // Armazena erro original para exibição
      toast.error(`Erro ao finalizar: ${getErrorMessage(err)}`); // Correção B.1
    } finally {
      setIsSubmitting(false);
    }
  }, [pedidoLocal, totalLocal, tipoPagamento, navigate]);

  // Função para cancelar e voltar (limpa localStorage)
  const handleLimparCarrinhoLocal = useCallback(() => {
    // Correção B.1: Usar toast para confirmação (ou um modal dedicado)
    // Exemplo simples com window.confirm por enquanto, idealmente trocar por modal/toast
    if (window.confirm('Tem certeza que deseja limpar o carrinho e voltar para vendas?')) {
        localStorage.removeItem('pedidoLocal');
        setPedidoLocal(null);
        setTotalLocal(0);
        setError(null);
        setTipoPagamento(null);
        navigate('/vendas');
     }
  }, [navigate]);

  return {
    pedido: pedidoLocal,
    total: totalLocal,
    isLoading,
    isSubmitting,
    error: error ? getErrorMessage(error) : null, // Retorna string formatada
    tipoPagamento,
    setTipoPagamento,
    handleFinalizarPedido,
    handleLimparCarrinho: handleLimparCarrinhoLocal,
  };
};
