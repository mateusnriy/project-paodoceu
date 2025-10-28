import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { CloudIcon, Loader2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/admin/components/FormElements'; // Reutiliza FormInput da área admin
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { api } from '../services/api'; // Cliente Axios configurado
import { useAuth } from '../contexts/AuthContext'; // Hook de autenticação
import { getErrorMessage } from '../utils/errors'; // Utilitário para mensagens de erro
import { logError } from '../utils/logger'; // Utilitário para logging de erros
import { Usuario } from '../types'; // Importa o tipo Usuario

interface RegisterFormData {
  nome: string;
  email: string;
  senha: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  // Obtém a função setAuthData do contexto para atualizar o estado de autenticação após o registro
  const { setAuthData } = useAuth();
  // Hook `react-hook-form` para gerenciamento do formulário
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<RegisterFormData>();

  // Estados locais do componente
  const [apiError, setApiError] = useState<string | null>(null); // Mensagem de erro da API
  const [isSubmitting, setIsSubmitting] = useState(false); // Indica se o formulário está sendo enviado
  const [isLoadingCheck, setIsLoadingCheck] = useState(true); // Indica se a verificação inicial está ocorrendo
  const [isFirstUser, setIsFirstUser] = useState(false); // Indica se este será o primeiro usuário

  const checkFirstUser = useCallback(async () => {
    setIsLoadingCheck(true);
    setApiError(null); // Limpa erros anteriores
    try {
      const response = await api.get<{ isFirst: boolean }>('/auth/check-first');
      setIsFirstUser(response.data.isFirst);
      if (!response.data.isFirst) {
        // Se NÃO for o primeiro usuário e tentarem acessar /register diretamente,
        // mas já existirem usuários, é um cenário inesperado (talvez acesso direto via URL).
        // Poderíamos redirecionar para login, mas por segurança, apenas informamos no log.
        // O AuthContext também fará uma verificação e redirecionará se necessário.
         console.log("Verificação inicial: Não é o primeiro usuário.");
      }
    } catch (err) {
      logError('Erro crítico ao verificar primeiro usuário', err);
      // Define um erro crítico que impede o registro
      setApiError('Falha ao verificar o estado do sistema. Não é possível criar conta no momento.');
      // Mantém isLoadingCheck como true ou false dependendo se quer bloquear a UI
    } finally {
      setIsLoadingCheck(false); // Finaliza o estado de carregamento da verificação
    }
  }, []); // Sem dependências, executa apenas uma vez

  // Executa a verificação ao montar o componente
  useEffect(() => {
    checkFirstUser();
  }, [checkFirstUser]);

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setApiError(null); // Limpa erros anteriores
    setIsSubmitting(true); // Ativa o estado de envio
    try {
      // Envia os dados para a rota de registro no backend
      const response = await api.post<{ token: string; usuario: Usuario }>('/auth/register', data);
      const { token, usuario } = response.data;

      // Se o registro for bem-sucedido, atualiza o estado de autenticação global
      // Isso armazena o token/usuário no localStorage e no estado do AuthContext
      setAuthData(token, usuario);

      // Log para indicar o tipo de conta criada
      logError(`Usuário registrado: ${usuario.email}, Perfil: ${usuario.perfil}`);

      // Redireciona o usuário para a tela principal de vendas
      // 'replace: true' impede que o usuário volte para a tela de registro pelo botão "voltar" do navegador
      navigate('/vendas', { replace: true });

    } catch (err) {
      // Em caso de erro da API (ex: email duplicado)
      logError('Erro durante o registro do usuário:', err, { email: data.email });
      setApiError(getErrorMessage(err)); // Exibe a mensagem de erro formatada
    } finally {
      setIsSubmitting(false); // Desativa o estado de envio
    }
  };

  // Se ainda estiver verificando se é o primeiro usuário, exibe um spinner
  if (isLoadingCheck) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light-blue">
        <Loader2 size={40} className="animate-spin text-primary-blue" />
        <p className="ml-4 text-text-secondary">Verificando sistema...</p>
      </div>
    );
  }

  // Renderiza a página de registro
  return (
    <div className="min-h-screen bg-background-light-blue flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-primary-white rounded-xl shadow-soft p-8 border border-gray-200">
        <div className="flex flex-col items-center mb-8">
          <CloudIcon className="h-16 w-16 text-primary-blue mb-4" />
          <h1 className="text-2xl font-bold text-text-primary text-center">
            {isFirstUser ? 'Criar Conta de Administrador' : 'Criar Nova Conta'}
          </h1>
          {isFirstUser && (
             <p className="text-sm text-text-secondary mt-2 text-center px-4">
               Como este é o primeiro acesso, esta conta terá permissões de administrador.
             </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Exibe erro da API, se houver */}
          {apiError && <ErrorMessage message={apiError} />}

          <FormInput
            id="nome"
            label="Nome Completo"
            // Registra o campo com react-hook-form, definindo validação 'required'
            {...register('nome', { required: 'O nome é obrigatório' })}
            // Exibe mensagem de erro específica do campo, se houver
            error={formErrors.nome?.message}
            // Desabilita o campo durante o envio
            disabled={isSubmitting || !!apiError} // Desabilita também se houve erro crítico na verificação
            autoFocus // Foco automático no primeiro campo
            autoComplete="name" // Ajuda navegadores a preencher
            placeholder="Seu nome completo"
          />

          <FormInput
            id="email"
            label="Email"
            type="email"
            // Registra o campo com validação 'required' e 'pattern' para formato de email
            {...register('email', {
              required: 'O email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Formato de email inválido',
              },
            })}
            error={formErrors.email?.message}
            disabled={isSubmitting || !!apiError}
            autoComplete="email"
            placeholder="seuemail@exemplo.com"
          />

          <FormInput
            id="senha"
            label="Senha"
            type="password"
            // Registra o campo com validação 'required' e 'minLength'
            {...register('senha', {
              required: 'A senha é obrigatória',
              minLength: { value: 6, message: 'A senha deve ter no mínimo 6 caracteres' },
            })}
            error={formErrors.senha?.message}
            disabled={isSubmitting || !!apiError}
            autoComplete="new-password" // Indica ao navegador que é um campo de nova senha
            placeholder="Mínimo 6 caracteres"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2" // Adiciona margem acima
            size="lg" // Botão grande
            // Desabilita durante o envio ou se houve erro crítico na verificação
            disabled={isSubmitting || !!apiError}
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Criar Conta'}
          </Button>
        </form>

        {!isFirstUser && (
          <p className="mt-6 text-center text-sm text-text-secondary">
            Já possui uma conta?{' '}
            <Link to="/login" className="font-medium text-primary-blue hover:underline focus:outline-none focus:ring-2 focus:ring-primary-blue rounded">
              Faça login aqui
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

// Exporta o componente como default para lazy loading no AppRouter
export default Register;
