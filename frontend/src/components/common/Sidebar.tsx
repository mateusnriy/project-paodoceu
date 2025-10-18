import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Package,
  Users,
  LayoutGrid,
} from 'lucide-react';

// Interface de props removida, pois o sidebar não é mais colapsável
// O estado de abertura (isSidebarOpen) e a função (toggleSidebar) foram removidos.

// Componente interno para os links da navegação
const SidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({
  to,
  icon,
  label,
}) => {
  // Define as classes base, de hover e de foco (usando cores arbitrárias do Guia de Estilo)
  const baseClasses =
    'flex items-center px-4 py-3 rounded-lg text-[#333333] font-medium transition-colors duration-150'; // text-primary
  const hoverClasses = 'hover:bg-[#F0F7FF] hover:text-[#4A90E2]'; // background-light-blue, primary-blue
  const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-[#4A90E2]'; // primary-blue
  
  // Classes para o link ATIVO
  const activeClasses = 'bg-[#F0F7FF] text-[#4A90E2]'; // background-light-blue, primary-blue

  return (
    <NavLink
      to={to}
      end // Garante que o link só esteja ativo se a rota for exata (ex: /gestao/relatorios)
      className={({ isActive }) =>
        `${baseClasses} ${hoverClasses} ${focusClasses} ${isActive ? activeClasses : ''}`
      }
    >
      <span className="mr-3">{icon}</span>
      {label}
    </NavLink>
  );
};

const Sidebar: React.FC = React.memo(() => {
  // Componente agora é fixo e não tem estado.
  // O link "Voltar ao PDV" foi removido.
  // O menu mobile (X/Menu) foi removido.
  return (
    <aside
      className="
        w-64 h-screen bg-white shadow-soft 
        hidden md:flex flex-col flex-shrink-0 
        border-r border-gray-200
      "
    >
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="flex-1 px-4 space-y-2"> {/* Espaçamento (space-y-2) de 8px entre os links */}
          <SidebarLink
            to="/gestao/relatorios"
            icon={<BarChart3 size={20} />}
            label="Relatórios"
          />
          <SidebarLink
            to="/gestao/produtos"
            icon={<Package size={20} />}
            label="Produtos"
          />
          <SidebarLink
            to="/gestao/categorias"
            icon={<LayoutGrid size={20} />}
            label="Categorias"
          />
          <SidebarLink
            to="/gestao/usuarios"
            icon={<Users size={20} />}
            label="Usuários"
          />
        </nav>
      </div>
    </aside>
  );
});

export { Sidebar };
