import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Pedido } from '../types';
import { logError } from '../utils/logger';
import { socket } from '../lib/socket'; // <--- IMPORTAR SOCKET

interface DisplayData {
  emPreparacao: Pedido[];
  prontos: Pedido[];
}

// Lógica de áudio (simples)
const playNotificationSound = () => {
  // Em produção, usar um arquivo de áudio hospedado
  // new Audio('/sounds/notification.mp3').play();
  console.log('BEEP! Pedido pronto.');
};

export const useCustomerDisplay = () => {
  const [pedidosEmPreparacao, setPedidosEmPreparacao] = useState<Pedido[]>([]);
  const [pedidosProntos, setPedidosProntos] = useState<Pedido[]>([]);
  const [pedidoAtual, setPedidoAtual] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca inicial dos dados do display
  // (Assume que existe uma rota GET /api/pedidos/display no backend)
  const fetchDisplayData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // *Nota: Esta rota não existe no código original.
      // Deve ser criada no backend (RF12)
      // `pedidosController.listarDisplay`
      const { data } = await api.get<DisplayData>('/api/pedidos/display');
      setPedidosEmPreparacao(data.emPreparacao || []);
      setPedidosProntos(data.prontos || []);
      setPedidoAtual(data.prontos.length > 0 ? data.prontos[0] : null);
    } catch (err) {
      logError('Erro ao buscar dados do display', err);
      setError('Falha ao carregar dados do display.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1. Remover Polling
  /*
  useEffect(() => {
    fetchDisplayData();
    const intervalId = setInterval(fetchDisplayData, 5000); // 5 segundos
    return () => clearInterval(intervalId);
  }, [fetchDisplayData]);
  */

  // 2. Efeito para busca inicial
  useEffect(() => {
    fetchDisplayData();
  }, [fetchDisplayData]);

  // 3. Efeito para ouvir eventos Socket.IO
  useEffect(() => {
    // Evento: Novo pedido pronto (vindo do pagamento)
    const handlePedidoDisplay = (novoPedidoPronto: Pedido) => {
      // Adiciona aos prontos
      setPedidosProntos((prev) => [novoPedidoPronto, ...prev.slice(0, 4)]); // Limita a 5
      // Define como pedido atual (pisca)
      setPedidoAtual(novoPedidoPronto);
      // Toca o som
      playNotificationSound();

      // Remove de "em preparação" (se aplicável)
      setPedidosEmPreparacao((prev) =>
        prev.filter((p) => p.id !== novoPedidoPronto.id),
      );
    };

    // Registrar listener
    socket.on('pedido:display', handlePedidoDisplay);

    // Limpar listener
    return () => {
      socket.off('pedido:display', handlePedidoDisplay);
    };
  }, []);

  return {
    pedidoAtual,
    pedidosProntos,
    pedidosEmPreparacao,
    isLoading,
    error,
  };
};
