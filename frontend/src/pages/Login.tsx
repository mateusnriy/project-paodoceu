import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // <<< Importa o componente Link
import { CloudIcon, Loader2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/errors';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { FormInput } from '../components/admin/components/FormElements'; // Reutiliza FormInput

const Login: React.FC = () => {
  const { login } = useAuth(); // Hook de autenticação
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Estado de carregamento para o botão

  /**
   * Handler para submissão do formulário de login.
   * @param {React.FormEvent} e - Evento de submissão do formulário.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previne o comportamento padrão do formulário
    setError(null); // Limpa erros anteriores

    // Validação simples de campos vazios
    if (!email || !password) {
      setError('Por favor, preencha o email e a senha.');
      return;
    }

    setIsLoading(true); // Ativa o estado de carregamento
    try {
      // Chama a função de login do AuthContext
      await login(email, password);
      // A navegação para '/vendas' ocorre dentro da função 'login' do contexto em caso de sucesso
    } catch (err) {
      // Captura e exibe erros de autenticação (ex: credenciais inválidas)
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false); // Desativa o estado de carregamento
    }
  };

  return (
    // Container principal que centraliza o conteúdo
    <div className="min-h-screen bg-background-light-blue flex flex-col items-center justify-center p-4">
      {/* Card de Login */}
      <div className="w-full max-w-md bg-primary-white rounded-xl shadow-soft p-8 border border-gray-200">
        {/* Cabeçalho com ícone e título */}
        <div className="flex flex-col items-center mb-8">
          <CloudIcon className="h-16 w-16 text-primary-blue mb-4" />
          <h1 className="text-2xl font-bold text-text-primary text-center">
            Lanchonete Pão do Céu
          </h1>
           <p className="text-base text-text-secondary mt-2">Acesse sua conta</p>
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exibe mensagem de erro, se houver */}
          {error && <ErrorMessage message={error} />}

          {/* Campo Email - Reutilizando FormInput */}
          <FormInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu email"
            disabled={isLoading}
            autoComplete="email" // Ajuda navegadores a preencher
            // Não usamos react-hook-form aqui, então não passamos 'register' ou 'errors'
          />

          {/* Campo Senha - Reutilizando FormInput */}
          <FormInput
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            disabled={isLoading}
            autoComplete="current-password" // Ajuda navegadores a preencher
          />

          {/* Botão de Login */}
          <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isLoading}>
            {/* Mostra spinner ou texto dependendo do estado de carregamento */}
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
          </Button>
        </form>

        {/* Link para a página de Registro */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Não tem uma conta?{' '}
          {/* Componente Link do react-router-dom para navegação SPA */}
          <Link to="/register" className="font-medium text-primary-blue hover:underline focus:outline-none focus:ring-2 focus:ring-primary-blue rounded">
            Crie uma agora
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login; // Exporta como default
