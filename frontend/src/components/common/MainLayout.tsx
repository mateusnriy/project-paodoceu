import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header'; // Importa o novo Header global
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

/**
 * Este componente serve como o layout principal para todas as páginas protegidas
 * que devem exibir o Header Global.
 * Ele garante que o Header seja persistente e renderiza o conteúdo da rota (Outlet) abaixo.
 */
const MainLayout: React.FC = () => {
  const { isLoadingAuth } = useAuth();

  // Garante que o layout só seja renderizado após a verificação da autenticação
  // Isso previne "flashes" de layout ou redirecionamentos incorretos.
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50"> {/* Fundo padrão para a aplicação */}
      <Header />
      {/* O conteúdo da página (Outlet) é renderizado aqui */}
      {/* O 'Admin.tsx' (layout de gestão) e outras páginas serão injetados aqui */}
      <Outlet />
    </div>
  );
};

export default MainLayout;
