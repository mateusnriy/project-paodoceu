// frontend/src/hooks/useOrders.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { orderService } from '../services/orderService';
import { Pedido } from '../types';
import { logError } from '../utils/logger';
import { socket } from '../lib/socket';
import { getErrorMessage } from '../utils/errors';

export const useOrders = () => {
  const [pedidosProntos, setPedidosProntos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPedidosProntos = useCallback(async () => {
    if (pedidosProntos.length === 0) setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.listReady();
      setPedidosProntos(data);
    } catch (err) {
      logError('Erro ao buscar pedidos prontos', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [pedidosProntos.length]);

  useEffect(() => {
    fetchPedidosProntos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePedidoNovoPronto = (novoPedidoPronto: Pedido) => {
      console.log('Socket: pedido:pronto recebido', novoPedidoPronto);
      setPedidosProntos((prevPedidos) => {
        if (prevPedidos.some(p => p.id === novoPedidoPronto.id)) {
          return prevPedidos;
        }
        const newList = [...prevPedidos, novoPedidoPronto];
        newList.sort((a, b) => new Date(a.atualizado_em).getTime() - new Date(b.atualizado_em).getTime());
        return newList;
      });
    };

    const handlePedidoEntregue = (data: { id: string }) => {
      console.log('Socket: pedido:entregue recebido', data);
      setPedidosProntos((prevPedidos) =>
        prevPedidos.filter((p) => p.id !== data.id),
      );
      setUpdatingId(currentId => currentId === data.id ? null : currentId);
    };

    socket.on('pedido:pronto', handlePedidoNovoPronto);
    socket.on('pedido:entregue', handlePedidoEntregue);

    return () => {
      socket.off('pedido:pronto', handlePedidoNovoPronto);
      socket.off('pedido:entregue', handlePedidoEntregue);
    };
  }, []);

  const marcarComoEntregue = useCallback(async (id: string) => {
    setUpdatingId(id);
    setError(null);

    // CORREÇÃO (Erro 8): Removida variável 'estadoAnterior' não utilizada
    // const estadoAnterior = [...pedidosProntos];

    try {
      await orderService.markAsDelivered(id);
      toast.success('Pedido marcado como entregue!');
    } catch (err) {
      logError(`Erro ao marcar pedido ${id} como entregue`, err);
      setError(err);
      toast.error(`Falha ao atualizar pedido: ${getErrorMessage(err)}`);
      fetchPedidosProntos();
      setUpdatingId(null);
    }
  }, [fetchPedidosProntos]); // Removido 'pedidosProntos' da dependência

  return {
    pedidos: pedidosProntos,
    isLoading,
    error: error ? getErrorMessage(error) : null,
    handleConcluirPedido: marcarComoEntregue,
    updatingId,
    retry: fetchPedidosProntos,
  };
};
