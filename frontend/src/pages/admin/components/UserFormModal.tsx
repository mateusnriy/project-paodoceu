import React, { useEffect, useState } from 'react'; // <<< Adicionado useState
import { useForm, SubmitHandler } from 'react-hook-form';
import { Usuario, PerfilUsuario, UsuarioFormData } from '../../../types'; // <<< Adicionado UsuarioFormData
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getErrorMessage } from '../../../utils/errors';
import { ModalWrapper } from './ModalWrapper';
import { FormInput, FormSelect } from './FormElements';
import { Loader2 } from 'lucide-react';

// Define os inputs do formulário
// <<< CORREÇÃO: Usando UsuarioFormData >>>
interface UserFormInputs extends UsuarioFormData {}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // <<< CORREÇÃO: onSave agora pode retornar Promise<Usuario> ou Promise<void> >>>
  onSave: (data: UserFormInputs, id?: string) => Promise<Usuario | void>;
  usuario: Usuario | null;
  // <<< CORREÇÃO: Renomeado para isMutating e mutationError >>>
  isLoading: boolean; // Renomeado para isLoading no modal (vem de isMutating)
  error: unknown;     // Renomeado para error no modal (vem de mutationError)
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  usuario,
  isLoading, // <<< (isMutating)
  error,     // <<< (mutationError)
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormInputs>();

  const isEditing = !!usuario;
  
  // <<< CORREÇÃO: Adicionado estado de erro local >>>
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { // <<< Adicionado cheque isOpen
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
      setApiError(null); // Limpa erro ao abrir
    }
  }, [usuario, reset, isOpen]); // <<< Adicionado isOpen

  // <<< CORREÇÃO: Sincroniza erro da prop com o estado local >>>
  useEffect(() => {
    setApiError(error ? getErrorMessage(error) : null);
  }, [error]);

  const onSubmit: SubmitHandler<UserFormInputs> = async (data) => {
    setApiError(null); // Limpa antes de tentar
    const dataToSend = { ...data };
    if (isEditing && !data.senha) {
      delete dataToSend.senha;
    }
    
    try {
      await onSave(dataToSend, usuario?.id);
      // O fechamento agora é feito no componente pai (AdminUsers)
      // if (!error) { // 'error' pode não estar atualizado ainda
      //   onClose();
      // }
    } catch (err) {
      // Erro é pego e setado pelo hook pai, atualizando 'error' (prop)
      // setApiError(getErrorMessage(err)); // Não precisa mais
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
            // Senha não é obrigatória na edição
            required: !isEditing ? 'A senha é obrigatória' : false,
            // Valida minLength apenas se a senha for digitada
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

        {/* <<< CORREÇÃO: Usando apiError local >>> */}
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
