// frontend/src/contexts/AuthContext.tsx

/**
 * @file AuthContext.tsx
 * @description Provedor de Contexto React para gerenciamento do estado de autenticação.
 * Lida com login, logout, registro (indireto via setAuthData),
 * persistência de dados no localStorage e verificação inicial do estado do sistema (primeiro usuário).
 */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Importa useLocation
import { api } from '../services/api';
import axios, { AxiosError } from 'axios'; // Importa AxiosError para tipagem
import { Usuario } from '../types';
import { logError } from '../utils/logger'; // Importa logger

/**
 * @interface AuthContextData
 * @description Define a estrutura de dados e funções expostas pelo AuthContext.
 */
interface AuthContextData {
  /** Indica se o usuário está autenticado (baseado na presença do token). */
  isAuthenticated: boolean;
  /** Indica se a verificação inicial de autenticação e estado do sistema está em andamento. */
  isLoadingAuth: boolean;
  /** O objeto do usuário logado, ou null se não estiver logado. */
  usuario: Usuario | null;
  /** O token JWT de autenticação, ou null. */
  token: string | null;
  /**
   * @function login
   * @description Autentica o usuário na API.
   * @param email O email do usuário.
   * @param senha A senha do usuário.
   * @throws {AuthError} Lança um erro customizado em caso de falha na autenticação.
   */
  login: (email: string, senha: string) => Promise<void>;
  /**
   * @function logout
   * @description Desloga o usuário, limpa os dados de autenticação e redireciona para login.
   */
  logout: () => void;
  /**
   * @function setAuthData
   * @description Função interna (exposta pelo contexto) para definir/limpar os dados de autenticação
   * no estado, localStorage e headers da API. Usada após login ou registro bem-sucedido.
   * @param token O novo token JWT, ou null para limpar.
   * @param user O objeto do usuário, ou null para limpar.
   */
  setAuthData: (token: string | null, user: Usuario | null) => void;
}

/**
 * @class AuthError
 * @description Erro customizado para falhas de autenticação.
 */
class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

// Cria o Contexto de Autenticação com um valor padrão inicial
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/**
 * @provider AuthProvider
 * @description Componente Provedor que encapsula a lógica de autenticação.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Estados locais para armazenar os dados de autenticação
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Estado para controlar o carregamento inicial (verificação de token e 'check-first')
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Hooks do react-router-dom para navegação e acesso à localização atual
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * @function setAuthData
   * @description Função memoizada para atualizar o estado de autenticação,
   * o localStorage e os headers padrão do Axios de forma centralizada.
   */
  const setAuthData = useCallback((newToken: string | null, newUsuario: Usuario | null) => {
    if (newToken && newUsuario) {
      // Armazena no localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('usuario', JSON.stringify(newUsuario));
      // Define o header Authorization padrão para futuras requisições Axios
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      logError('AuthData Set:', { userId: newUsuario.id, email: newUsuario.email }); // Usando logError para consistência
    } else {
      // Remove do localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      // Remove o header Authorization padrão
      delete api.defaults.headers.common['Authorization'];
       logError('AuthData Cleared'); // Usando logError para consistência
    }
    // Atualiza os estados locais do React
    setToken(newToken);
    setUsuario(newUsuario);
  }, []); // Sem dependências, a função em si não muda

  /**
   * @effect
   * Executado uma vez na montagem do componente para verificar o estado inicial:
   * 1. Tenta carregar token/usuário do localStorage.
   * 2. Se não houver dados válidos, verifica se é o primeiro acesso (`/auth/check-first`).
   * 3. Redireciona para `/register` (se primeiro acesso) ou `/login` (se não for o primeiro e estiver em `/register`) se necessário.
   * 4. Define `isLoadingAuth` como `false` ao final.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AuthProvider: Iniciando verificação de autenticação...'); // Log de início
      setIsLoadingAuth(true);
      let needsRedirect = false; // Flag para controlar se um redirecionamento foi feito
      let targetPath = ''; // Caminho para redirecionamento

      try {
        const storedToken = localStorage.getItem('token');
        const storedUserJson = localStorage.getItem('usuario');
        let parsedUser: Usuario | null = null;

        // Tenta parsear o usuário do localStorage
        if (storedUserJson) {
          try {
            parsedUser = JSON.parse(storedUserJson);
            // Validação mínima dos dados do usuário
            if (!parsedUser || typeof parsedUser.id !== 'string' || typeof parsedUser.email !== 'string') {
              logError('AuthProvider: Dados de usuário inválidos no localStorage. Limpando.', { storedUserJson });
              parsedUser = null; // Invalida o usuário
            }
          } catch (parseError) {
            logError('AuthProvider: Erro ao parsear usuário do localStorage. Limpando.', parseError);
            parsedUser = null; // Invalida em caso de erro de parse
          }
        }

        // Se temos token E usuário válido, define o estado
        if (storedToken && parsedUser) {
          console.log('AuthProvider: Token e usuário encontrados no localStorage.');
          // TODO: Adicionar validação de token com a API aqui (ex: GET /auth/validate)
          // Se a validação falhar, limparia `storedToken` e `parsedUser` e continuaria como se não houvesse dados.
          setAuthData(storedToken, parsedUser);
          console.log('AuthProvider: Autenticação carregada do localStorage.');
        } else {
          // Se não há token ou usuário válido, limpa tudo e verifica o 'check-first'
          console.log('AuthProvider: Nenhum dado de autenticação válido no localStorage. Verificando primeiro usuário...');
          setAuthData(null, null); // Garante que tudo está limpo

          try {
            const response = await api.get<{ isFirst: boolean }>('/auth/check-first');
            console.log(`AuthProvider: Resposta check-first: ${response.data.isFirst}`);
            if (response.data.isFirst) {
              // É o primeiro usuário, precisa registrar
              if (location.pathname !== '/register') {
                console.log('AuthProvider: Primeiro usuário, redirecionando para /register.');
                targetPath = '/register';
                needsRedirect = true;
              } else {
                 console.log('AuthProvider: Primeiro usuário, já está em /register.');
              }
            } else {
              // Não é o primeiro usuário, precisa fazer login
              // Se estiver na página de registro, redireciona para login
              if (location.pathname === '/register') {
                 console.log('AuthProvider: Não é primeiro usuário, redirecionando de /register para /login.');
                 targetPath = '/login';
                 needsRedirect = true;
              }
              // Se estiver em outra rota pública (ex: /display) ou rota inexistente, não faz nada aqui.
              // Se estiver tentando acessar uma rota protegida, o ProtectedRoute fará o redirect para /login.
               else {
                   console.log(`AuthProvider: Não é primeiro usuário, rota atual: ${location.pathname}. Nenhum redirect necessário aqui.`);
               }
            }
          } catch (checkError) {
            // Falha ao verificar /check-first (API offline?)
            logError('AuthProvider: Falha crítica ao verificar /auth/check-first.', checkError);
            // Tenta redirecionar para login como fallback de segurança, a menos que já esteja lá
            if (location.pathname !== '/login' && location.pathname !== '/register') {
               console.error('AuthProvider: Redirecionando para /login devido a erro em check-first.');
               targetPath = '/login';
               needsRedirect = true;
            } else {
                 console.error(`AuthProvider: Erro em check-first, mas já está em ${location.pathname}.`);
            }
            // Poderia exibir uma mensagem de erro global aqui
          }
        }
      } catch (error) {
        // Erro inesperado durante o processo inicial
        logError('AuthProvider: Erro inesperado ao inicializar autenticação.', error);
        setAuthData(null, null); // Garante limpeza
        if (location.pathname !== '/login') {
            targetPath = '/login'; // Tenta ir para login como fallback final
            needsRedirect = true;
        }
      } finally {
        // Executa o redirecionamento se necessário, APÓS toda a lógica
        if (needsRedirect && targetPath) {
          navigate(targetPath, { replace: true });
        }
        // Finaliza o estado de carregamento, permitindo a renderização do restante da app
        console.log('AuthProvider: Verificação de autenticação concluída.');
        setIsLoadingAuth(false);
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAuthData, location.pathname, navigate]); // Dependências: setAuthData, location.pathname, navigate

  /**
   * @function login
   * @description Realiza a chamada à API de login e atualiza o estado de autenticação.
   */
  const login = async (email: string, senha: string) => {
    try {
      setIsLoadingAuth(true); // Indica carregamento durante o login
      const response = await api.post<{ token: string; usuario: Usuario }>('/auth/login', { email, senha });
      const { token: newToken, usuario: newUsuario } = response.data;
      setAuthData(newToken, newUsuario); // Atualiza estado e localStorage
      console.log('AuthProvider: Login bem-sucedido, redirecionando para /vendas.');
      navigate('/vendas', { replace: true }); // Redireciona para vendas após login
    } catch (error) {
      logError('AuthProvider: Falha no login:', error);
      setAuthData(null, null); // Limpa dados em caso de falha

      // Lança um erro mais específico para a página de Login tratar
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const message = axiosError.response?.data?.message || 'Erro ao tentar fazer login.';
        const status = axiosError.response?.status || 500;
        throw new AuthError(message, status);
      }
      throw new AuthError('Erro desconhecido durante o login.', 500);
    } finally {
      setIsLoadingAuth(false); // Finaliza o carregamento do login
    }
  };

  /**
   * @function logout
   * @description Limpa os dados de autenticação e redireciona para a página de login.
   */
  const logout = useCallback(() => {
    console.log('AuthProvider: Logout solicitado.');
    setAuthData(null, null); // Limpa estado e localStorage
    // Redireciona para /login, a menos que já esteja lá
    if (window.location.pathname !== '/login') {
       console.log('AuthProvider: Redirecionando para /login após logout.');
      navigate('/login', { replace: true });
    }
  }, [navigate, setAuthData]); // Adiciona setAuthData às dependências

  /**
   * @memo contextValue
   * Memoiza o valor do contexto para otimizar re-renderizações dos componentes consumidores.
   */
  const contextValue = useMemo(
    () => ({
      isAuthenticated: !!token, // Converte a presença do token em booleano
      isLoadingAuth,
      token,
      usuario,
      login,
      logout,
      setAuthData, // Expõe a função para ser usada pelo Register.tsx
    }),
    [token, isLoadingAuth, usuario, logout, setAuthData] // Adiciona setAuthData
  );

  // Renderiza o Provedor do Contexto, passando o valor memoizado
  // Os children (resto da aplicação) só são renderizados após isLoadingAuth ser false
  // A lógica de exibição de spinner foi movida para ProtectedRoute e Register/Login
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @hook useAuth
 * @description Hook customizado para facilitar o consumo do AuthContext.
 * @returns {AuthContextData} O valor atual do contexto de autenticação.
 */
export const useAuth = (): AuthContextData => useContext(AuthContext);
