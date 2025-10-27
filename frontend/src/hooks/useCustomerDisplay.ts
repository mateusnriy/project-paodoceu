// src/hooks/useCustomerDisplay.ts
import { useState, useEffect } from 'react';
import { Pedido, StatusPedido } from '../types'; // StatusPedido é usado, mantido
import { api } from '../services/api';
// import { getErrorMessage } from '../utils/errors'; // REMOVIDO

interface DisplayData {
  pedidosProntos: Pedido[];
  pedidosAguardando: Pedido[];
}

export const useCustomerDisplay = () => {
  const [pedidosProntos, setPedidosProntos] = useState<Pedido[]>([]);
  const [pedidosAguardando, setPedidosAguardando] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // Função para buscar os dados
  const fetchDisplayData = async () => {
    try {
      setError(null);
      const response = await api.get<DisplayData>('/pedidos/display');
      
      // Ordena os prontos (mais recente primeiro)
      const prontos = response.data.pedidosProntos.sort(
        (a, b) =>
          new Date(a.atualizado_em).getTime() - // Corrigido
          new Date(b.atualizado_em).getTime() // Corrigido
      );
      
      // Ordena os aguardando (mais antigo primeiro, FIFO)
      const aguardando = response.data.pedidosAguardando.sort(
        (a, b) =>
          new Date(a.criado_em).getTime() - // Corrigido
          new Date(b.criado_em).getTime() // Corrigido
      );

      setPedidosProntos(prontos);
      setPedidosAguardando(aguardando.slice(0, 10)); // Limita a 10 na lista de espera
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
  }, []); // Dependência vazia

  return { pedidosProntos, pedidosAguardando, isLoading, error };
};
