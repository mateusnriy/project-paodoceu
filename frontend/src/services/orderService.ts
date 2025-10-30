// frontend/src/services/orderService.ts
import api from './api';
// CORREÇÃO (Erro 25, 26): Removidos 'PaginatedResponse' e 'TipoPagamento'
import { Pedido, CreateOrderPayload, PaymentPayload } from '../types';

// Interface para dados do display (ajustada para snake_case se necessário)
interface DisplayData {
  pedidosEmPreparacao: Pedido[];
  pedidosProntos: Pedido[];
}

export const orderService = {
  /**
   * Lista todos os pedidos.
   */
  async listAll(): Promise<Pedido[]> {
    const response = await api.get<Pedido[]>('/pedidos');
    return response.data;
  },

  /**
   * Lista apenas os pedidos prontos (para a tela /fila). RF09
   */
  async listReady(): Promise<Pedido[]> {
    const response = await api.get<Pedido[]>('/pedidos/prontos');
    return response.data;
  },

  /**
   * Busca os dados para a tela do cliente (/display). RF12
   */
  async getDisplayData(): Promise<DisplayData> {
    const response = await api.get<DisplayData>('/pedidos/display');
    return response.data;
  },

  /**
   * Busca um pedido específico pelo ID.
   */
  async getById(id: string): Promise<Pedido> {
    const response = await api.get<Pedido>(`/pedidos/${id}`);
    return response.data;
  },

  /**
   * Cria um novo pedido. RF05
   */
  async create(payload: CreateOrderPayload): Promise<Pedido> {
    const response = await api.post<Pedido>('/pedidos', payload);
    return response.data;
  },

  /**
   * Processa o pagamento de um pedido existente. RF06
   */
  async pay(id: string, payload: PaymentPayload): Promise<Pedido> {
    const response = await api.post<Pedido>(`/pedidos/${id}/pagamento`, payload);
    return response.data;
  },

  /**
   * Marca um pedido como entregue. RF10
   */
  async markAsDelivered(id: string): Promise<Pedido> {
    const response = await api.patch<Pedido>(`/pedidos/${id}/entregar`);
    return response.data;
  },

  /**
   * Cancela um pedido (requer permissão de Admin).
   */
  async cancel(id: string): Promise<Pedido> {
    const response = await api.patch<Pedido>(`/pedidos/${id}/cancelar`);
    return response.data;
  },
};
