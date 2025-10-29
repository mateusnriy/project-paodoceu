// frontend/src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
// import { useNavigate, useLocation, Navigate } from 'react-router-dom'; // <<< Navigate removido
import { useNavigate, useLocation } from 'react-router-dom'; // <<< Navigate removido
// import { Usuario, AuthUsuario, LoginPayload, RegisterPayload } from '../types'; // <<< Usuario removido
import { AuthUsuario, LoginPayload, RegisterPayload } from '../types'; // <<< Usuario removido
import { authService } from '../services/authService'; // <<< USAR SERVICE
import { logError } from '../utils/logger';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { getErrorMessage } from '../utils/errors'; // Importar getErrorMessage
import { toast } from 'react-hot-toast'; // Importar toast

interface AuthContextProps {
  isAuthenticated: boolean;
  usuario: AuthUsuario | null;
  isLoadingAuth: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  // register: (payload: RegisterPayload) => Promise<void>; // Assinatura antiga
  register: (payload: Omit<RegisterPayload, 'perfil' | 'ativo'>) => Promise<void>; // Assinatura corrigida
  logout: () => Promise<void>;
  // setAuthData: (usuario: AuthUsuario | null) => void; // Expor se Register precisar
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

  // Função interna para definir o estado do usuário
  const setAuthData = useCallback((authUsuario: AuthUsuario | null) => {
    setUsuario(authUsuario);
  }, []);

  // Verifica o status da autenticação no carregamento
  const checkAuthStatus = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setAuthData(currentUser);
    } catch (error) {
      logError('checkAuthStatus falhou (usuário não logado)', error);
      setAuthData(null); // Limpa o usuário se a verificação falhar
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

      if (isAuthenticated && isPublicRoute && location.pathname !== '/display') {
        navigate('/vendas', { replace: true });
      } else if (!isAuthenticated && !isPublicRoute) {
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoadingAuth, location.pathname, navigate]);


  // --- Funções de API ---

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      const loggedUser = await authService.login(payload);
      setAuthData(loggedUser);
      navigate('/vendas', { replace: true });
    } catch (error) {
        logError('Falha no Login:', error, payload);
        toast.error(`Falha no login: ${getErrorMessage(error)}`);
        // Re-lança o erro para a página de Login tratar (ex: exibir mensagem)
        throw error;
     }
  }, [setAuthData, navigate]);

  // Função de registro corrigida para usar o serviço e tratar a resposta
  const register = useCallback(async (payload: Omit<RegisterPayload, 'perfil' | 'ativo'>) => {
      try {
          // O serviço lida com a lógica de check-first e atribuição de perfil/ativo
          const { usuario: registeredUser, message, token } = await authService.register(payload);

          if (token && registeredUser) { // Primeiro usuário (Admin Master) criado e logado
             setAuthData(registeredUser);
             toast.success(message || 'Administrador Master criado com sucesso!');
             navigate('/vendas', { replace: true });
          } else if (message) { // Usuário normal (Atendente) criado, precisa de ativação
             toast.success(message);
             navigate('/login', { replace: true }); // Redireciona para login
          } else {
             throw new Error("Resposta inesperada do servidor após registro.");
          }
      } catch (error) {
          logError('Falha no Registro:', error, { email: payload.email });
          toast.error(`Falha no registro: ${getErrorMessage(error)}`);
          throw error; // Re-lança para a página de Registro tratar
      }
  }, [setAuthData, navigate]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      logError('Falha ao deslogar no backend (continuando logout local):', error);
    } finally {
      setAuthData(null);
      navigate('/login', { replace: true });
    }
  }, [setAuthData, navigate]);


  if (isLoadingAuth && location.pathname !== '/display') { // Não mostra loading global no display
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
        register, // Função de registro atualizada
        logout,
        // setAuthData, // Não expor diretamente
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
