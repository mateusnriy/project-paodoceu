import React, { useState } from 'react';
import { CloudIcon, Loader2 } from 'lucide-react'; // Importa Loader2
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/errors';
import { ErrorMessage } from '../components/ui/ErrorMessage';

/**
 * REFATORAÇÃO (Hotfix):
 * - Corrigido 'export const Login' para 'export default Login'.
 * - Aplicados os novos tokens do Design System (primary-blue, text-primary, rounded-lg).
 * - Componente 'Button' refatorado.
 * - Adicionado 'Loader2' ao botão de login.
 */

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Renomeado para 'isLoading'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Navegação ocorre dentro do 'login' no contexto
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Fundo usa 'background-light-blue' (aplicado via bg-gray-50 no body, mas podemos forçar aqui)
    <div className="min-h-screen bg-background-light-blue flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-primary-white rounded-xl shadow-soft p-8"> {/* rounded-xl (12px) */}
        
        <div className="flex flex-col items-center mb-8">
          <CloudIcon className="h-16 w-16 text-primary-blue mb-4" /> {/* text-primary-blue */}
          <h1 className="text-2xl font-bold text-text-primary text-center"> {/* text-2xl (H1), text-primary */}
            Lanchonete Pão do Céu
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <ErrorMessage message={error} />}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary"> {/* text-sm, text-secondary */}
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full px-4 py-3 rounded-lg border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue
              " // rounded-lg (8px), focus
              placeholder="Digite seu email"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full px-4 py-3 rounded-lg border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue
              " // rounded-lg (8px), focus
              placeholder="Digite sua senha"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login; // <<< CORREÇÃO: Adicionando export default
