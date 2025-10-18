import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import axios from 'axios';
import { Usuario } from '../types'; // Importando do barrel file

/**
 * @interface AuthContextData
 * @description Define a estrutura de dados e funções expostas pelo AuthContext.
 */
interface AuthContextData {
  /** Indica se o usuário está autenticado (true) ou não (false). */
  isAuthenticated: boolean;
  /**
   * @deprecated Use `isLoadingAuth` em vez de `isAuthenticated` para verificar o estado inicial.
   * `isLoadingAuth` é true enquanto o token está sendo validado no localStorage.
   */
  isLoadingAuth: boolean;
  /** O objeto do usuário logado, ou null se não estiver logado. */
  usuario: Usuario | null;
  /** O token JWT de autenticação, ou null. */
  token: string | null;
  /**
   * @function login
   * @description Autentica o usuário na API e armazena o token e os dados do usuário.
   * @param email O email do usuário.
   * @param senha A senha do usuário.
   * @throws {Error} Lança um erro se o login falhar.
   */
  login: (email: string, senha: string) => Promise<void>;
  /**
   * @function logout
   * @description Desloga o usuário, limpa o localStorage e redireciona para a tela de login.
   */
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/**
 * @provider AuthProvider
 * @description Provedor de contexto que gerencia o estado de autenticação da aplicação.
 * Lida com login, logout e validação inicial do token armazenado.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Inicia como true para bloquear a renderização de rotas protegidas
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const navigate = useNavigate();

  /**
   * @effect
   * Valida o token e os dados do usuário armazenados no localStorage
   * na inicialização da aplicação.
   */
  useEffect(() => {
    const loadAuthData = async () => {
      setIsLoadingAuth(true);
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('usuario');

        if (storedToken && storedUser) {
          // Configura a API para usar o token em requisições futuras
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          // Idealmente, deveríamos validar o token aqui com um endpoint /auth/validate
          
          setToken(storedToken);
          setUsuario(JSON.parse(storedUser));
        } else {
          // Garante que o estado esteja limpo se não houver dados
          setToken(null);
          setUsuario(null);
          delete api.defaults.headers.common['Authorization'];
        }
      } catch (error) {
        console.error('Falha ao carregar dados de autenticação:', error);
        // Limpa dados corrompidos ou inválidos do localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setToken(null);
        setUsuario(null);
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setIsLoadingAuth(false); // Libera o carregamento da aplicação
      }
    };

    loadAuthData();
  }, []); // Executa apenas uma vez

  /**
   * @function login
   * Implementação da função de login.
   */
  const login = async (email: string, senha: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token: newToken, usuario: newUsuario } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('usuario', JSON.stringify(newUsuario));

      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUsuario(newUsuario);

      // Redireciona para /vendas (novo padrão) após o login
      navigate('/vendas');
    } catch (error) {
      console.error('Erro no login:', error);
      // Garante que o estado seja limpo em caso de falha
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setToken(null);
      setUsuario(null);
      delete api.defaults.headers.common['Authorization'];
      
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Erro ao tentar fazer login.'
        );
      }
      throw new Error('Erro desconhecido no login.');
    }
  };

  /**
   * @function logout
   * Implementação da função de logout.
   * Memoizada com useCallback para estabilidade.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
    delete api.defaults.headers.common['Authorization'];
    
    // Redireciona para a raiz (que redireciona para /login)
    if (window.location.pathname !== '/login') {
      navigate('/login');
    }
  }, [navigate]);

  /**
   * @memo contextValue
   * Memoiza o valor do contexto para evitar re-renderizações desnecessárias
   * nos consumidores do contexto.
   */
  const contextValue = useMemo(
    () => ({
      isAuthenticated: !!token,
      isLoadingAuth,
      token,
      usuario,
      login,
      logout,
    }),
    [token, isLoadingAuth, usuario, logout] // 'login' não é memoizado, mas raramente muda
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {/*
       * REFATORAÇÃO (Commit 4.1):
       * A lógica de '!isLoadingAuth' foi REMOVIDA daqui.
       * O Provider DEVE renderizar os children (incluindo rotas públicas como /login)
       * A lógica de exibir <LoadingSpinner /> é responsabilidade
       * do <ProtectedRoute> ou <MainLayout>, não do Provider.
       */}
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @hook useAuth
 * @description Hook customizado para consumir o AuthContext.
 * @returns {AuthContextData} O estado e as funções de autenticação.
 */
export const useAuth = (): AuthContextData => useContext(AuthContext);
