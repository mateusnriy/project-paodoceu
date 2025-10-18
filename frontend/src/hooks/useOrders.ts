import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Pedido, StatusPedido } from '../types';
import { logError } from '../utils/logger';
import { useMemo as reactUseMemo } from 'react';

interface OrderWithUI extends Pedido {
  completed?: boolean;
}

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
      // <<< CORREÇÃO: Endpoint ajustado para o definido no backend >>>
      const response = await api.get<Pedido[]>('/pedidos/prontos');

      // Ordena por data de atualização (mais recente pronto primeiro)
      const sortedPedidos = response.data.sort((a, b) =>
          new Date(b.dataAtualizacao).getTime() - new Date(a.dataAtualizacao).getTime()
      );

      // Adiciona a flag 'completed: false' e mantém apenas os PRONTOS
      // (Embora a API já deva retornar apenas prontos)
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
      // Só desativa o loading inicial uma vez
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [isLoading]); // Depende de isLoading para controlar o estado inicial

  useEffect(() => {
    loadOrders();
    // Adiciona um intervalo para atualizar a lista periodicamente
    const intervalId = setInterval(loadOrders, 10000); // Atualiza a cada 10 segundos
    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar
  }, [loadOrders]); // Re-executa se loadOrders mudar (apenas na montagem devido ao useCallback)

  /**
   * @function handleConcluirPedido
   * @description Marca um pedido como 'CONCLUIDO' na API (PATCH /pedidos/:id/concluir).
   */
  const handleConcluirPedido = useCallback(async (pedidoId: string) => {
    if (isUpdating) return;

    setIsUpdating(pedidoId);
    setError(null);

    // --- UI Otimista ---
    setPedidos((prevPedidos) =>
      prevPedidos.map((p) =>
        p.id === pedidoId
          ? { ...p, completed: true, status: StatusPedido.CONCLUIDO }
          : p
      )
    );

    try {
      // <<< CORREÇÃO: Endpoint ajustado para o definido no backend >>>
      // O backend usa PATCH /pedidos/:id/concluir
      await api.patch(`/pedidos/${pedidoId}/concluir`);

      // Sucesso: Remove após delay
      const timerId = setTimeout(() => {
        setPedidos((prevPedidos) => prevPedidos.filter((p) => p.id !== pedidoId));
        setIsUpdating(null);
      }, 1500);

      // Retorna função de cleanup para clearTimeout
      return () => clearTimeout(timerId);

    } catch (err) {
      logError('Erro ao marcar pedido como concluído:', err, { pedidoId });
      setError(err);

      // --- Reverte UI Otimista ---
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          p.id === pedidoId
            ? { ...p, completed: false, status: StatusPedido.PRONTO } // Reverte status
            : p
        )
      );
      setIsUpdating(null); // Libera para tentar de novo
      // Retorna undefined ou lança o erro se precisar sinalizar falha
      // throw err; // Opcional
    }
  }, [isUpdating]); // Dependência isUpdating previne chamadas concorrentes

  // Separa pedidos PRONTOS dos "concluídos" (apenas na UI, antes de sumir)
  // A lista de aguardando ficará vazia pois não buscamos esse status.
  const pedidosProntos = useMemo(() => pedidos.filter(p => !p.completed), [pedidos]);
  const pedidosAguardando: Pedido[] = []; // Vazia - API não fornece AGUARDANDO neste endpoint

  return {
    pedidosProntos,
    pedidosAguardando, // Vazia
    isLoading,
    error,
    handleConcluirPedido,
    isUpdating, // ID do pedido em atualização
  };
};
function useMemo<T>(factory: () => T, deps: React.DependencyList): T {
  return reactUseMemo(factory, deps);
}

