import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { useNavigation } from '../contexts/NavigationContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

/**
 * Esta página agora atua como o layout principal para o CONTEXTO DE GESTÃO.
 * Ela renderiza o Sidebar (agora fixo) e o conteúdo (Outlet) das sub-rotas de admin.
 * A lógica de {isSidebarOpen, toggleSidebar} foi removida.
 */
const Admin: React.FC = () => {
  const { activeContext } = useNavigation();

  // Garante que o layout de Admin (com Sidebar) só seja renderizado
  // se o contexto de navegação estiver correto (GESTAO).
  // Isso previne renderização indevida se a rota for acessada diretamente
  // sem o contexto estar sincronizado.
  if (activeContext !== 'GESTAO') {
    // Mostra um loading ou redireciona (o NavigationContext deve lidar com o redirecionamento)
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    // Layout principal para o contexto de Gestão
    // O Header Global é renderizado acima disso, no AppRouter.
    <div className="flex h-[calc(100vh-80px)]"> {/* Altura total menos 80px do Header Global */}
      
      {/* Sidebar Fixo (w-64) */}
      <Sidebar />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 md:p-8"> {/* Fundo mais claro e padding (8px grid) */}
          <div className="container mx-auto max-w-7xl">
            <Outlet /> {/* Renderiza as sub-rotas (Relatórios, Produtos, etc.) */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin; // Exporta como default para React.lazy
