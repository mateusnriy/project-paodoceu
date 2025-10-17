import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Order, PaymentMethod, PaymentPayload } from '../types'; // Barrel file
import { logError } from '../utils/logger'; // Log

export const usePayment = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados do pedido
  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const response = await api.get<Order>(`/pedidos/${orderId}`);
          if (response.data.status !== 'PENDENTE') {
            throw new Error('Este pedido não está mais pendente de pagamento.');
          }
          setOrder(response.data);
        } catch (err) {
          const message = getErrorMessage(err);
          setError(message);
          logError('Erro ao buscar pedido para pagamento:', err, { orderId });
          setTimeout(() => navigate('/pos'), 3000); // Aumentado tempo para ler erro
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId, navigate]);

  // Calcular troco
  const change = useMemo(() => {
    if (selectedMethod === 'DINHEIRO' && receivedAmount && order) {
      const received = parseFloat(receivedAmount.replace(',', '.'));
      if (!isNaN(received) && received >= order.valor_total) {
        return received - order.valor_total;
      }
    }
    return 0;
  }, [receivedAmount, order, selectedMethod]);

  // Verificar desabilitação do botão
  const isConfirmDisabled = useMemo(() => {
    if (isSubmitting || isLoading || !selectedMethod) return true;
    if (selectedMethod === 'DINHEIRO') {
      const received = parseFloat(receivedAmount.replace(',', '.'));
      return isNaN(received) || received < (order?.valor_total || 0);
    }
    return false;
  }, [isSubmitting, isLoading, selectedMethod, receivedAmount, order]);

  // Processar o pagamento - retorna boolean
  const handlePaymentConfirmation = useCallback(async (): Promise<boolean> => {
    if (!orderId || !selectedMethod || !order) return false;

    let valorPago = order.valor_total;
    if (selectedMethod === 'DINHEIRO') {
      valorPago = parseFloat(receivedAmount.replace(',', '.'));
    }

    const payload: PaymentPayload = {
      metodo: selectedMethod,
      valor_pago: valorPago,
    };

    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/pedidos/${orderId}/pagar`, payload);
      setIsPaymentComplete(true);
      setTimeout(() => navigate('/orders'), 2000);
      return true; // Sucesso
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message); // Define o erro localmente
      logError('Erro ao processar pagamento:', err, { orderId, method: selectedMethod });
      setIsSubmitting(false);
      return false; // Falha
    }
    // O finally não é necessário aqui pois o isSubmitting só deve ser false em caso de erro
  }, [orderId, selectedMethod, order, receivedAmount, navigate]);

  return {
    isLoading,
    isSubmitting,
    isPaymentComplete,
    error,
    order,
    orderTotal: order?.valor_total || 0,
    selectedMethod,
    setSelectedMethod,
    receivedAmount,
    setReceivedAmount,
    change,
    isConfirmDisabled,
    handlePaymentConfirmation, // A página chamará esta função e tratará o retorno/erro
  };
};
