import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Usuario, PerfilUsuario } from '../../../types';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getErrorMessage } from '../../../utils/errors';
import { ModalWrapper } from './ModalWrapper';
import { FormInput, FormSelect } from './FormElements';
import { Loader2 } from 'lucide-react';

// Define os inputs do formulário
interface UserFormInputs {
  nome: string;
  email: string;
  senha?: string; // Senha é opcional na edição
  perfil: PerfilUsuario;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserFormInputs, id?: string) => Promise<void>;
  usuario: Usuario | null;
  isLoading: boolean;
  error: unknown;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  usuario,
  isLoading,
  error,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormInputs>();

  const isEditing = !!usuario;

  useEffect(() => {
    if (usuario) {
      reset({
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        senha: '', // Senha sempre vazia ao abrir
      });
    } else {
      reset({
        nome: '',
        email: '',
        perfil: PerfilUsuario.ATENDENTE,
        senha: '',
      });
    }
  }, [usuario, reset]);

  const onSubmit: SubmitHandler<UserFormInputs> = async (data) => {
    // Remove a senha se estiver vazia (não atualiza)
    const dataToSend = { ...data };
    if (isEditing && !data.senha) {
      delete dataToSend.senha;
    }
    
    await onSave(dataToSend, usuario?.id);
    if (!error) {
      onClose();
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Usuário' : 'Novo Usuário'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"> {/* 8px grid */}
        
        <FormInput
          id="nome"
          label="Nome Completo"
          {...register('nome', { required: 'O nome é obrigatório' })}
          error={errors.nome?.message}
          disabled={isLoading}
          autoFocus
        />

        <FormInput
          id="email"
          label="Email"
          type="email"
          {...register('email', {
            required: 'O email é obrigatório',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido',
            },
          })}
          error={errors.email?.message}
          disabled={isLoading}
        />

        <FormInput
          id="senha"
          label={isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
          type="password"
          {...register('senha', {
            required: !isEditing && 'A senha é obrigatória',
            minLength: {
              value: 6,
              message: 'A senha deve ter no mínimo 6 caracteres',
            },
          })}
          error={errors.senha?.message}
          disabled={isLoading}
        />
        
        <FormSelect
          id="perfil"
          label="Perfil de Acesso"
          {...register('perfil', { required: 'O perfil é obrigatório' })}
          error={errors.perfil?.message}
          disabled={isLoading}
        >
          <option value={PerfilUsuario.ATENDENTE}>Atendente</option>
          <option value={PerfilUsuario.ADMINISTRADOR}>Administrador</option>
        </FormSelect>

        {/* Exibição de Erro da API */}
        {error && <ErrorMessage message={getErrorMessage(error)} />}

        {/* Ações do Formulário */}
        <div className="flex justify-end gap-4 pt-4"> {/* 8px grid */}
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};
