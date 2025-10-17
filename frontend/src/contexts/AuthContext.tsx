import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

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
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar dados do localStorage ao iniciar
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('usuario');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

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
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Erro ao tentar fazer login.');
      }
      throw new Error('Erro desconhecido no login.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
    delete api.defaults.headers.common['Authorization'];
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
