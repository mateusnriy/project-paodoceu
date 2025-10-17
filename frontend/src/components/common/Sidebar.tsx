import React, { useState, memo } from 'react'; // Importado memo
import { NavLink } from 'react-router-dom';
import { BarChartIcon, UsersIcon, TagIcon, MenuIcon, XIcon, ShoppingCartIcon } from 'lucide-react'; // ShoppingCartIcon adicionado para o link "Voltar ao PDV"

interface SidebarProps {
  className?: string;
}

// Envolvido com React.memo
export const Sidebar = memo<SidebarProps>(({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Removido useLocation pois não era utilizado

  const menuItems = [
    { name: 'Produtos', path: '/admin/products', icon: <TagIcon size={20} /> }, // Ícone ajustado
    { name: 'Categorias', path: '/admin/categories', icon: <TagIcon size={20} /> },
    { name: 'Usuários', path: '/admin/users', icon: <UsersIcon size={20} /> },
    { name: 'Relatórios', path: '/admin/reports', icon: <BarChartIcon size={20} /> },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 right-4 z-50 bg-primary text-white p-2 rounded-full shadow-soft"
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'} // Label para acessibilidade
      >
        {isOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true" // Esconde do leitor de tela
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static left-0 top-0 h-full z-50 bg-white shadow-soft transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${className}`}
        aria-label="Menu de Administração" // Label para acessibilidade
      >
        <div className="flex flex-col h-full p-4 w-64">
          <div className="mb-6 flex items-center gap-2">
            <NavLink
              to="/pos"
              className="flex items-center gap-2 text-accent hover:opacity-80"
              onClick={() => setIsOpen(false)} // Fecha ao clicar no link
            >
              <ShoppingCartIcon className="text-primary" size={24} /> {/* Ícone adicionado */}
              <span className="font-medium">Voltar ao PDV</span>
            </NavLink>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)} // Fecha ao clicar no link
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-4xl transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-accent font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar'; // DisplayName adicionado
