import api from './api';
import { DateRangeOption } from '../utils/dates'; // Importar tipo do utilitário

// Tipos baseados nas respostas esperadas do backend (conforme hook useAdminReports)
interface VendasPeriodoResponse {
  totalVendido: number;
  totalPedidos: number;
  ticketMedio: number;
  periodo?: { // Opcional, mas útil
      inicio: string;
      fim: string;
  };
}
interface VendasDiariasResponseItem {
  data: string; // Formato YYYY-MM-DD
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
    valor: number; // Backend retorna 'valor'
}

// Union type para o retorno genérico
type VendasReportResponse =
  | VendasPeriodoResponse
  | VendasDiariasResponseItem[]
  | TopProdutosResponseItem[]
  | VendasCategoriaResponseItem[];

// Tipo para os parâmetros da query
interface GetSalesReportParams {
    tipo: 'periodo' | 'diario' | 'produto' | 'categoria';
    data_inicio?: string; // Formato ISO YYYY-MM-DDTHH:mm:ss.sssZ
    data_fim?: string; // Formato ISO YYYY-MM-DDTHH:mm:ss.sssZ
    limite?: number; // Para tipo=produto
}

// Interface para dados do comprovante (simplificada)
interface ComprovanteData {
    // Definir a estrutura exata baseada na resposta da API /pedidos/:id/comprovante
    // Exemplo:
    cabecalho: { nomeEstabelecimento: string; /*...*/ };
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
    // Assumindo camelCase ou que os tipos já batem com a resposta
    return response.data;
  },

  /**
   * Busca os dados para gerar um comprovante de um pedido específico.
   */
  async getReceiptData(pedidoId: string): Promise<ComprovanteData> {
      const response = await api.get<ComprovanteData>(`/relatorios/pedidos/${pedidoId}/comprovante`);
      // Assumindo camelCase ou que os tipos já batem com a resposta
      return response.data;
  }
};
