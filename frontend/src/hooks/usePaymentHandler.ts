// frontend/src/hooks/usePaymentHandler.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
// import { Pedido, PedidoItem, TipoPagamento, StatusPedido } from '../types'; // PedidoItem e StatusPedido Removidos
import { Pedido, TipoPagamento } from '../types';
import { getErrorMessage } from '../utils/errors';
import { logError } from '../utils/logger';

interface CriarPedidoPayload {
  cliente_nome?: string;
  itens: { produto_id: string; quantidade: number }[];
}

interface ProcessarPagamentoPayload {
  metodo: TipoPagamento;
  valor_pago: number;
}

export const usePaymentHandler = () => {
  const navigate = useNavigate();

  const [pedidoLocal, setPedidoLocal] = useState<Pedido | null>(null);
  const [totalLocal, setTotalLocal] = useState<number>(0);
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      const pedidoString = localStorage.getItem('pedidoLocal');
      if (pedidoString) {
        const pedidoData = JSON.parse(pedidoString);
        if (pedidoData && Array.isArray(pedidoData.itens) && pedidoData.itens.length > 0) {
          setPedidoLocal(pedidoData as Pedido);
          setTotalLocal(pedidoData.valor_total || 0); // CORRIGIDO: Usar valor_total
        } else {
          throw new Error('Dados do carrinho inválidos no localStorage.');
        }
      } else {
         setPedidoLocal(null);
         setTotalLocal(0);
      }
    } catch (err) {
      logError('Erro ao carregar pedido do localStorage:', err);
      setError(err);
      localStorage.removeItem('pedidoLocal');
      setPedidoLocal(null);
      setTotalLocal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFinalizarPedido = useCallback(async () => {
    if (!pedidoLocal || pedidoLocal.itens.length === 0 || !tipoPagamento) {
      setError('Carrinho vazio ou método de pagamento não selecionado.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const criarPedidoPayload: CriarPedidoPayload = {
        cliente_nome: pedidoLocal.cliente_nome, // Adicionado
        itens: pedidoLocal.itens.map(item => ({
          produto_id: item.produto.id,
          quantidade: item.quantidade,
        })),
      };

      const pedidoCriadoResponse = await api.post<Pedido>('/pedidos', criarPedidoPayload);
      const pedidoCriado = pedidoCriadoResponse.data;

      const processarPagamentoPayload: ProcessarPagamentoPayload = {
        metodo: tipoPagamento,
        valor_pago: totalLocal,
      };

      await api.post(`/pedidos/${pedidoCriado.id}/pagar`, processarPagamentoPayload);

      localStorage.removeItem('pedidoLocal');
      navigate('/fila');

    } catch (err) {
      // const message = getErrorMessage(err); // REMOVIDO - não utilizado
      logError('Erro ao finalizar pedido e pagamento:', err, { tipoPagamento });
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [pedidoLocal, totalLocal, tipoPagamento, navigate]);

  const handleLimparCarrinhoLocal = useCallback(() => {
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
    error,
    tipoPagamento,
    setTipoPagamento,
    handleFinalizarPedido,
    handleLimparCarrinho: handleLimparCarrinhoLocal,
  };
};
