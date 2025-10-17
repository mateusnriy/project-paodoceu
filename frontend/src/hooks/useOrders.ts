import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Order } from '../types'; // Barrel file
import { logError } from '../utils/logger'; // Log

interface OrderWithUI extends Order {
  completed?: boolean; // Estado de UI para animação
}

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderWithUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Não precisa de useCallback se só é usado no useEffect
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<Order[]>('/pedidos/prontos');
      setOrders(response.data.map((order) => ({ ...order, completed: false }))); // Inicializa completed
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      logError('Erro ao buscar pedidos prontos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas na montagem

  // Não precisa de useCallback se só é passado para a página
  const handleCompleteOrder = async (orderId: string) => {
    // UI otimista
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? { ...order, completed: true } : order))
    );

    try {
      await api.patch(`/pedidos/${orderId}/entregar`);
      // Remove após animação
      setTimeout(() => {
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
      }, 1500);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message); // Mostra erro na UI
      logError('Erro ao marcar pedido como entregue:', err, { orderId });
      // Reverte UI
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, completed: false } : order))
      );
    }
  };

  return {
    orders,
    isLoading,
    error,
    handleCompleteOrder,
  };
};
