import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { Button } from '../../components/common/Button';
import { CalendarIcon, DownloadIcon } from 'lucide-react';
import { useAdminReports } from '../../hooks/useAdminReports';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { formatCurrency } from '../../utils/formatters';

const AdminReports: React.FC = () => {
  const {
    isLoading,
    error,
    dateRange,
    setDateRange,
    periodoData,
    produtoData, // Unidades vendidas por produto
    categoriaData, // Valor R$ vendido por categoria
    topProduct,
  } = useAdminReports();

  const renderCharts = () => {
    if (isLoading) {
      return <div className="flex justify-center py-20"><LoadingSpinner size={40} /></div>;
    }
    if (error) {
      return <ErrorMessage message={error} />;
    }
    return (
      <div className="space-y-6">
        {/* Gráfico 1: Vendas R$ por Categoria (Barra Horizontal) */}
        <div className="bg-white rounded-4xl shadow-soft p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Vendas por Categoria (R$)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoriaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip formatter={(value: number) => [`R$ ${formatCurrency(value)}`, 'Vendas']} />
                <Legend />
                <Bar dataKey="vendas" name="Vendas (R$)" fill="#5DADEC" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Gráfico 2: Produtos Mais Vendidos (Unidades) (Barra Vertical) */}
        <div className="bg-white rounded-4xl shadow-soft p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Produtos Mais Vendidos (Unidades)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={produtoData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value: number) => [value, 'Unidades']} />
                <Legend />
                <Bar dataKey="vendas" name="Unidades Vendidas" fill="#1D4ED8" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Gráfico 3: Tendência de Vendas por Categoria (R$) (Linha) */}
        <div className="bg-white rounded-4xl shadow-soft p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tendência de Vendas por Categoria (R$)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={categoriaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip formatter={(value: number) => [`R$ ${formatCurrency(value)}`, 'Vendas']} />
                <Legend />
                <Line type="monotone" dataKey="vendas" name="Vendas (R$)" stroke="#5DADEC" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-accent">Relatórios</h1>
        <div className="flex items-center gap-2">
          {/* O filtro de data ainda é apenas UI */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon size={16} className="text-gray-400" />
            </div>
            <select
              className="pl-10 py-2 pr-10 border border-gray-300 rounded-4xl focus:outline-none focus:ring-2 focus:ring-primary"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              disabled={isLoading}
            >
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
            </select>
          </div>
          <Button variant="outlined" disabled={isLoading}>
            <DownloadIcon size={16} /> <span className="ml-2">Exportar</span>
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-4xl shadow-soft p-4">
          <h3 className="text-sm font-medium text-gray-500">Total de Vendas</h3>
          <p className="text-2xl font-bold text-accent mt-1">
            {isLoading ? '...' : `R$ ${formatCurrency(periodoData?.totalVendido || 0)}`}
          </p>
        </div>
        <div className="bg-white rounded-4xl shadow-soft p-4">
          <h3 className="text-sm font-medium text-gray-500">Total de Pedidos</h3>
          <p className="text-2xl font-bold text-accent mt-1">
            {isLoading ? '...' : periodoData?.totalPedidos || 0}
          </p>
        </div>
        <div className="bg-white rounded-4xl shadow-soft p-4">
          <h3 className="text-sm font-medium text-gray-500">Ticket Médio</h3>
          <p className="text-2xl font-bold text-accent mt-1">
            {isLoading ? '...' : `R$ ${formatCurrency(periodoData?.ticketMedio || 0)}`}
          </p>
        </div>
        <div className="bg-white rounded-4xl shadow-soft p-4">
          <h3 className="text-sm font-medium text-gray-500">Produto Mais Vendido</h3>
          <p className="text-2xl font-bold text-accent mt-1 truncate">
            {isLoading ? '...' : topProduct?.name || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {isLoading ? '...' : `${topProduct?.vendas || 0} unidades`}
          </p>
        </div>
      </div>

      {renderCharts()}
    </div>
  );
};

// Exportar como default para o Lazy Loading
export default AdminReports;
