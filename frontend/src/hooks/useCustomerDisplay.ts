// src/hooks/useCustomerDisplay.ts
import { useState, useEffect } from 'react';
import { Pedido } from '../types'; // StatusPedido removido
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

  const fetchDisplayData = async () => {
    try {
      setError(null); // Limpa erro antes de tentar
      const response = await api.get<DisplayData>('/pedidos/display');

      const prontos = response.data.pedidosProntos.sort(
        (a, b) =>
          new Date(a.atualizado_em).getTime() - // Corrigido para atualizado_em
          new Date(b.atualizado_em).getTime()
      );

      const aguardando = response.data.pedidosAguardando.sort(
        (a, b) =>
          new Date(a.criado_em).getTime() - // Corrigido para criado_em
          new Date(b.criado_em).getTime()
      );

      setPedidosProntos(prontos);
      setPedidosAguardando(aguardando.slice(0, 10));
    } catch (err) {
      console.error('Erro ao buscar dados do display:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisplayData();
    const intervalId = setInterval(fetchDisplayData, 5000);
    return () => clearInterval(intervalId);
  }, []); // Dependência vazia garante que roda só uma vez na montagem + cleanup

  return { pedidosProntos, pedidosAguardando, isLoading, error };
};
