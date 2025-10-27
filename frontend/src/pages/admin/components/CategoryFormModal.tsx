// src/pages/admin/components/CategoryFormModal.tsx
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Categoria } from '../../../types';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getErrorMessage } from '../../../utils/errors';
import { ModalWrapper } from './ModalWrapper';
import { FormInput } from './FormElements';
import { Loader2 } from 'lucide-react';

interface CategoryFormInputs {
  nome: string;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // CORREÇÃO: onSave pode retornar void se não precisar do objeto criado/atualizado
  onSave: (data: { nome: string }, id?: string) => Promise<Categoria | void>;
  categoria: Categoria | null;
  isMutating: boolean;
  mutationError: unknown; // CORREÇÃO: Aceita unknown
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoria,
  isMutating,
  mutationError, // <<< (mutationError)
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<CategoryFormInputs>();

  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      reset({ nome: categoria?.nome || '' });
      setApiError(null);
    }
  }, [isOpen, categoria, reset]);

  useEffect(() => {
    // CORREÇÃO: Converte 'unknown' para string de erro
    setApiError(mutationError ? getErrorMessage(mutationError) : null);
  }, [mutationError]);


  const onSubmit: SubmitHandler<CategoryFormInputs> = async (data) => {
    setApiError(null);
    try {
      await onSave({ nome: data.nome }, categoria?.id);
      // Sucesso: O fechamento é tratado na página pai (AdminCategories)
    } catch (err) {
      // O erro já está sendo tratado pela prop 'mutationError'
      console.error("Erro capturado no onSubmit do modal (Categoria):", err);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={categoria ? 'Editar Categoria' : 'Nova Categoria'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <FormInput
          id="nome"
          label="Nome da Categoria"
          {...register('nome', {
             required: 'O nome é obrigatório',
             minLength: { value: 3, message: 'O nome deve ter no mínimo 3 caracteres' }
          })}
          error={formErrors.nome?.message}
          disabled={isMutating}
          autoFocus
        />

        {apiError && <ErrorMessage message={apiError} />}

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isMutating}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isMutating}>
            {isMutating ? (
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
