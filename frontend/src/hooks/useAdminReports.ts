import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { getDateRangeQuery } from '../utils/dates'; // Função auxiliar de data
import { logError } from '../utils/logger'; // Log

// Tipos para os dados de relatório
interface PeriodoData {
  totalVendido: number;
  totalPedidos: number;
  ticketMedio: number;
}
interface ChartData {
  name: string; // Nome da categoria ou produto
  vendas: number; // Pode ser R$ ou Quantidade dependendo do gráfico
}
interface TopProduct {
  name: string;
  vendas: number; // Quantidade
}

// Tipo mais específico para o state
type DateRangeOption = 'today' | 'week' | 'month' | 'year';

export const useAdminReports = () => {
  const [dateRange, setDateRange] = useState<DateRangeOption>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para os dados dos relatórios
  const [periodoData, setPeriodoData] = useState<PeriodoData | null>(null);
  const [produtoData, setProdutoData] = useState<ChartData[]>([]); // Para gráfico de unidades por produto
  const [categoriaData, setCategoriaData] = useState<ChartData[]>([]); // Para gráfico de R$ por categoria
  const [topProduct, setTopProduct] = useState<TopProduct | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Calcula as datas com base no estado 'dateRange'
      const { data_inicio, data_fim } = getDateRangeQuery(dateRange);

      // Monta os query params
      const queryParams = new URLSearchParams();
      if (data_inicio) queryParams.append('data_inicio', data_inicio);
      if (data_fim) queryParams.append('data_fim', data_fim);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      try {
        setIsLoading(true);
        setError(null);

        // Busca os 3 tipos de relatório simultaneamente
        const [resPeriodo, resProduto, resCategoria] = await Promise.all([
          api.get(`/relatorios/vendas?tipo=periodo${queryString}`),
          api.get(`/relatorios/vendas?tipo=produto${queryString}`),
          api.get(`/relatorios/vendas?tipo=categoria${queryString}`),
        ]);

        // 1. Dados dos Cards (Vendas, Pedidos, Ticket Médio)
        setPeriodoData(resPeriodo.data);

        // 2. Dados de Produtos (Unidades vendidas)
        const prodEntries = Object.entries(resProduto.data) as [
          string,
          { quantidade: number; valor: number },
        ][];
        const prodDataFormatted: ChartData[] = prodEntries.map(([nome, data]) => ({
          name: nome,
          vendas: data.quantidade, // Usar quantidade para o gráfico de unidades
        }));
        setProdutoData(prodDataFormatted);

        // Encontrar produto mais vendido (baseado em quantidade)
        if (prodDataFormatted.length > 0) {
          const top = [...prodDataFormatted].sort((a, b) => b.vendas - a.vendas)[0];
          setTopProduct(top);
        } else {
          setTopProduct(null);
        }

        // 3. Dados de Categoria (Valor R$ vendido)
        const catEntries = Object.entries(resCategoria.data) as [
          string,
          { quantidade: number; valor: number },
        ][];
        const catDataFormatted: ChartData[] = catEntries.map(([nome, data]) => ({
          name: nome,
          vendas: data.valor, // Usar valor R$ para os gráficos de categoria
        }));
        setCategoriaData(catDataFormatted);
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        logError('Erro ao buscar relatórios:', err, { dateRange, data_inicio, data_fim });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange]); // Recarrega os dados quando o filtro de data mudar

  return {
    isLoading,
    error,
    dateRange,
    setDateRange,
    // Dados processados para a UI
    periodoData,
    produtoData, // Usado no gráfico de barras verticais (unidades)
    categoriaData, // Usado nos gráficos de barras horizontais e linha (R$)
    topProduct,
  };
};
