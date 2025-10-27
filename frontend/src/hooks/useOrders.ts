// src/hooks/useOrders.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
// import { getErrorMessage } from '../utils/errors'; // Já removido anteriormente
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
    if (pedidos.length === 0) { // Só loading na primeira vez
        setIsLoading(true);
    }

    try {
      const response = await api.get<Pedido[]>('/pedidos/prontos');
      const sortedPedidos = response.data.sort((a, b) =>
          new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime()
      );
      setPedidos(
        sortedPedidos
          .filter(p => p.status === StatusPedido.PRONTO)
          .map((p) => ({ ...p, completed: false }))
      );
    } catch (err) {
      logError('Erro detalhado ao buscar pedidos prontos:', err);
      setError(err);
      // Não limpa pedidos em caso de erro de rede, mantém a última lista válida
    } finally {
      setIsLoading(false);
    }
  }, [pedidos.length]); // Dependência ajustada

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

      return () => clearTimeout(timerId);

    } catch (err) {
      logError('Erro ao marcar pedido como entregue:', err, { pedidoId });
      setError(err);

      // --- Reverte UI Otimista ---
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          p.id === pedidoId
            ? { ...p, completed: false, status: StatusPedido.PRONTO }
            : p
        )
      );
      setIsUpdating(null);
    }
  }, [isUpdating]);


  const pedidosVisiveis = useMemo(() => pedidos.filter(p => !p.completed), [pedidos]);

  return {
    pedidos: pedidosVisiveis,
    isLoading,
    error,
    handleConcluirPedido,
    isUpdating: isUpdating, // Continua retornando a string do ID ou null
  };
};
