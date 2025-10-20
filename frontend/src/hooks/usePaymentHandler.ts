// frontend/src/hooks/usePaymentHandler.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Pedido, PedidoItem, TipoPagamento, StatusPedido } from '../types'; // Barrel file
import { getErrorMessage } from '../utils/errors';
import { logError } from '../utils/logger';

// Interface para o payload de criação de pedido
interface CriarPedidoPayload {
  cliente_nome?: string;
  itens: { produto_id: string; quantidade: number }[];
}

// Interface para o payload de pagamento
interface ProcessarPagamentoPayload {
  metodo: TipoPagamento;
  valor_pago: number;
}

export const usePaymentHandler = () => {
  const navigate = useNavigate();

  const [pedidoLocal, setPedidoLocal] = useState<Pedido | null>(null);
  const [totalLocal, setTotalLocal] = useState<number>(0);
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Para carregar do localStorage
  const [isSubmitting, setIsSubmitting] = useState(false); // Para envio à API
  const [error, setError] = useState<unknown>(null);

  // Carrega o pedido do localStorage ao iniciar
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      const pedidoString = localStorage.getItem('pedidoLocal');
      if (pedidoString) {
        const pedidoData = JSON.parse(pedidoString);
        // Validar minimamente se tem itens
        if (pedidoData && Array.isArray(pedidoData.itens) && pedidoData.itens.length > 0) {
          setPedidoLocal(pedidoData as Pedido);
          setTotalLocal(pedidoData.total || 0); // Pega o total salvo
        } else {
          throw new Error('Dados do carrinho inválidos no localStorage.');
        }
      } else {
         // Define como null se não houver carrinho no localStorage
         setPedidoLocal(null);
         setTotalLocal(0);
         // Não é um erro, apenas carrinho vazio
      }
    } catch (err) {
      logError('Erro ao carregar pedido do localStorage:', err);
      setError(err);
      // Limpa localStorage em caso de erro de parse
      localStorage.removeItem('pedidoLocal');
      setPedidoLocal(null);
      setTotalLocal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para finalizar o pedido (Criação + Pagamento)
  const handleFinalizarPedido = useCallback(async () => {
    if (!pedidoLocal || pedidoLocal.itens.length === 0 || !tipoPagamento) {
      setError('Carrinho vazio ou método de pagamento não selecionado.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Preparar payload para criar pedido
      const criarPedidoPayload: CriarPedidoPayload = {
        // cliente_nome: pedidoLocal.cliente_nome, // Adicionar se necessário
        itens: pedidoLocal.itens.map(item => ({
          produto_id: item.produto.id,
          quantidade: item.quantidade,
        })),
      };

      // 2. Criar o pedido via API
      const pedidoCriadoResponse = await api.post<Pedido>('/pedidos', criarPedidoPayload);
      const pedidoCriado = pedidoCriadoResponse.data;

      // 3. Preparar payload para pagar o pedido
      const processarPagamentoPayload: ProcessarPagamentoPayload = {
        metodo: tipoPagamento,
        // Assume que o valor pago é o total (exceto dinheiro, que pode ter troco - backend lida com isso)
        valor_pago: totalLocal,
      };

      // 4. Processar o pagamento via API
      await api.post(`/pedidos/${pedidoCriado.id}/pagar`, processarPagamentoPayload);

      // 5. Limpar localStorage e navegar para a fila em caso de sucesso
      localStorage.removeItem('pedidoLocal');
      navigate('/fila'); // Redireciona para a tela da fila

    } catch (err) {
      const message = getErrorMessage(err);
      logError('Erro ao finalizar pedido e pagamento:', err, { tipoPagamento });
      setError(err); // Mantém o erro para exibição na UI
      // Não limpa o localStorage em caso de erro para permitir nova tentativa
    } finally {
      setIsSubmitting(false);
    }
  }, [pedidoLocal, totalLocal, tipoPagamento, navigate]);

  // Função para limpar o carrinho (apenas localmente)
  // OBS: No fluxo original, o limpar era feito após o sucesso.
  // Esta função pode ser usada se um botão "Cancelar Pedido" for adicionado.
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
    pedido: pedidoLocal, // Renomeado para 'pedido' para consistência na página
    total: totalLocal, // Renomeado para 'total'
    isLoading,
    isSubmitting,
    error,
    tipoPagamento,
    setTipoPagamento,
    handleFinalizarPedido,
    handleLimparCarrinho: handleLimparCarrinhoLocal, // Exporta a função de limpar local
  };
};
