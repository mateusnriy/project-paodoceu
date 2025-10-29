// frontend/src/pages/Register.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { CloudIcon, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast'; // Correção B.1
import { Button } from '../components/common/Button';
import { FormInput } from '../components/admin/components/FormElements';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { authService } from '../services/authService'; // Correção B.3
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils/errors';
import { logError } from '../utils/logger';
import { RegisterPayload } from '../types'; // Usar tipo específico

// Interface para dados do formulário local
interface RegisterFormData {
  nome: string;
  email: string;
  senha: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth(); // Usado para login automático após registro do admin
  const { register, handleSubmit, formState: { errors: formErrors } } = useForm<RegisterFormData>();

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);
  const [isFirstUser, setIsFirstUser] = useState(false);

  // Verifica se é o primeiro usuário ao montar
  const checkFirstUser = useCallback(async () => {
    setIsLoadingCheck(true);
    setApiError(null);
    try {
      // Correção B.3: Usar authService
      const { hasMaster } = await authService.checkFirstUser();
      setIsFirstUser(!hasMaster); // Se NÃO tem master, é o primeiro usuário
    } catch (err) {
      logError('Erro crítico ao verificar primeiro usuário', err);
      setApiError('Falha ao verificar o estado do sistema. Tente recarregar a página.');
    } finally {
      setIsLoadingCheck(false);
    }
  }, []);

  useEffect(() => {
    checkFirstUser();
  }, [checkFirstUser]);

  // Handler de submit
  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      // Prepara payload correto para o serviço
      const payload: RegisterPayload = {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
      };
      // Correção B.3: Usar authService
      const { usuario, message, token } = await authService.register(payload);

      if (token && usuario) { // Primeiro usuário (Admin Master) foi criado e logado
        setAuthData(usuario); // Loga o usuário no contexto
        toast.success(message || 'Administrador Master criado com sucesso!'); // Correção B.1
        navigate('/vendas', { replace: true });
      } else if (message) { // Usuário normal (Atendente) criado, precisa de ativação
        toast.success(message); // Correção B.1
        navigate('/login', { replace: true }); // Redireciona para login
      } else {
         // Cenário inesperado
         throw new Error("Resposta inesperada do servidor após registro.");
      }

    } catch (err) {
      logError('Erro durante o registro do usuário:', err, { email: data.email });
      const errorMsg = getErrorMessage(err);
      setApiError(errorMsg);
      toast.error(`Erro no registro: ${errorMsg}`); // Correção B.1
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderização de Loading e da Página (mantida, mas usando toast agora)
  // ... (código JSX similar ao original, mas com toast em vez de apenas setApiError)

  // Exemplo de retorno simplificado:
  return (
      <div> {/* Container principal */}
          <h1>{isFirstUser ? 'Criar Admin Master' : 'Criar Conta Atendente'}</h1>
          <form onSubmit={handleSubmit(onSubmit)}>
              {/* Campos FormInput como no original */}
              <FormInput id="nome" label="Nome" {...register('nome', { required: 'Nome obrigatório' })} error={formErrors.nome?.message} disabled={isSubmitting || isLoadingCheck} />
              <FormInput id="email" label="Email" type="email" {...register('email', { required: 'Email obrigatório', pattern: /.../ })} error={formErrors.email?.message} disabled={isSubmitting || isLoadingCheck} />
              <FormInput id="senha" label="Senha" type="password" {...register('senha', { required: 'Senha obrigatória', minLength: 6 })} error={formErrors.senha?.message} disabled={isSubmitting || isLoadingCheck} />

              {apiError && <ErrorMessage message={apiError} />}

              <Button type="submit" disabled={isSubmitting || isLoadingCheck}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Criar Conta'}
              </Button>
          </form>
          {!isFirstUser && <p>Já tem conta? <Link to="/login">Login</Link></p>}
      </div>
  );
};

export default Register;
