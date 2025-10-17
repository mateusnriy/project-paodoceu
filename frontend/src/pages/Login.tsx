import React, { useState } from 'react';
import { CloudIcon } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/errors';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navegação ocorre dentro do 'login' no contexto
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-soft p-8">
        <div className="flex flex-col items-center mb-8">
          <CloudIcon className="h-16 w-16 text-primary mb-4" />
          <h1 className="text-2xl font-bold text-accent text-center">
            Lanchonete Pão do Céu
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ErrorMessage message={error} />
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-4xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Digite seu email"
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-gray-700">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-4xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Digite sua senha"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" color="primary" fullWidth disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
};
