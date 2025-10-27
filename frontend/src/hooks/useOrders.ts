// src/hooks/useOrders.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
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
      const response = await api.get<Pedido[]>('/pedidos/prontos'); // Assume que retorna apenas os PRONTOS
      const sortedPedidos = response.data.sort((a, b) =>
          new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime()
      );

      // Processa a resposta para manter o estado 'completed' se já existir
      setPedidos(prevPedidos => {
         const updatedPedidosMap = new Map<string, OrderWithUI>();
         prevPedidos.forEach(p => updatedPedidosMap.set(p.id, p));

         const newPedidos = sortedPedidos
             .filter(p => p.status === StatusPedido.PRONTO) // Garante que só entram prontos
             .map(p => {
                 const existing = updatedPedidosMap.get(p.id);
                 return { ...p, completed: existing?.completed ?? false };
             });

         // Remove pedidos que não estão mais na lista de prontos (já foram concluídos)
         const finalPedidos = newPedidos.filter(p => !p.completed || updatedPedidosMap.has(p.id));

         // Verifica se a lista realmente mudou para evitar re-render desnecessário
         if (JSON.stringify(finalPedidos) !== JSON.stringify(prevPedidos.filter(p => finalPedidos.some(fp => fp.id === p.id)))) {
            return finalPedidos;
         }
         return prevPedidos;
      });

    } catch (err) {
      logError('Erro detalhado ao buscar pedidos prontos:', err);
      setError(err);
      // Mantém a lista antiga em caso de falha de rede temporária
    } finally {
      setIsLoading(false);
    }
  }, [pedidos.length]); // Dependência ajustada para loading inicial

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
          ? { ...p, completed: true, status: StatusPedido.ENTREGUE } // Marca como completed e muda status visualmente
          : p
      )
    );

    try {
      await api.patch(`/pedidos/${pedidoId}/entregar`);

      // Sucesso: Agendar remoção da UI após um tempo
      const timerId = setTimeout(() => {
        setPedidos((prevPedidos) => prevPedidos.filter((p) => p.id !== pedidoId));
        setIsUpdating(null);
      }, 1500); // Remove após 1.5 segundos

      return () => clearTimeout(timerId); // Função de limpeza

    } catch (err) {
      logError('Erro ao marcar pedido como entregue:', err, { pedidoId });
      setError(err);

      // --- Reverte UI Otimista ---
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          p.id === pedidoId
            ? { ...p, completed: false, status: StatusPedido.PRONTO } // Volta ao estado anterior
            : p
        )
      );
      setIsUpdating(null);
    }
  }, [isUpdating]); // Dependência isUpdating


  // Filtra os pedidos que não estão marcados como 'completed' para exibição
  const pedidosVisiveis = useMemo(() => pedidos.filter(p => !p.completed), [pedidos]);

  return {
    pedidos: pedidosVisiveis,
    isLoading,
    error,
    handleConcluirPedido,
    isUpdating: !!isUpdating, // Retorna boolean
    updatingId: isUpdating, // Retorna o ID que está sendo atualizado (ou null)
  };
};
