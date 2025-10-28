import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Usuario, AuthUsuario, LoginPayload, RegisterPayload } from '../types';
import api from '../services/api';
import { logError } from '../utils/logger';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface AuthContextProps {
  isAuthenticated: boolean;
  usuario: AuthUsuario | null;
  isLoadingAuth: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// (SEG-01) Removemos toda a manipulação de localStorage para o TOKEN.
// O cookie HttpOnly é a única fonte da verdade.

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [usuario, setUsuario] = useState<AuthUsuario | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Inicia true
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useMemo(() => !!usuario, [usuario]);

  // (SEG-01) Função interna para definir o estado do usuário
  const setAuthData = useCallback((authUsuario: AuthUsuario | null) => {
    setUsuario(authUsuario);
    // (localStorage.setItem/removeItem(TOKEN_KEY) REMOVIDO)
    // (api.defaults.headers.common['Authorization'] REMOVIDO)
  }, []);

  // (SEG-01) Verifica o status da autenticação no carregamento
  const checkAuthStatus = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      // Usamos a nova rota GET /api/auth/me (que usa o cookie)
      const response = await api.get<AuthUsuario>('/api/auth/me');
      setAuthData(response.data);
    } catch (error) {
      logError('checkAuthStatus falhou (usuário não logado)', error);
      setAuthData(null);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [setAuthData]);

  useEffect(() => {
    // Verifica o status apenas uma vez no carregamento do App
    checkAuthStatus();
  }, [checkAuthStatus]);


  // Efeito para redirecionamento (lógica original mantida)
  useEffect(() => {
    if (!isLoadingAuth) {
      const publicRoutes = ['/login', '/register', '/display'];
      const isPublicRoute = publicRoutes.some((route) =>
        location.pathname.startsWith(route),
      );

      if (isAuthenticated && isPublicRoute) {
        navigate('/vendas'); // Redireciona logado
      } else if (!isAuthenticated && !isPublicRoute) {
        navigate('/login'); // Redireciona deslogado
      }
    }
  }, [isAuthenticated, isLoadingAuth, location.pathname, navigate]);


  // --- Funções de API ---

  const login = async (payload: LoginPayload) => {
    // O backend agora define o cookie
    const { data } = await api.post<{ usuario: AuthUsuario }>(
      '/api/auth/login',
      payload,
    );
    // Apenas definimos o usuário no estado
    setAuthData(data.usuario);
    navigate('/vendas');
  };

  const register = async (payload: RegisterPayload) => {
    // (Lógica original de check-first mantida)
    const { data: checkData } = await api.get<{ hasAdmin: boolean }>(
      '/api/auth/check-first',
    );
    
    const perfil = checkData.hasAdmin ? 'ATENDENTE' : 'ADMINISTRADOR';

    // O backend define o cookie
    const { data } = await api.post<{ usuario: AuthUsuario }>(
      '/api/auth/register',
      { ...payload, perfil },
    );
    setAuthData(data.usuario);
    navigate('/vendas');
  };

  // (SEG-01) Logout agora chama o backend
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      logError('Falha ao deslogar no backend', error);
      // Continua o logout no frontend mesmo se falhar
    } finally {
      setAuthData(null);
      navigate('/login');
    }
  }, [setAuthData, navigate]);


  // Se estiver carregando, exibe um spinner global
  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <LoadingSpinner className="h-12 w-12" />
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

