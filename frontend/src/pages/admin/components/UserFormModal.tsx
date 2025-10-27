// src/pages/admin/components/UserFormModal.tsx
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Usuario, PerfilUsuario, UsuarioFormData } from '../../../types';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getErrorMessage } from '../../../utils/errors';
import { ModalWrapper } from './ModalWrapper';
import { FormInput, FormSelect } from './FormElements';
import { Loader2 } from 'lucide-react';

interface UserFormInputs extends UsuarioFormData {}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserFormInputs, id?: string) => Promise<Usuario | void>;
  usuario: Usuario | null;
  isLoading: boolean;
  error: unknown; // <<< CORRIGIDO: Aceita unknown
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  usuario,
  isLoading,
  error, // <<< (mutationError)
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormInputs>();

  const isEditing = !!usuario;
  
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { 
      if (usuario) {
        reset({
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          senha: '', 
        });
      } else {
        reset({
          nome: '',
          email: '',
          perfil: PerfilUsuario.ATENDENTE,
          senha: '',
        });
      }
      setApiError(null); 
    }
  }, [usuario, reset, isOpen]);

  useEffect(() => {
    // CORREÇÃO: Converte 'unknown' para string de erro
    setApiError(error ? getErrorMessage(error) : null);
  }, [error]);

  const onSubmit: SubmitHandler<UserFormInputs> = async (data) => {
    setApiError(null); 
    const dataToSend = { ...data };
    if (isEditing && !data.senha) {
      delete dataToSend.senha;
    }
    
    try {
      await onSave(dataToSend, usuario?.id);
    } catch (err) {
      // Erro já está sendo tratado pela prop 'error'
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Usuário' : 'Novo Usuário'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"> 
        
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
            required: !isEditing ? 'A senha é obrigatória' : false,
            validate: (value) => 
              (!value || value.length >= 6) || 'A senha deve ter no mínimo 6 caracteres',
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

        {apiError && <ErrorMessage message={apiError} />}

        <div className="flex justify-end gap-4 pt-4"> 
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
