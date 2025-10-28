import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { PerfilUsuario } from './types';

// --- Layouts e Componentes Essenciais ---
import MainLayout from './components/common/MainLayout'; // Layout principal para rotas protegidas
import { LoadingSpinner } from './components/ui/LoadingSpinner'; // Componente de carregamento

// --- Páginas Carregadas Normalmente (Não Lazy) ---
import Login from './pages/Login'; // Página de Login
import Register from './pages/Register'; // <<< Página de Registro (Nova) >>>
import POS from './pages/POS'; // Página do Ponto de Venda
import Payment from './pages/Payment'; // Página de Pagamento
import Orders from './pages/Orders'; // Página da Fila de Pedidos
import CustomerDisplay from './pages/CustomerDisplay'; // Página do Display do Cliente

// --- Páginas da Área Administrativa (Carregadas com Lazy Loading) ---
// Isso melhora o tempo de carregamento inicial, pois o código admin só é baixado quando necessário.
const Admin = lazy(() => import('./pages/Admin')); // Layout da área administrativa (com Sidebar)
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

// --- Componente Wrapper para Rotas Protegidas ---
/**
 * Garante que o usuário esteja autenticado para acessar a rota.
 * Mostra um spinner enquanto verifica o estado de autenticação inicial.
 * Redireciona para /login se o usuário não estiver autenticado.
 * @param {React.ReactNode} children - O componente/rota a ser renderizado se autenticado.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, isLoadingAuth } = useAuth(); // Obtém estado de autenticação do contexto

  // Enquanto verifica o token inicial, exibe um spinner
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  // Se, após a verificação, não houver usuário, redireciona para a página de login
  if (!usuario) {
    // 'replace' evita que a rota protegida entre no histórico do navegador
    return <Navigate to="/login" replace />;
  }

  // Se autenticado, renderiza o conteúdo protegido (que geralmente inclui o MainLayout)
  return <>{children}</>;
};

// --- Componente Wrapper para Rotas de Administrador ---
/**
 * Garante que o usuário autenticado tenha o perfil de ADMINISTRADOR.
 * Redireciona para /vendas se o usuário não for administrador.
 * Assume que já passou pelo ProtectedRoute (usuário existe).
 * @param {React.ReactNode} children - O componente/rota admin a ser renderizado.
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth(); // Obtém o usuário (já validado pelo ProtectedRoute)

  // Verifica se o perfil do usuário é ADMINISTRADOR
  if (usuario?.perfil !== PerfilUsuario.ADMINISTRADOR) {
    // Se não for admin, redireciona para a tela principal de vendas
    console.warn("Tentativa de acesso não autorizado à área de gestão.");
    return <Navigate to="/vendas" replace />;
  }

  // Se for admin, renderiza o conteúdo da rota administrativa
  return <>{children}</>;
};

// --- Fallback para Componentes Lazy Loaded ---
/**
 * Componente exibido enquanto os componentes carregados com React.lazy() são baixados.
 */
const SuspenseFallback: React.FC = () => (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <LoadingSpinner />
  </div>
);

/**
 * Componente principal que define todas as rotas da aplicação.
 */
export function AppRouter() {
  return (
    // Suspense é necessário para usar React.lazy
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        {/* --- Rotas Públicas --- */}
        {/* Não exigem autenticação */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* <<< Rota de Registro Adicionada >>> */}
        <Route path="/display" element={<CustomerDisplay />} />

        {/* --- Rotas Protegidas --- */}
        {/* Envolve todas as rotas que exigem login com o ProtectedRoute */}
        {/* O MainLayout é aplicado aqui para fornecer o Header global */}
        <Route
          path="/" // Rota raiz para todas as páginas logadas
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirecionamento: Se acessar '/', vai para '/vendas' */}
          <Route index element={<Navigate to="/vendas" replace />} />

          {/* Contexto: VENDAS */}
          <Route path="vendas"> {/* Rota base /vendas */}
            <Route index element={<POS />} /> {/* Componente para /vendas */}
            <Route path="pagamento" element={<Payment />} /> {/* Componente para /vendas/pagamento */}
          </Route>

          {/* Contexto: FILA */}
          <Route path="fila"> {/* Rota base /fila */}
            <Route index element={<Orders />} /> {/* Componente para /fila */}
          </Route>

          {/* Contexto: GESTAO (Protegido adicionalmente por AdminRoute) */}
          <Route
            path="gestao" // Rota base /gestao
            element={
              <AdminRoute> {/* Verifica se o usuário é admin */}
                <Admin /> {/* Renderiza o layout da área de gestão (com Sidebar) */}
              </AdminRoute>
            }
          >
            {/* Sub-rotas da área de gestão (renderizadas dentro do <Outlet> de Admin.tsx) */}
            {/* Redirecionamento: Se acessar '/gestao', vai para '/gestao/relatorios' */}
            <Route index element={<Navigate to="/gestao/relatorios" replace />} />
            <Route path="relatorios" element={<AdminReports />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="usuarios" element={<AdminUsers />} />
            {/* Adicionar aqui outras rotas de gestão no futuro */}
          </Route>

          {/* --- Fallback para rotas não encontradas DENTRO do contexto logado --- */}
          {/* Se o usuário logado tentar acessar uma rota inválida (ex: /qualquercoisa) */}
          {/* ele será redirecionado para /vendas. */}
          <Route path="*" element={<Navigate to="/vendas" replace />} />

        </Route> {/* Fim das Rotas Protegidas */}

        {/* --- Fallback Geral (Opcional) --- */}
        {/* Se uma rota totalmente inválida for acessada (fora do escopo de '/')
           poderia redirecionar para login, mas o ProtectedRoute já faz isso.
           Se houver um erro e o usuário chegar aqui sem estar logado, redireciona para login. */}
        {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}

      </Routes>
    </Suspense>
  );
}
