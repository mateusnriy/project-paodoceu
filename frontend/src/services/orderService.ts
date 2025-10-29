// frontend/src/services/orderService.ts
import api from './api';
import { Pedido, PaginatedResponse, TipoPagamento, CreateOrderPayload, PaymentPayload } from '../types'; // Importar tipos corretos

// Interface para dados do display (ajustada para snake_case se necessário)
interface DisplayData {
  // Ajustar nomes se backend retornar snake_case
  pedidosEmPreparacao: Pedido[];
  pedidosProntos: Pedido[];
}

// Mapeamento (se necessário, igual ao productService)
// const mapPedidoFromApi = (apiPedido: any): Pedido => ({ ... });

export const orderService = {
  /**
   * Lista todos os pedidos.
   */
  async listAll(): Promise<Pedido[]> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.get<Pedido[]>('/pedidos');
    // Mapear cada pedido se necessário: response.data.map(mapPedidoFromApi)
    return response.data;
  },

  /**
   * Lista apenas os pedidos prontos (para a tela /fila). RF09
   */
  async listReady(): Promise<Pedido[]> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.get<Pedido[]>('/pedidos/prontos');
    // Mapear cada pedido se necessário
    return response.data;
  },

  /**
   * Busca os dados para a tela do cliente (/display). RF12
   */
  async getDisplayData(): Promise<DisplayData> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.get<DisplayData>('/pedidos/display');
    // Mapear pedidos dentro de emPreparacao/prontos se necessário
    return response.data;
  },

  /**
   * Busca um pedido específico pelo ID.
   */
  async getById(id: string): Promise<Pedido> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.get<Pedido>(`/pedidos/${id}`);
    // Mapear se necessário
    return response.data;
  },

  /**
   * Cria um novo pedido. RF05
   */
  async create(payload: CreateOrderPayload): Promise<Pedido> {
    // Payload já deve estar no formato esperado pelo backend (snake_case para itens)
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.post<Pedido>('/pedidos', payload);
    // Mapear se necessário
    return response.data;
  },

  /**
   * Processa o pagamento de um pedido existente. RF06
   * Correção Bug Rota Pagamento: Usar a rota correta.
   */
  async pay(id: string, payload: PaymentPayload): Promise<Pedido> {
    // Payload já está no formato esperado ({ metodo, valor_pago })
    // Correção A.3 e Correção Rota Pagamento: Chamada SEM /api duplicado e rota correta
    const response = await api.post<Pedido>(`/pedidos/${id}/pagamento`, payload); // Rota corrigida de '/pagamento'
    // Mapear se necessário
    return response.data;
  },

  /**
   * Marca um pedido como entregue. RF10
   */
  async markAsDelivered(id: string): Promise<Pedido> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.patch<Pedido>(`/pedidos/${id}/entregar`);
    // Mapear se necessário
    return response.data;
  },

  /**
   * Cancela um pedido (requer permissão de Admin).
   */
  async cancel(id: string): Promise<Pedido> {
    // Correção A.3: Chamada SEM /api duplicado
    const response = await api.patch<Pedido>(`/pedidos/${id}/cancelar`);
    // Mapear se necessário
    return response.data;
  },
};
