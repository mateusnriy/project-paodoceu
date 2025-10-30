// src/hooks/useAdminReports.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // CORREÇÃO (TS2614): Importação default
// import { getErrorMessage } from '../utils/errors'; // REMOVIDO
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
  quantidade: number;
  total: number;
}

// Interface unificada para o estado do hook
export interface AdminReportsData {
  receitaHoje: number;
  totalPedidosHoje: number;
  ticketMedioHoje: number;
  vendasUltimos7Dias: VendasDiariasResponseItem[];
  produtosMaisVendidos: TopProdutosResponseItem[]; // Corrigido o nome da propriedade
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
    if (!data) setIsLoading(true); // Só loading total na primeira vez
    setError(null);
    try {
        const todayRange = getDateRangeQuery('today'); // { data_inicio, data_fim } para hoje
        const weekRange = getDateRangeQuery('week');   // { data_inicio, data_fim } para os últimos 7 dias

        // Chamadas usando o endpoint /relatorios/vendas com 'tipo'
        const [resHoje, res7Dias, resTopProdutos] = await Promise.all([
          // 1. tipo=periodo para totais de hoje
          api.get<VendasPeriodoResponse>('/relatorios/vendas', {
             params: { ...todayRange, tipo: 'periodo' }
          }),
          // 2. tipo=diario para vendas por dia na semana
          api.get<VendasDiariasResponseItem[]>('/relatorios/vendas', {
             params: { ...weekRange, tipo: 'diario' }
          }),
          // 3. tipo=produto para top produtos na semana
          api.get<TopProdutosResponseItem[]>('/relatorios/vendas', {
             params: { ...weekRange, tipo: 'produto', limite: 5 } // Backend precisa honrar 'limite'
          }),
        ]);

        // Monta o objeto de dados unificado
        const aggregatedData: AdminReportsData = {
          receitaHoje: resHoje.data.totalVendido,
          totalPedidosHoje: resHoje.data.totalPedidos,
          ticketMedioHoje: resHoje.data.ticketMedio,
          vendasUltimos7Dias: res7Dias.data,
          produtosMaisVendidos: resTopProdutos.data, // Corrigido o nome da propriedade
        };
        setData(aggregatedData);

    } catch (err) {
        // const message = getErrorMessage(err); // REMOVIDO
        setError(err);
        logError('Erro ao buscar relatórios:', err);
        setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};

export type { DateRangeOption };
