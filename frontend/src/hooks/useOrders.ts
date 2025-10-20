import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Pedido, StatusPedido } from '../types';
import { logError } from '../utils/logger';

interface OrderWithUI extends Pedido {
  completed?: boolean;
}

export const useOrders = () => {
  const [pedidos, setPedidos] = useState<OrderWithUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    try {
      const response = await api.get<Pedido[]>('/pedidos/prontos');
      const sortedPedidos = response.data.sort((a, b) =>
          new Date(b.dataAtualizacao).getTime() - new Date(a.dataAtualizacao).getTime()
      );
      setPedidos(
        sortedPedidos
          .filter(p => p.status === StatusPedido.PRONTO)
          .map((p) => ({ ...p, completed: false }))
      );
    } catch (err) {
      logError('Erro detalhado ao buscar pedidos prontos:', err);
      setError(err);
      setPedidos([]);
    } finally {
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [isLoading]);

  useEffect(() => {
    loadOrders();
    const intervalId = setInterval(loadOrders, 10000);
    return () => clearInterval(intervalId);
  }, [loadOrders]);

  const handleConcluirPedido = useCallback(async (pedidoId: string) => {
    if (isUpdating) return;

    setIsUpdating(pedidoId);
    setError(null);

    // --- UI Otimista ---
    setPedidos((prevPedidos) =>
      prevPedidos.map((p) =>
        p.id === pedidoId
          // <<< CORREÇÃO: Status local atualizado para ENTREGUE >>>
          ? { ...p, completed: true, status: StatusPedido.ENTREGUE }
          : p
      )
    );

    try {
      await api.patch(`/pedidos/${pedidoId}/entregar`);

      const timerId = setTimeout(() => {
        setPedidos((prevPedidos) => prevPedidos.filter((p) => p.id !== pedidoId));
        setIsUpdating(null);
      }, 1500);

      // Retorna a função de limpeza para o caso de o componente desmontar antes do timeout
      return () => clearTimeout(timerId);

    } catch (err) {
      logError('Erro ao marcar pedido como entregue:', err, { pedidoId });
      setError(err);

      // --- Reverte UI Otimista ---
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          p.id === pedidoId
            // <<< CORREÇÃO: Reverte para PRONTO >>>
            ? { ...p, completed: false, status: StatusPedido.PRONTO }
            : p
        )
      );
      setIsUpdating(null);
      // Considerar não relançar o erro aqui para não quebrar a UI,
      // o estado 'error' já informa o usuário.
      // throw err;
    }
  }, [isUpdating]);


  // A UI agora só precisa da lista completa, a filtragem pode ser feita lá
  const pedidosVisiveis = useMemo(() => pedidos.filter(p => !p.completed), [pedidos]);

  return {
    pedidos: pedidosVisiveis, // Passa a lista filtrada
    isLoading,
    error,
    handleConcluirPedido,
    isUpdating: isUpdating,
  };
};
