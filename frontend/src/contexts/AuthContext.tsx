// frontend/src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthUsuario, LoginPayload, RegisterPayload } from '@/types'; // CORRIGIDO
import { authService } from '@/services/authService'; // CORRIGIDO
import { logError } from '@/utils/logger'; // CORRIGIDO
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'; // CORRIGIDO
import { getErrorMessage } from '@/utils/errors'; // CORRIGIDO
import { toast } from 'react-hot-toast';

interface AuthContextProps {
  isAuthenticated: boolean;
  usuario: AuthUsuario | null;
  isLoadingAuth: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (
    payload: Omit<RegisterPayload, 'perfil' | 'ativo'>,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [usuario, setUsuario] = useState<AuthUsuario | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useMemo(() => !!usuario, [usuario]);

  const setAuthData = useCallback((authUsuario: AuthUsuario | null) => {
    setUsuario(authUsuario);
  }, []);

  const checkAuthStatus = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setAuthData(currentUser);
    } catch (error) {
      logError('checkAuthStatus falhou (usuário não logado)', error);
      setAuthData(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [setAuthData]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Efeito para redirecionamento
  useEffect(() => {
    if (!isLoadingAuth) {
      const publicRoutes = ['/login', '/register', '/display'];
      const isPublicRoute = publicRoutes.some((route) =>
        location.pathname.startsWith(route),
      );

      if (
        isAuthenticated &&
        isPublicRoute &&
        location.pathname !== '/display'
      ) {
        navigate('/vendas', { replace: true });
      } else if (!isAuthenticated && !isPublicRoute) {
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoadingAuth, location.pathname, navigate]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      try {
        const loggedUser = await authService.login(payload);
        setAuthData(loggedUser);
        navigate('/vendas', { replace: true });
      } catch (error) {
        logError('Falha no Login:', error, payload);
        toast.error(`Falha no login: ${getErrorMessage(error)}`);
        throw error;
      }
    },
    [setAuthData, navigate],
  );

  const register = useCallback(
    async (payload: Omit<RegisterPayload, 'perfil' | 'ativo'>) => {
      try {
        const { usuario: registeredUser, message } =
          await authService.register(payload);

        // O backend (authService.register) agora lida com os 2 casos:
        // 1. Primeiro usuário (Master): retorna 'usuario' e 'message' -> loga
        // 2. Usuário normal (Atendente): retorna SÓ 'message' -> não loga
        
        if (registeredUser && registeredUser.id) {
          // Caso 1: Primeiro usuário (MASTER)
          setAuthData(registeredUser);
          toast.success(message || 'Administrador Master criado com sucesso!');
          navigate('/vendas', { replace: true });
        } else if (message) {
          // Caso 2: Usuário normal (ATENDENTE)
          toast.success(message);
          navigate('/login', { replace: true }); // Redireciona para login
        } else {
          throw new Error('Resposta inesperada do servidor após registro.');
        }
      } catch (error) {
        logError('Falha no Registro:', error, { email: payload.email });
        toast.error(`Falha no registro: ${getErrorMessage(error)}`);
        throw error;
      }
    },
    [setAuthData, navigate],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      logError('Falha ao deslogar no backend:', error);
    } finally {
      setAuthData(null);
      navigate('/login', { replace: true });
    }
  }, [setAuthData, navigate]);

  if (isLoadingAuth && location.pathname !== '/display') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        usuario,
        isLoadingAuth,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
