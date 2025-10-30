import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  registerSchema,
  RegisterFormData,
} from '@/validations/auth.schema.ts'; // CORRIGIDO
import { Button } from '@/components/common/Button';
import { getErrorMessage } from '@/utils/errors';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Lock, Mail, User } from 'lucide-react';

export function Register() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const { register: authRegister } = useAuth(); // Renomeado para evitar conflito

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setGlobalError(null);
    try {
      // O backend/authService espera nome, email, senha (sem confirmarSenha)
      const { confirmarSenha, ...payload } = data;
      await authRegister(payload);
      // O AuthContext cuidará de exibir o toast e redirecionar
    } catch (error) {
      setGlobalError(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Pão do Céu
        </h1>
        <h2 className="mb-6 text-center text-xl text-gray-600">
          Registrar Administrador
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {globalError && <ErrorMessage message={globalError} />}

          <div>
            <label
              htmlFor="nome"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nome Completo
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="nome"
                type="text"
                {...register('nome')}
                className={`w-full rounded-md border p-3 pl-10 ${
                  errors.nome ? 'border-red-500' : 'border-gray-300'
                } focus:border-indigo-500 focus:ring-indigo-500`}
                placeholder="Seu nome"
              />
            </div>
            {errors.nome && <ErrorMessage message={errors.nome.message} />}
          </div>

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
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            {errors.senha && (
              <ErrorMessage message={errors.senha.message} />
            )}
          </div>

          <div>
            <label
              htmlFor="confirmarSenha"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Confirmar Senha
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmarSenha"
                type="password"
                {...register('confirmarSenha')}
                className={`w-full rounded-md border p-3 pl-10 ${
                  errors.confirmarSenha ? 'border-red-500' : 'border-gray-300'
                } focus:border-indigo-500 focus:ring-indigo-500`}
                placeholder="Repita a senha"
              />
            </div>
            {errors.confirmarSenha && (
              <ErrorMessage message={errors.confirmarSenha.message} />
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            variant="primary"
            size="lg"
          >
            {isSubmitting ? 'Registrando...' : 'Registrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
