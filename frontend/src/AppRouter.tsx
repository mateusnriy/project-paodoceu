// src/AppRouter.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
// import { Usuario, PerfilUsuario } from './types'; // Remover Usuario não utilizado
import { PerfilUsuario } from './types'; // Manter PerfilUsuario

// Layout e Páginas
import MainLayout from './components/common/MainLayout';
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
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente de Rota de Admin (Wrapper)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();

  if (usuario?.perfil !== PerfilUsuario.ADMINISTRADOR) {
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

        {/* Rotas Protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/vendas" replace />} />

          {/* Contexto: VENDAS */}
          <Route path="vendas">
            <Route index element={<POS />} />
            <Route path="pagamento" element={<Payment />} />
          </Route>

          {/* Contexto: FILA */}
          <Route path="fila" element={<Orders />} />

          {/* Contexto: GESTAO */}
          <Route
            path="gestao"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/gestao/relatorios" replace />} />
            <Route path="relatorios" element={<AdminReports />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="usuarios" element={<AdminUsers />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/vendas" replace />} />
      </Routes>
    </Suspense>
  );
}
