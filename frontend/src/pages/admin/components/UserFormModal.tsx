// frontend/src/pages/admin/components/UserFormModal.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  userFormSchema,
  createUserFormSchema,
  UserFormData,
} from '@/validations/user.schema.ts';
import { Usuario, PerfilUsuario } from '@/types';
import { ModalWrapper } from './ModalWrapper';
import {
  FormInput,
  FormSelect,
  FormCheckbox,
  FormActions,
} from './FormElements';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { getErrorMessage } from '@/utils/errors'; // (Importado)

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<UserFormData>, id?: string) => Promise<void>; // CORREÇÃO (Causa 7)
  usuario: Usuario | null; // (Nome corrigido)
  isLoading: boolean; // (Nome corrigido)
  error: unknown; // (Nome corrigido)
  perfilUsuarioLogado?: PerfilUsuario;
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit, // CORREÇÃO (Causa 7)
  usuario, // (Nome corrigido)
  isLoading, // (Nome corrigido)
  error, // (Nome corrigido)
  perfilUsuarioLogado,
}: UserFormModalProps) {
  const isEditMode = !!usuario;
  const isMasterLogado = perfilUsuarioLogado === PerfilUsuario.MASTER;

  const {
    register,
    handleSubmit,
    reset,
    // watch, // (Causa 10 - Removido)
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(isEditMode ? userFormSchema : createUserFormSchema),
    defaultValues: {
      nome: '',
      email: '',
      perfil: PerfilUsuario.ATENDENTE,
      ativo: true,
      senha: '',
      confirmarSenha: '',
    },
  });

  // const watchedPerfil = watch('perfil'); // (Causa 10 - Removido)

  useEffect(() => {
    if (isOpen) {
      const initialValues = usuario
        ? {
            ...usuario,
            senha: '',
            confirmarSenha: '',
          }
        : {
            nome: '',
            email: '',
            perfil: PerfilUsuario.ATENDENTE,
            ativo: true, // (Default para true na criação)
            senha: '',
            confirmarSenha: '',
          };
      reset(initialValues);
    }
  }, [isOpen, usuario, reset]);

  const handleFormSubmit = async (data: UserFormData) => {
    const payload: Partial<UserFormData> = { ...data };

    if (isEditMode && (!payload.senha || payload.senha === '')) {
      delete payload.senha;
      delete payload.confirmarSenha;
    }

    await onSubmit(payload, usuario?.id); // (Causa 7)
  };

  const displayError = error ? getErrorMessage(error) : null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {displayError && <ErrorMessage message={displayError} />}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormInput
            id="nome"
            label="Nome Completo"
            {...register('nome')} // CORREÇÃO (Causa 7)
            error={errors.nome?.message}
            placeholder="Nome do usuário"
            autoFocus
          />

          <FormInput
            id="email"
            label="E-mail"
            type="email"
            {...register('email')} // CORREÇÃO (Causa 7)
            error={errors.email?.message}
            placeholder="email@exemplo.com"
            disabled={isEditMode}
          />

          <FormSelect
            id="perfil"
            label="Perfil"
            {...register('perfil')} // CORREÇÃO (Causa 7)
            error={errors.perfil?.message}
            disabled={
              !isMasterLogado || // (Admin não pode trocar perfil)
              (isEditMode && usuario?.perfil === PerfilUsuario.MASTER) // (Master não pode ser rebaixado)
            }
          >
            {/* Master só pode ser visto (se for) ou setado pelo MASTER */}
            {isMasterLogado && (
              <option value={PerfilUsuario.MASTER}>Master (Sistema)</option>
            )}
            
            {(isMasterLogado || perfilUsuarioLogado === PerfilUsuario.ADMINISTRADOR) && (
                 <option value={PerfilUsuario.ADMINISTRADOR}>Administrador</option>
            )}
            
            <option value={PerfilUsuario.ATENDENTE}>Atendente</option>

            {/* Se for Master, mostra a opção mas desabilitada */}
            {isEditMode &&
              usuario?.perfil === PerfilUsuario.MASTER &&
              !isMasterLogado && (
                <option value={PerfilUsuario.MASTER}>Master (Sistema)</option>
              )}
          </FormSelect>

          <FormCheckbox
            id="ativo"
            label="Usuário Ativo"
            {...register('ativo')} // CORREÇÃO (Causa 7)
            error={errors.ativo?.message}
            disabled={
              isEditMode && usuario?.perfil === PerfilUsuario.MASTER
            }
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-text-primary">
            {isEditMode ? 'Alterar Senha (Opcional)' : 'Definir Senha'}
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormInput
              id="senha"
              label="Nova Senha"
              type="password"
              {...register('senha')} // CORREÇÃO (Causa 7)
              error={errors.senha?.message}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <FormInput
              id="confirmarSenha"
              label="Confirmar Nova Senha"
              type="password"
              {...register('confirmarSenha')} // CORREÇÃO (Causa 7)
              error={errors.confirmarSenha?.message}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          {/* Erro de senha/confirmação (que não são do campo) */}
          {errors.root && <ErrorMessage message={errors.root.message} />}
        </div>

        <FormActions
          onClose={onClose}
          isSubmitting={isLoading}
          submitText={isEditMode ? 'Salvar Alterações' : 'Criar Usuário'}
        />
      </form>
    </ModalWrapper>
  );
}
