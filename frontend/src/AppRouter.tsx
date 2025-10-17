import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Componente de Rota Protegida
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

// Componente de Rota Admin
const AdminRoute: React.FC = () => {
  const { usuario } = useAuth();
  return usuario?.perfil === 'ADMINISTRADOR' ? <Outlet /> : <Navigate to="/pos" replace />;
};

// Lazy Loading das Páginas
const POS = lazy(() => import('./pages/POS'));
const Payment = lazy(() => import('./pages/Payment'));
const Orders = lazy(() => import('./pages/Orders'));
const CustomerDisplay = lazy(() => import('./pages/CustomerDisplay'));
const Admin = lazy(() => import('./pages/Admin'));

const FullPageLoader: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <LoadingSpinner size={40} />
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Rotas protegidas para todos os usuários logados */}
          <Route element={<ProtectedRoute />}>
            <Route path="/pos" element={<POS />} />
            <Route path="/payment/:orderId" element={<Payment />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/display" element={<CustomerDisplay />} />
            
            {/* Rotas protegidas apenas para Admin */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/*" element={<Admin />} />
            </Route>
          </Route>

          {/* Fallback para rotas não encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
