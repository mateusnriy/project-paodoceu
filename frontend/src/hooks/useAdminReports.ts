// src/hooks/useAdminReports.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { getDateRangeQuery, DateRangeOption } from '../utils/dates';
import { logError } from '../utils/logger';

interface VendasPeriodoResponse {
  totalVendido: number;
  totalPedidos: number;
  ticketMedio: number;
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

export interface AdminReportsData {
  receitaHoje: number;
  totalPedidosHoje: number;
  ticketMedioHoje: number;
  vendasUltimos7Dias: VendasDiariasResponseItem[];
  produtosMaisVendidos: TopProdutosResponseItem[]; // Corrigido nome da propriedade
}

export const useAdminReports = () => {
  const [data, setData] = useState<AdminReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    if (!data) setIsLoading(true);
    setError(null);
    try {
        const todayRange = getDateRangeQuery('today');
        const weekRange = getDateRangeQuery('week');

        const [resHoje, res7Dias, resTopProdutos] = await Promise.all([
          api.get<VendasPeriodoResponse>('/relatorios/vendas', {
             params: { ...todayRange, tipo: 'periodo' }
          }),
          api.get<VendasDiariasResponseItem[]>('/relatorios/vendas', {
             params: { ...weekRange, tipo: 'diario' }
          }),
          api.get<TopProdutosResponseItem[]>('/relatorios/vendas', {
             params: { ...weekRange, tipo: 'produto', limite: 5 }
          }),
        ]);

        const aggregatedData: AdminReportsData = {
          receitaHoje: resHoje.data.totalVendido,
          totalPedidosHoje: resHoje.data.totalPedidos,
          ticketMedioHoje: resHoje.data.ticketMedio,
          vendasUltimos7Dias: res7Dias.data,
          produtosMaisVendidos: resTopProdutos.data, // Corrigido nome da propriedade
        };
        setData(aggregatedData);

    } catch (err) {
        // const message = getErrorMessage(err); // REMOVIDO - não utilizado
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
