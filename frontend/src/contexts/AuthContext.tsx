import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react'; // Adicionado useCallback
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import axios from 'axios';

// Tipo para o usuário (omitindo a senha)
interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMINISTRADOR' | 'ATENDENTE';
  ativo: boolean;
}

interface AuthContextData {
  isAuthenticated: boolean;
  isLoadingAuth: boolean; // <<< NOVO: Estado de carregamento da autenticação
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // <<< NOVO: Inicia como true
  const navigate = useNavigate();

  useEffect(() => {
    // Função assíncrona para carregar dados
    const loadAuthData = async () => {
      setIsLoadingAuth(true); // Garante que está carregando
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('usuario');

        if (storedToken && storedUser) {
          // Validar o token chamando um endpoint protegido simples (opcional mas recomendado)
          // Ex: await api.get('/auth/validate-token'); // Endpoint a ser criado no backend

          setToken(storedToken);
          setUsuario(JSON.parse(storedUser));
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          // Limpa qualquer estado residual se não houver dados no localStorage
          setToken(null);
          setUsuario(null);
          delete api.defaults.headers.common['Authorization'];
        }
      } catch (error) {
         // Se a validação do token falhar (ou JSON.parse falhar)
         console.error("Erro ao carregar/validar dados de autenticação:", error);
         localStorage.removeItem('token');
         localStorage.removeItem('usuario');
         setToken(null);
         setUsuario(null);
         delete api.defaults.headers.common['Authorization'];
      } finally {
        setIsLoadingAuth(false); // <<< Finaliza o carregamento
      }
    };

    loadAuthData();
  }, []); // Executa apenas na montagem inicial

  const login = async (email: string, senha: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token: newToken, usuario: newUsuario } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('usuario', JSON.stringify(newUsuario));

      setToken(newToken);
      setUsuario(newUsuario);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      navigate('/pos');
    } catch (error) {
      console.error("Erro no login:", error);
      // Limpa estado em caso de erro no login para garantir consistência
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setToken(null);
      setUsuario(null);
      delete api.defaults.headers.common['Authorization'];
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Erro ao tentar fazer login.');
      }
      throw new Error('Erro desconhecido no login.');
    }
  };

  // Usar useCallback para estabilizar a função logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
    delete api.defaults.headers.common['Authorization'];
    // Redireciona para login apenas se não estiver já lá para evitar loops
    if (window.location.pathname !== '/') {
        navigate('/');
    }
  }, [navigate]); // Adiciona navigate como dependência

  return (
    <AuthContext.Provider value={{
        isAuthenticated: !!token,
        isLoadingAuth, // <<< Passa o estado de loading
        token,
        usuario,
        login,
        logout
      }}>
      {/* Renderiza children apenas quando o carregamento inicial terminar */}
      {!isLoadingAuth ? children : null} {/* <<< ALTERADO: Condicional */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
