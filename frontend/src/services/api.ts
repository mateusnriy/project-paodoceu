import axios from 'axios';
import { getErrorMessage } from '../utils/errors';
import { logError } from '../utils/logger';

// (NOVO) Função utilitária para ler um cookie (SEG-02)
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: VITE_API_BASE_URL,
  // (SEG-01) Enviar cookies automaticamente em todas as requisições
  withCredentials: true,
});

// --- Interceptor de Requisição (CSRF) --- (SEG-02)
api.interceptors.request.use(
  (config) => {
    const methodsToProtect = ['post', 'put', 'patch', 'delete'];
    const method = config.method?.toLowerCase();

    if (method && methodsToProtect.includes(method)) {
      const csrfToken = getCookie('csrf-token'); // Nome do cookie (Não-HttpOnly)
      if (csrfToken) {
        // Nome do Header (X-CSRF-Token)
        config.headers['X-CSRF-Token'] = csrfToken;
      } else {
        // Loga o erro, o backend cuidará de rejeitar (403)
        logError('Cookie CSRF (csrf-token) não encontrado pelo interceptor.');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);


// --- Interceptor de Resposta (Tratamento de Erro) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // (SEG-01) Tratamento centralizado de erros de autenticação
    if (error.response?.status === 401) {
      logError('Erro de autenticação (401) detectado. Redirecionando para /login.');
      // Força o redirecionamento se não estiver no login
      if (window.location.pathname !== '/login') {
         window.location.assign('/login');
         // (O AuthContext também tratará, mas isso garante)
      }
    } else if (error.response?.status === 403) {
      logError('Erro de autorização (403) detectado (CSRF ou Role).');
    }

    logError(error);
    return Promise.reject(new Error(getErrorMessage(error)));
  },
);

export default api;

