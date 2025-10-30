// frontend/src/hooks/useCustomerDisplay.ts
import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/orderService';
import { Pedido } from '../types';
import { logError } from '../utils/logger';
import { socket } from '../lib/socket';
import { getErrorMessage } from '../utils/errors';

// CORREÇÃO (Erro 7): Removida interface 'DisplayData' local.
// O tipo será inferido pelo 'orderService.getDisplayData()'.

const MAX_PRONTOS_DISPLAY = 5; // Quantos pedidos prontos mostrar na lista

// Lógica de áudio (simples placeholder)
const playNotificationSound = () => {
  console.log('BEEP! Pedido pronto.');
  // new Audio('/sounds/notification.mp3').play(); // Implementação real
};

export const useCustomerDisplay = () => {
  // Estados separados para melhor gerenciamento
  const [pedidosEmPreparacao, setPedidosEmPreparacao] = useState<Pedido[]>([]);
  const [pedidosProntos, setPedidosProntos] = useState<Pedido[]>([]); // Lista dos últimos prontos
  const [pedidoChamado, setPedidoChamado] = useState<Pedido | null>(null); // O que está sendo exibido/piscando

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null); // Armazena erro original

  const fetchDisplayData = useCallback(async () => {
    // Só mostra loading total na primeira vez
    if (pedidosEmPreparacao.length === 0 && pedidosProntos.length === 0) setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getDisplayData();
      // Ordenar prontos pelo mais recente (atualizado_em DESC)
      const prontosOrdenados = (data.pedidosProntos || []).sort(
        (a, b) => new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime()
      );
      setPedidosEmPreparacao(data.pedidosEmPreparacao || []);
      setPedidosProntos(prontosOrdenados.slice(0, MAX_PRONTOS_DISPLAY)); // Pega os X mais recentes
      setPedidoChamado(prontosOrdenados.length > 0 ? prontosOrdenados[0] : null); // O mais recente é o chamado
    } catch (err) {
      logError('Erro ao buscar dados do display', err);
      setError(err); // Armazena erro original
    } finally {
      setIsLoading(false);
    }
  }, [pedidosEmPreparacao.length, pedidosProntos.length]); // Dependências para loading inicial

  // Efeito para busca inicial
  useEffect(() => {
    fetchDisplayData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez

  // Efeito para ouvir eventos Socket.IO
  useEffect(() => {
    const handlePedidoProntoDisplay = (novoPedidoPronto: Pedido) => {
      console.log('Socket: pedido:pronto:display recebido', novoPedidoPronto);
      setPedidoChamado(novoPedidoPronto); // Define como o pedido chamado (pisca)
      setPedidosProntos((prevProntos) => {
        // Adiciona no início e limita a lista
        const novaLista = [novoPedidoPronto, ...prevProntos.filter(p => p.id !== novoPedidoPronto.id)];
        return novaLista.slice(0, MAX_PRONTOS_DISPLAY);
      });
      // Remove da lista de preparação se existir
      setPedidosEmPreparacao((prevPreparacao) =>
        prevPreparacao.filter((p) => p.id !== novoPedidoPronto.id)
      );
      playNotificationSound();
    };

    const handlePedidoEntregueDisplay = (data: { id: string }) => {
        console.log('Socket: pedido:entregue:display recebido', data);
        // Remove da lista de prontos
        setPedidosProntos((prevProntos) => prevProntos.filter(p => p.id !== data.id));
        // Se o pedido entregue era o que estava sendo chamado, limpa o chamado
        setPedidoChamado((atual) => (atual?.id === data.id ? null : atual));
    };

    socket.on('pedido:pronto:display', handlePedidoProntoDisplay); // Ouvir evento específico do display
    socket.on('pedido:entregue:display', handlePedidoEntregueDisplay); // Ouvir evento de entrega

    return () => {
      socket.off('pedido:pronto:display', handlePedidoProntoDisplay);
      socket.off('pedido:entregue:display', handlePedidoEntregueDisplay);
    };
  }, []); // Sem dependências

  return {
    pedidoChamado, // Renomeado de pedidoAtual
    pedidosProntos, // Lista dos últimos X prontos
    pedidosAguardando: pedidosEmPreparacao, // Renomeado para clareza na página
    isLoading,
    error: error ? getErrorMessage(error) : null, // Retorna string de erro formatada
  };
};
