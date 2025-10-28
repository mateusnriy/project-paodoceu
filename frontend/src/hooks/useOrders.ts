import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Pedido } from '../types';
import { logError } from '../utils/logger';
import { socket } from '../lib/socket'; // <--- IMPORTAR SOCKET

export const useOrders = () => {
  const [pedidosProntos, setPedidosProntos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca inicial de pedidos prontos
  const fetchPedidosProntos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Pedido[]>('/api/pedidos/prontos');
      setPedidosProntos(data);
    } catch (err) {
      logError('Erro ao buscar pedidos prontos', err);
      setError('Falha ao carregar pedidos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1. Remover polling (setInterval)
  /*
  useEffect(() => {
    fetchPedidosProntos();
    const intervalId = setInterval(fetchPedidosProntos, 5000); // 5 segundos
    return () => clearInterval(intervalId);
  }, [fetchPedidosProntos]);
  */

  // 2. Efeito para busca inicial
  useEffect(() => {
    fetchPedidosProntos();
  }, [fetchPedidosProntos]);

  // 3. Efeito para ouvir eventos Socket.IO
  useEffect(() => {
    // Evento: Novo pedido pronto (vindo do pagamento)
    const handlePedidoNovo = (novoPedido: Pedido) => {
      // Adiciona o novo pedido no início da lista
      setPedidosProntos((prevPedidos) => [novoPedido, ...prevPedidos]);
    };

    // Evento: Pedido foi entregue
    const handlePedidoEntregue = (data: { id: string }) => {
      setPedidosProntos((prevPedidos) =>
        prevPedidos.filter((p) => p.id !== data.id),
      );
    };

    // Registrar listeners
    socket.on('pedido:novo', handlePedidoNovo);
    socket.on('pedido:entregue', handlePedidoEntregue);

    // Limpar listeners ao desmontar
    return () => {
      socket.off('pedido:novo', handlePedidoNovo);
      socket.off('pedido:entregue', handlePedidoEntregue);
    };
  }, []);


  // Ação de marcar como entregue
  const marcarComoEntregue = useCallback(async (id: string) => {
    // UI Otimista: Remove imediatamente
    setPedidosProntos((prevPedidos) =>
      prevPedidos.filter((p) => p.id !== id),
    );

    try {
      // O backend emitirá o evento 'pedido:entregue'
      // Não precisamos de UI otimista se o socket for robusto,
      // mas vamos manter para feedback instantâneo e
      // deixar o socket apenas confirmar o estado.
      await api.patch(`/api/pedidos/${id}/entregar`);
      // O evento socket 'pedido:entregue' vai garantir a remoção
      // caso a UI otimista falhe ou se outro atendente o fizer.
    } catch (err) {
      logError(`Erro ao marcar pedido ${id} como entregue`, err);
      setError('Falha ao atualizar pedido. Atualizando lista...');
      // Reverter UI otimista (rebuscando a lista)
      fetchPedidosProntos();
    }
  }, [fetchPedidosProntos]);

  return {
    pedidosProntos,
    isLoading,
    error,
    marcarComoEntregue,
    retry: fetchPedidosProntos,
  };
};
