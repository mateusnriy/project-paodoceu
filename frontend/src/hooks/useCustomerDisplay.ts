import { useState, useEffect } from 'react';
import { Pedido, StatusPedido } from '../types';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';

// Define a interface da resposta da API de display
interface DisplayData {
  pedidosProntos: Pedido[];
  pedidosAguardando: Pedido[];
}

/**
 * REFATORAÇÃO (Commit 3.3):
 * - Nenhuma mudança lógica neste hook.
 * - Conforme análise, a migração para WebSocket foi adiada.
 * - O hook permanece funcional com polling (setInterval).
 */
export const useCustomerDisplay = () => {
  const [pedidosProntos, setPedidosProntos] = useState<Pedido[]>([]);
  const [pedidosAguardando, setPedidosAguardando] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // Função para buscar os dados
  const fetchDisplayData = async () => {
    try {
      const response = await api.get<DisplayData>('/pedidos/display');
      
      // Ordena os prontos (mais recente primeiro)
      const prontos = response.data.pedidosProntos.sort(
        (a, b) =>
          new Date(b.dataAtualizacao).getTime() -
          new Date(a.dataAtualizacao).getTime()
      );
      
      // Ordena os aguardando (mais antigo primeiro, FIFO)
      const aguardando = response.data.pedidosAguardando.sort(
        (a, b) =>
          new Date(a.dataCriacao).getTime() -
          new Date(b.dataCriacao).getTime()
      );

      setPedidosProntos(prontos);
      setPedidosAguardando(aguardando.slice(0, 10)); // Limita a 10 na lista de espera
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados do display:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Busca inicial
    fetchDisplayData();

    // Inicia o polling
    const intervalId = setInterval(() => {
      fetchDisplayData();
    }, 5000); // Busca a cada 5 segundos

    // Limpa o intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, []);

  return { pedidosProntos, pedidosAguardando, isLoading, error };
};
