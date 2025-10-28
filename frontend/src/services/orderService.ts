import api from './api';
import { Pedido, PaginatedResponse, TipoPagamento } from '../types';

// Interface para payload de criação de pedido (simplificado para o frontend)
interface CreateOrderPayload {
  cliente_nome?: string;
  itens: { produto_id: string; quantidade: number }[];
}

// Interface para payload de pagamento
interface PayOrderPayload {
  metodo: TipoPagamento;
  valor_pago: number;
}

// Interface para dados do display
interface DisplayData {
  emPreparacao: Pedido[];
  prontos: Pedido[];
}


export const orderService = {
  /**
   * Lista todos os pedidos (pode ser usado no admin ou histórico).
   * TODO: Adicionar paginação se necessário para admin.
   */
  async listAll(): Promise<Pedido[]> {
    const response = await api.get<Pedido[]>('/pedidos');
    // Assumindo camelCase
    return response.data;
  },

  /**
   * Lista apenas os pedidos prontos (para a tela /fila).
   */
  async listReady(): Promise<Pedido[]> {
    const response = await api.get<Pedido[]>('/pedidos/prontos');
    // Assumindo camelCase
    return response.data;
  },

   /**
   * Busca os dados para a tela do cliente (/display).
   */
  async getDisplayData(): Promise<DisplayData> {
    const response = await api.get<DisplayData>('/pedidos/display');
    // Assumindo camelCase
    return response.data;
  },


  /**
   * Busca um pedido específico pelo ID.
   */
  async getById(id: string): Promise<Pedido> {
    const response = await api.get<Pedido>(`/pedidos/${id}`);
    // Assumindo camelCase
    return response.data;
  },

  /**
   * Cria um novo pedido.
   */
  async create(payload: CreateOrderPayload): Promise<Pedido> {
    const response = await api.post<Pedido>('/pedidos', payload);
    // Assumindo camelCase
    return response.data;
  },

  /**
   * Processa o pagamento de um pedido existente.
   */
  async pay(id: string, payload: PayOrderPayload): Promise<Pedido> {
    const response = await api.post<Pedido>(`/pedidos/${id}/pagar`, payload);
    // Assumindo camelCase
    return response.data;
  },

  /**
   * Marca um pedido como entregue.
   */
  async markAsDelivered(id: string): Promise<Pedido> {
    const response = await api.patch<Pedido>(`/pedidos/${id}/entregar`);
    // Assumindo camelCase
    return response.data;
  },

  /**
   * Cancela um pedido (requer permissão de Admin no backend).
   */
  async cancel(id: string): Promise<Pedido> {
    const response = await api.patch<Pedido>(`/pedidos/${id}/cancelar`);
    // Assumindo camelCase
    return response.data;
  },
};
