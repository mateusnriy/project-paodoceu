// src/hooks/useOrders.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
// import { getErrorMessage } from '../utils/errors'; // REMOVIDO
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
    if (isLoading) { // Apenas seta loading como true na primeira chamada
        setIsLoading(true);
    }
    try {
      const response = await api.get<Pedido[]>('/pedidos/prontos');
      const sortedPedidos = response.data.sort((a, b) =>
          new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime() // Corrigido para atualizado_em
      );
      // Atualiza o estado apenas se os dados forem diferentes para evitar re-renderizações desnecessárias
      setPedidos(prevPedidos => {
          const newPedidosMap = new Map(sortedPedidos.map(p => [p.id, { ...p, completed: false }]));
          const currentIds = new Set(prevPedidos.map(p => p.id));
          const newIds = new Set(sortedPedidos.map(p => p.id));

          // Verifica se houve adição, remoção ou mudança de ordem
          if (prevPedidos.length !== sortedPedidos.length || !sortedPedidos.every((p, i) => prevPedidos[i]?.id === p.id)) {
              return sortedPedidos.map(p => ({ ...p, completed: false }));
          }
          // Verifica se algum pedido existente mudou (embora nesse caso o filter já deve tratar)
          for (const p of prevPedidos) {
              const newP = newPedidosMap.get(p.id);
              if (!newP || JSON.stringify(p) !== JSON.stringify(newP)) {
                  return sortedPedidos.map(p => ({ ...p, completed: false }));
              }
          }
          return prevPedidos; // Sem mudanças, retorna o estado anterior
      });
    } catch (err) {
      logError('Erro detalhado ao buscar pedidos prontos:', err);
      setError(err);
      // Não limpar pedidos em caso de erro de rede, mantém a última lista válida
      // setPedidos([]);
    } finally {
      setIsLoading(false); // Sempre definir loading como false no final
    }
  // Removido isLoading da dependência para evitar loop infinito
  }, [/* isLoading removido */]);

  useEffect(() => {
    loadOrders(); // Carga inicial
    const intervalId = setInterval(loadOrders, 10000); // Polling
    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar
  }, [loadOrders]); // Depende apenas de loadOrders

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

      // Sucesso: Agendar remoção da UI após um tempo
      const timerId = setTimeout(() => {
        setPedidos((prevPedidos) => prevPedidos.filter((p) => p.id !== pedidoId));
        setIsUpdating(null);
      }, 1500); // Remove após 1.5 segundos

      // Retorna a função de limpeza para o caso de o componente desmontar
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
  }, [isUpdating]); // Dependência isUpdating para evitar cliques múltiplos


  const pedidosVisiveis = useMemo(() => pedidos.filter(p => !p.completed), [pedidos]);

  return {
    pedidos: pedidosVisiveis,
    isLoading,
    error,
    handleConcluirPedido,
    isUpdating, // Retornar isUpdating como boolean ou string
  };
};
