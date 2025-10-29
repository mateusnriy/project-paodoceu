import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header'; // Importa o novo Header global
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const MainLayout: React.FC = () => {
  const { isLoadingAuth } = useAuth();

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
      <Outlet />
    </div>
  );
};

export default MainLayout;
