// src/services/reportService.ts
import api from './api';
// CORREÇÃO (Erro 27): Removido 'DateRangeOption' (não utilizado)
// import { DateRangeOption } from '../utils/dates';

// Tipos baseados nas respostas esperadas do backend (conforme hook useAdminReports)
interface VendasPeriodoResponse {
  totalVendido: number;
  totalPedidos: number;
  ticketMedio: number;
  periodo?: {
      inicio: string;
      fim: string;
  };
}
interface VendasDiariasResponseItem {
  data: string;
  total: number;
}
interface TopProdutosResponseItem {
  nome: string;
  quantidade: number;
  total: number;
}
interface VendasCategoriaResponseItem {
    nome: string;
    quantidade: number;
    valor: number;
}

type VendasReportResponse =
  | VendasPeriodoResponse
  | VendasDiariasResponseItem[]
  | TopProdutosResponseItem[]
  | VendasCategoriaResponseItem[];

interface GetSalesReportParams {
    tipo: 'periodo' | 'diario' | 'produto' | 'categoria';
    data_inicio?: string;
    data_fim?: string;
    limite?: number;
}

interface ComprovanteData {
    cabecalho: { nomeEstabelecimento: string; };
    pedido: { numero: number; data: string; cliente: string; };
    itens: { quantidade: number; nome: string; preco_unitario: number; subtotal: number; }[];
    resumo: { total: number; metodoPagamento: string; valorPago: number; troco: number; };
    rodape: { agradecimento: string; };
}

export const reportService = {
  /**
   * Busca relatórios de vendas com base no tipo e período.
   */
  async getSalesReport<T extends VendasReportResponse>(params: GetSalesReportParams): Promise<T> {
    const queryParams = new URLSearchParams();
    queryParams.append('tipo', params.tipo);
    if (params.data_inicio) queryParams.append('data_inicio', params.data_inicio);
    if (params.data_fim) queryParams.append('data_fim', params.data_fim);
    if (params.limite) queryParams.append('limite', String(params.limite));

    const response = await api.get<T>(`/relatorios/vendas?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Busca os dados para gerar um comprovante de um pedido específico.
   */
  async getReceiptData(pedidoId: string): Promise<ComprovanteData> {
      const response = await api.get<ComprovanteData>(`/relatorios/pedidos/${pedidoId}/comprovante`);
      return response.data;
  }
};
