// frontend/src/components/common/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom'; // <<< Importação necessária e usada
import { BarChart3, Package, Users, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilUsuario } from '../../types'; // <<< Importar PerfilUsuario

// --- Componente interno SidebarLink --- <<< DEFINIDO AQUI
const SidebarLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({
  to,
  icon,
  label,
}) => {
  const baseClasses =
    'flex items-center px-4 py-3 rounded-lg text-text-primary font-medium transition-colors duration-150';
  const hoverClasses = 'hover:bg-background-light-blue hover:text-primary-blue';
  const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-primary-blue';
  const activeClasses = 'bg-background-light-blue text-primary-blue';

  return (
    <NavLink
      to={to}
      end // Garante correspondência exata da rota
      className={({ isActive }) =>
        `${baseClasses} ${hoverClasses} ${focusClasses} ${isActive ? activeClasses : ''}`
      }
    >
      <span className="mr-3 flex-shrink-0">{icon}</span>
      {label}
    </NavLink>
  );
};
// --- Fim SidebarLink ---

const Sidebar: React.FC = React.memo(() => {
  const { usuario } = useAuth();
  const canManageUsers = usuario?.perfil === PerfilUsuario.MASTER; // <<< Usar tipo importado

  return (
    <aside
      className="
        w-64 h-full bg-white shadow-soft
        hidden md:flex flex-col flex-shrink-0
        border-r border-gray-200
      "
    >
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="flex-1 px-4 space-y-2">
          {/* Usa SidebarLink definido acima */}
          <SidebarLink to="/gestao/relatorios" icon={<BarChart3 size={20} />} label="Relatórios" />
          <SidebarLink to="/gestao/produtos" icon={<Package size={20} />} label="Produtos" />
          <SidebarLink to="/gestao/categorias" icon={<LayoutGrid size={20} />} label="Categorias" />
          {canManageUsers && (
            <SidebarLink to="/gestao/usuarios" icon={<Users size={20} />} label="Usuários" />
          )}
        </nav>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
export { Sidebar }; // Manter export nomeado se for importado assim
