// frontend/src/AppRouter.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { PerfilUsuario } from './types';
import MainLayout from './components/common/MainLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner'; // <<< Importação necessária

// Páginas não-lazy
import { Login } from './pages/Login'; // <<< CORRIGIDO (Causa 4)
import { Register } from './pages/Register'; // <<< CORRIGIDO (Causa 4)
import POS from './pages/POS';
import Payment from './pages/Payment';
import Orders from './pages/Orders';
import CustomerDisplay from './pages/CustomerDisplay';

// Páginas lazy
const Admin = lazy(() => import('./pages/Admin'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

// --- Componente Wrapper para Rotas Protegidas --- <<< DEFINIDO AQUI
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <LoadingSpinner size={40}/>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// --- Componente Wrapper para Rotas de Administrador ---
// (Já estava correto, mantido)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const isAdminOrMaster = usuario?.perfil === PerfilUsuario.ADMINISTRADOR || usuario?.perfil === PerfilUsuario.MASTER;
  if (!isAdminOrMaster) {
    console.warn("Tentativa de acesso não autorizado à área de gestão.");
    return <Navigate to="/vendas" replace />;
  }
  return <>{children}</>;
};

// --- Fallback para Componentes Lazy Loaded --- <<< DEFINIDO AQUI
const SuspenseFallback: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <LoadingSpinner size={40}/>
  </div>
);

// --- Componente Principal AppRouter ---
export function AppRouter() {
  return (
    // Usa SuspenseFallback definido acima
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/display" element={<CustomerDisplay />} />

        {/* Rotas Protegidas (Usa ProtectedRoute definido acima) */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/vendas" replace />} />
          {/* Vendas */}
          <Route path="vendas">
            <Route index element={<POS />} />
            <Route path="pagamento" element={<Payment />} />
          </Route>
          {/* Fila */}
          <Route path="fila" element={<Orders />} />
          {/* Gestão */}
          <Route path="gestao" element={<AdminRoute><Admin /></AdminRoute>}>
            <Route index element={<Navigate to="/gestao/relatorios" replace />} />
            <Route path="relatorios" element={<AdminReports />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="usuarios" element={<AdminUsers />} />
          </Route>
          {/* Fallback Logado */}
          <Route path="*" element={<Navigate to="/vendas" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

// Exportar como default se usado com React.lazy no App.tsx (não é o caso aqui)
// export default AppRouter;
