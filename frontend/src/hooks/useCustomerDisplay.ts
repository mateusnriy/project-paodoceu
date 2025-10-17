import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Order } from '../types'; // Barrel file
import { logError } from '../utils/logger'; // Log

const POLLING_INTERVAL = 5000; // 5 segundos

export const useCustomerDisplay = () => {
  const [orders, setOrders] = useState<number[]>([]);
  const [highlightOrder, setHighlightOrder] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Flag para evitar updates após desmontar

    const fetchOrders = async () => {
      try {
        const response = await api.get<Order[]>('/pedidos/prontos');
        if (!isMounted) return; // Não atualiza se desmontado

        const newOrderNumbers = response.data.map((order) => order.numero_sequencial_dia);

        setError(null); // Limpa erro anterior

        setOrders((prevOrders) => {
          // Encontra a nova ordem para destacar
          const newOrder = newOrderNumbers.find((num) => !prevOrders.includes(num));

          if (newOrder) {
            setHighlightOrder(newOrder);
            setTimeout(() => {
              if (isMounted) setHighlightOrder(null);
            }, 2000); // Duração do destaque
          }

          return newOrderNumbers; // Atualiza a lista
        });
      } catch (err) {
        if (!isMounted) return;
        // Não usar getErrorMessage aqui, pois pode ser erro de rede intermitente
        const message = 'Não foi possível atualizar a lista de pedidos.';
        setError(message);
        logError('Erro no polling do Customer Display:', err);
      }
    };

    fetchOrders(); // Busca inicial
    const timer = setInterval(fetchOrders, POLLING_INTERVAL);

    // Limpa o intervalo e a flag ao desmontar
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []); // Executa apenas uma vez

  return { orders, highlightOrder, error };
};
