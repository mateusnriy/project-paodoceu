import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
// <<< CORREÇÃO: Importa Categoria >>>
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
  // <<< CORREÇÃO: Assinatura de onSave atualizada >>>
  onSave: (data: { nome: string }, id?: string) => Promise<Categoria>;
  categoria: Categoria | null;
  isMutating: boolean;
  mutationError: unknown;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoria,
  isMutating,
  mutationError,
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
    setApiError(mutationError ? getErrorMessage(mutationError) : null);
  }, [mutationError]);


  const onSubmit: SubmitHandler<CategoryFormInputs> = async (data) => {
    setApiError(null);
    try {
      await onSave({ nome: data.nome }, categoria?.id);
      // Sucesso: O fechamento e revalidação são feitos na página pai
    } catch (err) {
      // Erro já está em mutationError, setamos apiError como fallback
      console.error("Erro capturado no onSubmit do modal (Categoria):", err);
      // setApiError(getErrorMessage(err)); // Não precisa, já vem por props
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

        {/* Mostra erro da API (mutationError) */}
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
