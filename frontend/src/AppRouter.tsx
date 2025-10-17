import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// --- ALTERAÇÃO AQUI ---
// Componente de Rota Protegida (modificado)
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth(); // <<< Pega isLoadingAuth

  if (isLoadingAuth) {
    return null; // Ou <FullPageLoader />; - Não renderiza nada enquanto verifica auth
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

// Componente de Rota Admin (modificado)
const AdminRoute: React.FC = () => {
  const { usuario, isLoadingAuth } = useAuth(); // <<< Pega isLoadingAuth

  if (isLoadingAuth) {
    return null; // Ou <FullPageLoader />; - Não renderiza nada enquanto verifica auth
  }

  // Verifica se está autenticado E se é admin
  return (usuario?.perfil === 'ADMINISTRADOR') ? <Outlet /> : <Navigate to="/pos" replace />;
};
// --- FIM DA ALTERAÇÃO ---


// Lazy Loading das Páginas (sem alterações)
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
  // O AuthProvider já garante que este componente só renderiza após isLoadingAuth ser false
  return (
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          {/* Rota de Login é pública */}
          <Route path="/" element={<Login />} />

          {/* Rotas protegidas (agora esperam isLoadingAuth ser false) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/pos" element={<POS />} />
            <Route path="/payment/:orderId" element={<Payment />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/display" element={<CustomerDisplay />} />

            {/* Rotas Admin (agora esperam isLoadingAuth ser false) */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/*" element={<Admin />} />
            </Route>
          </Route>

          {/* Fallback para rotas não encontradas */}
          {/* Importante: O fallback só deve ser acionado se nenhuma rota acima corresponder *depois* do loading */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
  );
}
