import React, { useMemo } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, NavigationContextType } from '../../contexts/NavigationContext';

// Componente de botão de contexto interno para melhor legibilidade
const ContextButton: React.FC<{
  label: string;
  context: NavigationContextType;
  activeContext: NavigationContextType;
  onClick: (context: NavigationContextType) => void;
}> = ({ label, context, activeContext, onClick }) => {
  const isActive = context === activeContext;

  const baseClasses =
    'px-4 py-2 rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Classes para o botão ATIVO
  const activeClasses =
    'bg-[#4A90E2] text-white focus:ring-[#4A90E2]'; // primary-blue

  // Classes para o botão INATIVO
  const inactiveClasses =
    'bg-white text-[#4A90E2] hover:bg-[#F0F7FF] focus:ring-[#4A90E2]'; // background-light-blue no hover

  return (
    <button
      onClick={() => onClick(context)}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      aria-current={isActive ? 'page' : undefined} // Define a página/contexto atual para acessibilidade
    >
      {label}
    </button>
  );
};

const Header: React.FC = React.memo(() => {
  const { usuario, logout } = useAuth();
  const { activeContext, setActiveContext, availableContexts } = useNavigation();

  // Memoiza os contextos visíveis para evitar recalcular
  const visibleContexts = useMemo(() => {
    return (['VENDAS', 'FILA', 'GESTAO'] as NavigationContextType[]).filter(
      (context) => availableContexts.includes(context)
    );
  }, [availableContexts]);

  if (!usuario) {
    return null;
  }

  return (
    <header className="bg-white shadow-soft sticky top-0 z-40 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20"> {/* Altura aumentada para 80px (h-20) conforme design implícito */}

          {/* Lado Esquerdo: Logo/Título e Seletor de Contexto */}
          <div className="flex items-center gap-6"> {/* Espaçamento (gap-6) de 24px */}
            {/* Título do Sistema */}
            <span className="text-2xl font-bold text-[#4A90E2]"> {/* H1 (24px Bold) e primary-blue */}
              Lanchonete Pão do Céu
            </span>

            {/* Seletor de Contexto */}
            <nav className="hidden md:flex items-center p-1 bg-gray-100 rounded-xl"> {/* Fundo do container dos botões */}
              {visibleContexts.map((context) => (
                <ContextButton
                  key={context}
                  label={context.charAt(0) + context.slice(1).toLowerCase()} // "VENDAS" -> "Vendas"
                  context={context}
                  activeContext={activeContext}
                  onClick={setActiveContext}
                />
              ))}
            </nav>
          </div>

          {/* Lado Direito: Usuário e Logout */}
          <div className="flex items-center gap-4">
            {/* Informação do Usuário */}
            <div className="flex items-center gap-2 text-right">
              <div className="hidden sm:block">
                <p className="font-semibold text-sm text-[#333333]"> {/* text-primary */}
                  {usuario.nome}
                </p>
                <p className="text-xs text-[#666666]"> {/* text-secondary */}
                  {usuario.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Atendente'}
                </p>
              </div>
              <div className="p-2 bg-gray-100 rounded-full text-gray-600">
                <User size={20} />
              </div>
            </div>

            {/* Botão de Logout */}
            <button
              onClick={logout}
              className="flex items-center justify-center p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              aria-label="Sair da conta"
            >
              <LogOut size={20} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
});

export { Header };
