// frontend/src/hooks/usePaymentHandler.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { orderService } from '../services/orderService';
import { Pedido, TipoPagamento, PaymentPayload, CreateOrderPayload } from '../types';
import { logError } from '../utils/logger';
import { getErrorMessage } from '../utils/errors';

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
      // Tenta ler do 'pedidoLocal' (localStorage)
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
        // Fallback: Tenta ler do 'pao-do-ceu-cart-storage' (Zustand)
        const zustandString = localStorage.getItem('pao-do-ceu-cart-storage');
        if (zustandString) {
            const zustandData = JSON.parse(zustandString);
            const cartState = zustandData?.state;
            if (cartState?.items?.length > 0 && typeof cartState.total === 'number') {
                // Simula a estrutura de Pedido que o handler espera
                const pedidoFromZustand: Pedido = {
                    id: 'local-zustand',
                    itens: cartState.items,
                    valor_total: cartState.total,
                    cliente_nome: cartState.clienteNome,
                    status: 'LOCAL' as any,
                    criado_em: new Date().toISOString(),
                    atualizado_em: new Date().toISOString(),
                };
                setPedidoLocal(pedidoFromZustand);
                setTotalLocal(cartState.total);
                // Salva no 'pedidoLocal' para consistência se o usePOS salvar lá
                localStorage.setItem('pedidoLocal', JSON.stringify(pedidoFromZustand));
            } else {
                 throw new Error('Dados do carrinho (Zustand) inválidos.');
            }
        } else {
            setPedidoLocal(null);
            setTotalLocal(0);
        }
      }
    } catch (err) {
      logError('Erro ao carregar pedido do localStorage:', err);
      setError(err);
      localStorage.removeItem('pedidoLocal');
      localStorage.removeItem('pao-do-ceu-cart-storage'); // Limpa ambos
      setPedidoLocal(null);
      setTotalLocal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFinalizarPedido = useCallback(async () => {
    if (!pedidoLocal?.itens?.length || !tipoPagamento) {
      toast.error('Carrinho vazio ou método de pagamento não selecionado.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const criarPedidoPayload: CreateOrderPayload = {
        // CORREÇÃO (Erro 9): 'cliente_nome' pode ser 'null', mas o payload espera 'string | undefined'.
        // Usar '?? undefined' converte 'null' para 'undefined'.
        cliente_nome: pedidoLocal.cliente_nome ?? undefined,
        itens: pedidoLocal.itens.map(item => ({
          produto_id: item.produto.id,
          quantidade: item.quantidade,
        })),
      };

      const pedidoCriado = await orderService.create(criarPedidoPayload);

      const processarPagamentoPayload: PaymentPayload = {
        metodo: tipoPagamento,
        valor_pago: totalLocal,
      };

      await orderService.pay(pedidoCriado.id, processarPagamentoPayload);

      // Limpa AMBOS os storages no sucesso
      localStorage.removeItem('pedidoLocal');
      localStorage.removeItem('pao-do-ceu-cart-storage');
      
      toast.success('Pedido finalizado com sucesso!');
      navigate('/fila');

    } catch (err) {
      logError('Erro ao finalizar pedido e pagamento:', err, { tipoPagamento });
      setError(err);
      toast.error(`Erro ao finalizar: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [pedidoLocal, totalLocal, tipoPagamento, navigate]);

  const handleLimparCarrinhoLocal = useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar o carrinho e voltar para vendas?')) {
        localStorage.removeItem('pedidoLocal');
        localStorage.removeItem('pao-do-ceu-cart-storage'); // Limpa ambos
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
    error: error ? getErrorMessage(error) : null,
    tipoPagamento,
    setTipoPagamento,
    handleFinalizarPedido,
    handleLimparCarrinho: handleLimparCarrinhoLocal,
  };
};
