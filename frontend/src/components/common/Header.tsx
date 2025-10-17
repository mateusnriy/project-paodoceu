import { useEffect, useState, memo } from 'react'; // React removido
import { CloudIcon, LogOutIcon, UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  showLogout?: boolean;
}

export const Header = memo<HeaderProps>(({ showLogout = true }) => {
  const { usuario, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentTime(timeString);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-white shadow-soft px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <CloudIcon className="text-primary h-8 w-8" />
        <span className="text-accent font-medium text-lg hidden sm:inline-block">
          Lanchonete Pão do Céu
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-600">{currentTime}</span>
        {showLogout && usuario && (
          <div className="flex items-center gap-2">
            <UserIcon className="text-gray-600 h-5 w-5" />
            <span className="text-gray-600 hidden sm:inline-block">
              {usuario.nome || 'Usuário'}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-gray-600 hover:text-accent transition-colors"
              aria-label="Sair do sistema"
            >
              <span className="hidden sm:inline-block">Sair</span>
              <LogOutIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
});

Header.displayName = 'Header';
