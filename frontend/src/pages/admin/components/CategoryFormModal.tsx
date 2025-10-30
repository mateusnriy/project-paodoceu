// frontend/src/pages/admin/components/CategoryFormModal.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  categoryFormSchema,
  CategoryFormData,
} from '@/validations/category.schema.ts';
import { Categoria } from '@/types';
import { ModalWrapper } from './ModalWrapper';
import { FormInput, FormActions } from './FormElements';
import { ErrorMessage } from '@/components/ui/ErrorMessage'; // (Necessário para mutationError)
import { getErrorMessage } from '@/utils/errors'; // (Necessário para mutationError)

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData, id?: string) => Promise<void>; // CORREÇÃO (Causa 7)
  categoria: Categoria | null; // (Nome corrigido)
  isMutating: boolean; // (Nome corrigido)
  mutationError: unknown; // (Nome corrigido)
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit, // CORREÇÃO (Causa 7)
  categoria, // (Nome corrigido)
  isMutating, // (Nome corrigido)
  mutationError, // (Nome corrigido)
}: CategoryFormModalProps) {
  const isEditMode = !!categoria;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (categoria) {
        reset(categoria);
      } else {
        reset({ nome: '' });
      }
    }
  }, [isOpen, categoria, reset]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    await onSubmit(data, categoria?.id); // (Causa 7) Chama o onSubmit correto
  };

  const displayError = mutationError ? getErrorMessage(mutationError) : null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Categoria' : 'Nova Categoria'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {displayError && <ErrorMessage message={displayError} />}

        <FormInput
          id="nome"
          label="Nome da Categoria"
          {...register('nome')} // CORREÇÃO (Causa 7)
          error={errors.nome?.message}
          placeholder="Ex: Lanches"
          autoFocus
        />

        <FormActions
          onClose={onClose}
          isSubmitting={isMutating} // (Nome corrigido)
          submitText={isEditMode ? 'Salvar Alterações' : 'Criar Categoria'}
        />
      </form>
    </ModalWrapper>
  );
}
