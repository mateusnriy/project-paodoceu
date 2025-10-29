// frontend/src/hooks/useOrders.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast'; // Correção B.1
import { orderService } from '../services/orderService'; // Correção B.2
import { Pedido } from '../types'; // Tipo já corrigido (A.1)
import { logError } from '../utils/logger';
import { socket } from '../lib/socket';
import { getErrorMessage } from '../utils/errors';

export const useOrders = () => {
  const [pedidosProntos, setPedidosProntos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null); // Armazena erro original
  const [updatingId, setUpdatingId] = useState<string | null>(null); // ID do pedido sendo atualizado

  const fetchPedidosProntos = useCallback(async () => {
    // Só mostra loading total na primeira busca
    if (pedidosProntos.length === 0) setIsLoading(true);
    setError(null);
    try {
      // Correção B.2: Usar orderService
      const data = await orderService.listReady();
      setPedidosProntos(data);
    } catch (err) {
      logError('Erro ao buscar pedidos prontos', err);
      setError(err); // Armazena erro original
    } finally {
      setIsLoading(false);
    }
  }, [pedidosProntos.length]); // Dependência para controlar loading inicial

  // Efeito para busca inicial
  useEffect(() => {
    fetchPedidosProntos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez

  // Efeito para ouvir eventos Socket.IO
  useEffect(() => {
    const handlePedidoNovoPronto = (novoPedidoPronto: Pedido) => {
      console.log('Socket: pedido:pronto recebido', novoPedidoPronto);
      setPedidosProntos((prevPedidos) => {
        // Evita duplicados caso a busca inicial e o socket cheguem juntos
        if (prevPedidos.some(p => p.id === novoPedidoPronto.id)) {
          return prevPedidos;
        }
        // Adiciona ordenado por data/hora que ficou pronto (atualizado_em)
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
      // Se o pedido entregue era o que estava sendo marcado, limpa o estado updatingId
      setUpdatingId(currentId => currentId === data.id ? null : currentId);
    };

    socket.on('pedido:pronto', handlePedidoNovoPronto); // Ouve 'pedido:pronto'
    socket.on('pedido:entregue', handlePedidoEntregue);

    return () => {
      socket.off('pedido:pronto', handlePedidoNovoPronto);
      socket.off('pedido:entregue', handlePedidoEntregue);
    };
  }, []); // Sem dependências para registrar/limpar listeners apenas uma vez

  // Ação de marcar como entregue (RF10)
  const marcarComoEntregue = useCallback(async (id: string) => {
    setUpdatingId(id); // Indica qual pedido está sendo atualizado
    setError(null);

    // Guardar estado anterior para rollback em caso de erro
    const estadoAnterior = [...pedidosProntos];

    // UI Otimista (opcional, mas melhora UX) - Remove localmente
    // setPedidosProntos((prevPedidos) => prevPedidos.filter((p) => p.id !== id));

    try {
      // Correção B.2: Usar orderService
      await orderService.markAsDelivered(id);
      toast.success('Pedido marcado como entregue!'); // Correção B.1
      // O evento 'pedido:entregue' do socket fará a remoção da lista
    } catch (err) {
      logError(`Erro ao marcar pedido ${id} como entregue`, err);
      setError(err); // Armazena erro original
      toast.error(`Falha ao atualizar pedido: ${getErrorMessage(err)}`); // Correção B.1
      // Rollback da UI Otimista (se usada) - ou apenas refaz a busca
      // setPedidosProntos(estadoAnterior);
      fetchPedidosProntos(); // Garante consistência
      setUpdatingId(null); // Limpa o estado de atualização em erro
    }
    // Não precisa 'finally { setUpdatingId(null); }' aqui,
    // pois o evento socket 'pedido:entregue' deve limpar o ID quando sucesso.
  }, [fetchPedidosProntos, pedidosProntos]); // Adiciona dependência pedidosProntos

  return {
    pedidos: pedidosProntos, // Renomeado para 'pedidos' para uso externo
    isLoading,
    error: error ? getErrorMessage(error) : null, // Retorna string de erro formatada
    handleConcluirPedido: marcarComoEntregue, // Renomeado para clareza na página
    updatingId,
    retry: fetchPedidosProntos,
  };
};
