import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Usuario, PerfilUsuario } from './types';

// Layout e Páginas
import MainLayout from './components/common/MainLayout'; // Importa o novo layout principal
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import Login from './pages/Login';
import POS from './pages/POS';
import Payment from './pages/Payment';
import Orders from './pages/Orders';
import CustomerDisplay from './pages/CustomerDisplay';

// Admin (Lazy Loaded)
const Admin = lazy(() => import('./pages/Admin'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

// Componente de Rota Protegida (Wrapper)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, isLoadingAuth } = useAuth();
  
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!usuario) {
    // Redireciona para o login se não estiver autenticado
    return <Navigate to="/login" replace />;
  }

  // Renderiza o layout principal que contém o Header e o Outlet (children)
  return <>{children}</>;
};

// Componente de Rota de Admin (Wrapper)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth(); // AuthContext já lidou com isLoadingAuth no ProtectedRoute

  if (usuario?.perfil !== PerfilUsuario.ADMINISTRADOR) {
    // Se não for admin, redireciona para a tela principal de Vendas
    return <Navigate to="/vendas" replace />;
  }

  return <>{children}</>;
};

// Fallback de suspense unificado
const SuspenseFallback: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <LoadingSpinner />
  </div>
);

export function AppRouter() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/display" element={<CustomerDisplay />} />

        {/* Rotas Protegidas (Envolve o MainLayout) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirecionamento da raiz para /vendas */}
          <Route index element={<Navigate to="/vendas" replace />} />

          {/* Contexto: VENDAS */}
          <Route path="vendas">
            <Route index element={<POS />} /> {/* Rota /vendas */}
            <Route path="pagamento" element={<Payment />} /> {/* Rota /vendas/pagamento */}
          </Route>

          {/* Contexto: FILA */}
          <Route path="fila">
            <Route index element={<Orders />} /> {/* Rota /fila (antiga /orders) */}
          </Route>

          {/* Contexto: GESTAO (Protegido por AdminRoute) */}
          <Route
            path="gestao"
            element={
              <AdminRoute>
                <Admin /> {/* Admin.tsx agora é o layout DO CONTEÚDO de gestão (com Sidebar) */}
              </AdminRoute>
            }
          >
            {/* Redireciona /gestao para /gestao/relatorios */}
            <Route index element={<Navigate to="/gestao/relatorios" replace />} />
            <Route path="relatorios" element={<AdminReports />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="usuarios" element={<AdminUsers />} />
          </Route>
        </Route>

        {/* Fallback para rotas não encontradas (dentro do contexto logado) */}
        <Route path="*" element={<Navigate to="/vendas" replace />} />
      </Routes>
    </Suspense>
  );
}
