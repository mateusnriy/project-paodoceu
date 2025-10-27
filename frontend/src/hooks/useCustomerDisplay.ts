// src/hooks/useCustomerDisplay.ts
import { useState, useEffect } from 'react';
import { Pedido } from '../types'; // StatusPedido não é mais necessário aqui
import { api } from '../services/api';

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
      setError(null);
      const response = await api.get<DisplayData>('/pedidos/display'); // Assumindo que este endpoint existe

      // Ordena os prontos (mais recente primeiro pela data de atualização)
      const prontos = response.data.pedidosProntos.sort(
        (a, b) =>
          new Date(b.atualizado_em).getTime() -
          new Date(a.atualizado_em).getTime()
      );

      // Ordena os aguardando (mais antigo primeiro pela data de criação)
      const aguardando = response.data.pedidosAguardando.sort(
        (a, b) =>
          new Date(a.criado_em).getTime() -
          new Date(b.criado_em).getTime()
      );

      setPedidosProntos(prontos);
      setPedidosAguardando(aguardando.slice(0, 10)); // Limita a 10 na lista de espera
    } catch (err) {
      console.error('Erro ao buscar dados do display:', err);
      setError(err);
    } finally {
      // Garante que o loading seja desativado após a primeira busca
      if (isLoading) {
         setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDisplayData();
    const intervalId = setInterval(fetchDisplayData, 5000); // Busca a cada 5 segundos
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependência vazia para rodar apenas na montagem e limpeza

  return { pedidosProntos, pedidosAguardando, isLoading, error };
};
