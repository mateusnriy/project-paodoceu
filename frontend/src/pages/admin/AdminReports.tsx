import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useAdminReports } from '../../hooks/useAdminReports';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { getErrorMessage } from '../../utils/errors';
import { formatarMoeda, formatarData } from '../../utils/formatters';
import { Loader2 } from 'lucide-react';

/**
 * REFATORAÇÃO (Commit 2.5):
 * - Aplicados novos tokens de design (tipografia, cores, bordas, sombras).
 * - Títulos (H1) e textos de KPIs atualizados.
 */

// --- Componente KPI Card (Refatorado) ---
interface KpiCardProps {
  titulo: string;
  valor: string | number;
  descricao?: string;
  isLoading: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ titulo, valor, descricao, isLoading }) => (
  <div className="bg-primary-white p-6 rounded-xl shadow-soft border border-gray-200 h-full"> {/* h-full para alinhar altura */}
    <h3 className="text-base font-medium text-text-secondary mb-1 truncate"> {/* text-base e text-secondary */}
      {titulo}
    </h3>
    {isLoading ? (
      <div className="h-10 w-3/4 bg-gray-200 animate-pulse rounded-lg" />
    ) : (
      <p className="text-3xl font-bold text-text-primary"> {/* 3xl (30px) Bold e text-primary */}
        {valor}
      </p>
    )}
    {descricao && !isLoading && (
      <p className="text-sm text-text-secondary mt-1">{descricao}</p>
    )}
  </div>
);

// --- Componente Chart Container (Refatorado) ---
interface ChartContainerProps {
  title: string;
  isLoading: boolean;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, isLoading, children }) => (
  <div className="bg-primary-white p-6 rounded-xl shadow-soft border border-gray-200">
    <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>
    {isLoading ? (
      <div className="h-64 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-blue" />
      </div>
    ) : (
      <div className="h-64 w-full">
        {children}
      </div>
    )}
  </div>
);


// --- Página Principal ---
const AdminReports: React.FC = () => {
  const { data, isLoading, error } = useAdminReports();

  if (error) {
    return <ErrorMessage title="Erro ao carregar relatórios" message={getErrorMessage(error)} />;
  }

  // Formata os dados para os gráficos
  const vendasPorDiaData = data?.vendasUltimos7Dias.map(d => ({
    ...d,
    data: formatarData(d.data, { day: '2-digit', month: '2-digit' }),
    total: parseFloat(d.total.toFixed(2)),
  })) || [];
  
  const produtosMaisVendidosData = data?.produtosMaisVendidos.map(p => ({
    ...p,
    total: parseFloat(p.total.toFixed(2)),
  })) || [];

  return (
    <div className="space-y-6"> {/* 8px grid (space-y-6 = 24px) */}
      <h1 className="text-2xl font-bold text-text-primary">Relatórios</h1>

      {/* Grid de KPIs (item 4.1.6 - alinhamento de altura) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          titulo="Receita Total (Hoje)"
          valor={formatarMoeda(data?.receitaHoje || 0)}
          isLoading={isLoading}
        />
        <KpiCard
          titulo="Pedidos (Hoje)"
          valor={data?.totalPedidosHoje || 0}
          isLoading={isLoading}
        />
        <KpiCard
          titulo="Ticket Médio (Hoje)"
          valor={formatarMoeda(data?.ticketMedioHoje || 0)}
          isLoading={isLoading}
        />
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas dos Últimos 7 Dias (Gráfico de Linha) */}
        <ChartContainer title="Vendas nos Últimos 7 Dias" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vendasPorDiaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="data" stroke="#666666" />
              <YAxis stroke="#666666" tickFormatter={(val) => formatarMoeda(val)} />
              <Tooltip formatter={(val: number) => [formatarMoeda(val), 'Total']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4A90E2" // primary-blue
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Top 5 Produtos Mais Vendidos (Gráfico de Barra) */}
        <ChartContainer title="Top 5 Produtos Mais Vendidos" isLoading={isLoading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={produtosMaisVendidosData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="nome"
                width={120} // Aumenta espaço para o label do produto
                stroke="#666666"
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(val: number) => [formatarMoeda(val), 'Total']} />
              <Bar dataKey="total" fill="#4A90E2" /> {/* primary-blue */}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default AdminReports;
