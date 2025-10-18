import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { getDateRangeQuery, DateRangeOption } from '../utils/dates';
import { logError } from '../utils/logger';

// Tipos adaptados para o que o backend /relatorios/vendas retorna
interface VendasPeriodoResponse {
  totalVendido: number;
  totalPedidos: number;
  ticketMedio: number;
}
interface VendasDiariasResponseItem { // Assumindo que tipo=diario retorna isso
  data: string;
  total: number;
}
interface TopProdutosResponseItem { // Assumindo que tipo=produto retorna isso
  nome: string;
  quantidade: number; // Backend retorna quantidade vendida
  total: number;      // Backend retorna valor total vendido
}

// Interface unificada para o estado do hook
export interface AdminReportsData {
  receitaHoje: number;
  totalPedidosHoje: number;
  ticketMedioHoje: number;
  vendasUltimos7Dias: VendasDiariasResponseItem[];
  produtosMaisVendidos: TopProdutosResponseItem[];
}

/**
 * @hook useAdminReports
 * @description Hook para buscar dados consolidados para a tela de Relatórios.
 * Utiliza o endpoint GET /relatorios/vendas com diferentes query params ('tipo').
 */
export const useAdminReports = () => {
  const [data, setData] = useState<AdminReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  /**
   * @function fetchData
   * @description Busca os dados para os relatórios usando o endpoint /relatorios/vendas.
   */
  const fetchData = useCallback(async () => {
    // Só seta loading na primeira vez ou se não houver dados ainda
    if (!data) setIsLoading(true);
    setError(null);
    try {
        const todayRange = getDateRangeQuery('today'); // { data_inicio, data_fim } para hoje
        const weekRange = getDateRangeQuery('week');   // { data_inicio, data_fim } para os últimos 7 dias

        // <<< VERIFICAÇÃO/CORREÇÃO: Chamadas usando o endpoint /relatorios/vendas com 'tipo' >>>
        // Conforme backend/src/routes/relatoriosRoutes.ts
        const [resHoje, res7Dias, resTopProdutos] = await Promise.all([
          // tipo=periodo para totais de hoje
          api.get<VendasPeriodoResponse>('/relatorios/vendas', { params: { ...todayRange, tipo: 'periodo' } }),
          // tipo=diario para vendas por dia na semana
          api.get<VendasDiariasResponseItem[]>('/relatorios/vendas', { params: { ...weekRange, tipo: 'diario' } }), // Assumindo que backend suporta tipo='diario'
          // tipo=produto para top produtos na semana
          api.get<TopProdutosResponseItem[]>('/relatorios/vendas', { params: { ...weekRange, tipo: 'produto', limite: 5 } }), // Assumindo que backend suporta tipo='produto' e limite
        ]);

        // Monta o objeto de dados unificado
        const aggregatedData: AdminReportsData = {
          receitaHoje: resHoje.data.totalVendido,
          totalPedidosHoje: resHoje.data.totalPedidos,
          ticketMedioHoje: resHoje.data.ticketMedio,
          vendasUltimos7Dias: res7Dias.data,
          produtosMaisVendidos: resTopProdutos.data,
        };
        setData(aggregatedData);

    } catch (err) {
        // Erro 403 aqui indica problema de permissão (usuário não é ADMIN ou rota não protegida corretamente no backend)
        // ERR_CONNECTION_REFUSED indica que o backend não está rodando/acessível
        // Outros erros (404, 500) indicam problemas na API (rota não existe, erro interno)
        const message = getErrorMessage(err);
        setError(err); // Armazena o erro original
        logError('Erro ao buscar relatórios:', err); // Loga o erro detalhado
        setData(null); // Limpa dados antigos em caso de erro
    } finally {
      setIsLoading(false); // Sempre desativa o loading no final
    }
  }, [data]); // Adiciona 'data' como dependência para controlar o loading inicial

  // Efeito para buscar na montagem
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Executa quando fetchData é definido (uma vez)

  return {
    data,
    isLoading,
    error,
    // Função para permitir re-buscar os dados manualmente (ex: botão de atualizar)
    refetch: fetchData,
  };
};

// Exporta DateRangeOption se for usado externamente (ex: filtro na UI)
export type { DateRangeOption };
