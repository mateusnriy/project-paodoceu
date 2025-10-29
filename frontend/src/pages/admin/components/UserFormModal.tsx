// frontend/src/pages/admin/components/UserFormModal.tsx
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'react-hot-toast'; // Correção B.1
import { Usuario, PerfilUsuario, UsuarioFormData } from '../../../types'; // Tipos já corrigidos
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getErrorMessage } from '../../../utils/errors';
import { ModalWrapper } from './ModalWrapper';
import { FormInput, FormSelect } from './FormElements';
import { Loader2 } from 'lucide-react';

interface UserFormInputs extends Omit<UsuarioFormData, 'ativo'> { // Ativo não está no form
    // Senha é opcional na edição, mas react-hook-form precisa dela definida
    senha?: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UsuarioFormData, id?: string) => Promise<Usuario | void>;
  usuario: Usuario | null; // Usuário sendo editado (null para criar)
  isLoading: boolean; // Estado de mutação (isMutating)
  error: unknown; // Erro da mutação
  perfilUsuarioLogado?: PerfilUsuario; // Correção A.4: Perfil de quem está logado
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  usuario, // Usuário alvo
  isLoading,
  error,
  perfilUsuarioLogado, // Perfil do ator
}) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserFormInputs>();
  const isEditing = !!usuario;
  const [apiError, setApiError] = useState<string | null>(null);

  // Correção A.4: Determina se o admin logado pode alterar o perfil do alvo
  const canEditProfileField = useMemo(() => {
      // Master pode sempre
      if (perfilUsuarioLogado === PerfilUsuario.MASTER) return true;
      // Admin comum não pode editar perfil (backend força ATENDENTE na criação/update)
      if (perfilUsuarioLogado === PerfilUsuario.ADMINISTRADOR) return false;
      return false; // Default seguro
  }, [perfilUsuarioLogado]);

  useEffect(() => {
    if (isOpen) {
      if (usuario) { // Editando
        reset({
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          senha: '', // Senha sempre vazia ao editar
        });
      } else { // Criando
        reset({
          nome: '',
          email: '',
          // Correção A.4: Default é ATENDENTE se o criador for ADMIN
          perfil: perfilUsuarioLogado === PerfilUsuario.ADMINISTRADOR ? PerfilUsuario.ATENDENTE : PerfilUsuario.ATENDENTE,
          senha: '',
        });
      }
      setApiError(null);
    }
  }, [usuario, reset, isOpen, perfilUsuarioLogado]);

  useEffect(() => {
    setApiError(error ? getErrorMessage(error) : null);
  }, [error]);

  const onSubmit: SubmitHandler<UserFormInputs> = async (data) => {
    setApiError(null);
    const dataToSend: UsuarioFormData = {
        ...data,
        // Correção A.4: Garante que Admin Comum só envie perfil ATENDENTE
        perfil: canEditProfileField ? data.perfil : PerfilUsuario.ATENDENTE,
        // Ativo não é gerenciado aqui, backend define default ou mantém
    };

    // Remove senha se estiver editando e campo estiver vazio
    if (isEditing && !data.senha) {
      delete dataToSend.senha;
    } else if (!isEditing && !data.senha) {
      // Se criando, a senha é obrigatória (validado pelo hook/service)
      toast.error("Senha é obrigatória para criar usuário."); // Correção B.1
      return;
    }

    try {
      await onSave(dataToSend, usuario?.id);
      // Sucesso é tratado no hook/página pai (fecha modal, mostra toast)
    } catch (err) {
      // Erro já tratado no hook/página pai e exibido via 'apiError' neste modal
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Usuário' : 'Novo Usuário'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Campos Nome, Email, Senha mantidos */}
        <FormInput id="nome" label="Nome" {...register('nome', { required: 'Nome obrigatório' })} error={errors.nome?.message} disabled={isLoading} autoFocus />
        <FormInput id="email" label="Email" type="email" {...register('email', { required: 'Email obrigatório', pattern: /.../ })} error={errors.email?.message} disabled={isLoading} />
        <FormInput id="senha" label={isEditing ? 'Nova Senha (opcional)' : 'Senha'} type="password" {...register('senha', { required: !isEditing, minLength: { value: 6, message: 'Mínimo 6 caracteres' }})} error={errors.senha?.message} disabled={isLoading} />

        {/* Campo Perfil com Lógica Condicional */}
        <FormSelect
          id="perfil"
          label="Perfil de Acesso"
          {...register('perfil', { required: 'Perfil obrigatório' })}
          error={errors.perfil?.message}
          // Correção A.4: Desabilitado se não puder editar
          disabled={isLoading || !canEditProfileField}
          // Garante que o valor seja ATENDENTE se não puder editar
          value={canEditProfileField ? undefined : PerfilUsuario.ATENDENTE}
          onChange={(e) => {
            if (canEditProfileField) {
                 setValue('perfil', e.target.value as PerfilUsuario);
            }
          }}
        >
          {/* Correção A.4: Opções disponíveis variam */}
          {perfilUsuarioLogado === PerfilUsuario.MASTER && (
             <>
                <option value={PerfilUsuario.ATENDENTE}>Atendente</option>
                <option value={PerfilUsuario.ADMINISTRADOR}>Administrador</option>
                <option value={PerfilUsuario.MASTER}>Master</option>
             </>
          )}
          {perfilUsuarioLogado === PerfilUsuario.ADMINISTRADOR && (
             <option value={PerfilUsuario.ATENDENTE}>Atendente</option>
             // Admin não pode selecionar outros perfis
          )}
        </FormSelect>
        {!canEditProfileField && (
            <p className="text-xs text-gray-500 -mt-2">Administradores só podem gerenciar Atendentes.</p>
        )}


        {apiError && <ErrorMessage message={apiError} />}

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}> Cancelar </Button>
          <Button type="submit" variant="primary" disabled={isLoading}> {isLoading ? <Loader2 className="animate-spin" /> : 'Salvar'} </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};
