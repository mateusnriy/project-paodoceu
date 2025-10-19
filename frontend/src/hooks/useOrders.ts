import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Pedido, StatusPedido } from '../types';
import { logError } from '../utils/logger';

interface OrderWithUI extends Pedido {
  completed?: boolean;
}

/**
 * @hook useOrders
 * @description Hook para buscar pedidos na fila (status PRONTO)
 * e gerenciar a ação de marcar um pedido como CONCLUÍDO (entregue).
 * CORREÇÃO: Busca apenas pedidos PRONTOS (GET /pedidos/prontos)
 * e usa endpoint PATCH /pedidos/:id/entregar.
 */
export const useOrders = () => {
  const [pedidos, setPedidos] = useState<OrderWithUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  /**
   * @function loadOrders
   * @description Busca os pedidos com status 'PRONTO'.
   */
  const loadOrders = useCallback(async () => {
    // Não seta loading=true aqui para permitir refresh silencioso
    setError(null);
    try {
      // <<< CORREÇÃO: Endpoint ajustado para o definido no backend (pedidosRoutes.ts) >>>
      const response = await api.get<Pedido[]>('/pedidos/prontos');

      // Ordena por data de atualização (mais recente pronto primeiro)
      const sortedPedidos = response.data.sort((a, b) =>
          new Date(b.dataAtualizacao).getTime() - new Date(a.dataAtualizacao).getTime()
      );

      // Adiciona a flag 'completed: false' e mantém apenas os PRONTOS
      setPedidos(
        sortedPedidos
          .filter(p => p.status === StatusPedido.PRONTO) // Filtro extra por segurança
          .map((p) => ({ ...p, completed: false }))
      );

    } catch (err) {
      logError('Erro detalhado ao buscar pedidos prontos:', err);
      setError(err);
      setPedidos([]); // Limpa a lista em caso de erro
    } finally {
      if (isLoading) {
        setIsLoading(false); // Desativa o loading inicial
      }
    }
  }, [isLoading]); // Depende de isLoading para controlar o estado inicial

  useEffect(() => {
    loadOrders();
    // Adiciona um intervalo para atualizar a lista periodicamente
    const intervalId = setInterval(loadOrders, 10000); // Atualiza a cada 10 segundos
    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar
  }, [loadOrders]); // Executa quando `loadOrders` é definido

  /**
   * @function handleConcluirPedido
   * @description Marca um pedido como 'ENTREGUE' na API (PATCH /pedidos/:id/entregar).
   */
  const handleConcluirPedido = useCallback(async (pedidoId: string) => {
    if (isUpdating) return; // Previne cliques múltiplos

    setIsUpdating(pedidoId);
    setError(null);

    // --- UI Otimista ---
    setPedidos((prevPedidos) =>
      prevPedidos.map((p) =>
        p.id === pedidoId
          // <<< CORREÇÃO: Backend muda para 'ENTREGUE', não 'CONCLUIDO' >>>
          ? { ...p, completed: true, status: StatusPedido.CONCLUIDO } // Status local 'CONCLUIDO' para UI
          : p
      )
    );

    try {
      // <<< CORREÇÃO: Endpoint ajustado para o definido no backend (pedidosRoutes.ts) >>>
      await api.patch(`/pedidos/${pedidoId}/entregar`);

      // Sucesso: Remove após delay
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
            ? { ...p, completed: false, status: StatusPedido.PRONTO } // Reverte status
            : p
        )
      );
      setIsUpdating(null);
      throw err; // Relança o erro
    }
  }, [isUpdating]); // Dependência isUpdating previne chamadas concorrentes

  // Separa pedidos PRONTOS (os que a API retorna)
  // A lista de aguardando ficará vazia pois não buscamos esse status.
  const pedidosProntos = useMemo(() => pedidos.filter(p => p.status === StatusPedido.PRONTO && !p.completed), [pedidos]);
  const pedidosAguardando: Pedido[] = []; // Vazia

  return {
    // Retorna listas separadas para a UI
    pedidosProntos,
    pedidosAguardando, // Vazia
    isLoading,
    error,
    handleConcluirPedido,
    isUpdating: isUpdating, // Passa o ID do pedido em atualização
  };
};
