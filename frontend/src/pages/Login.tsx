// frontend/src/pages/Login.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom'; // (Causa 10: Link removido)
import { useAuth } from '@/contexts/AuthContext';
import {
  loginSchema,
  LoginFormData,
} from '@/validations/auth.schema.ts';
import { Button } from '@/components/common/Button';
import { getErrorMessage } from '@/utils/errors';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Lock, Mail } from 'lucide-react';

export function Login() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setGlobalError(null);
    try {
      await login(data);
    } catch (error) {
      setGlobalError(getErrorMessage(error));
    }
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Pão do Céu
        </h1>
        <h2 className="mb-6 text-center text-xl text-gray-600">
          Acesso ao PDV
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {globalError && <ErrorMessage message={globalError} />}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              E-mail
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`w-full rounded-md border p-3 pl-10 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:border-indigo-500 focus:ring-indigo-500`}
                placeholder="seu.email@exemplo.com"
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <ErrorMessage message={errors.email.message} />
            )}
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="senha"
                type="password"
                {...register('senha')}
                className={`w-full rounded-md border p-3 pl-10 ${
                  errors.senha ? 'border-red-500' : 'border-gray-300'
                } focus:border-indigo-500 focus:ring-indigo-500`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {errors.senha && (
              <ErrorMessage message={errors.senha.message} />
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            variant="primary"
            size="lg"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 border-t pt-6">
          <p className="text-center text-sm text-gray-600">
            Não tem uma conta de Administrador?
          </p>
          <Button
            onClick={handleRegisterRedirect}
            variant="secondary" // (Correção: variant "outline" não existe)
            className="mt-4 w-full"
            disabled={isSubmitting}
          >
            Registrar Administrador
          </Button>
        </div>
      </div>
    </div>
  );
}
