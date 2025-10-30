// frontend/src/pages/admin/components/ProductFormModal.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  productFormSchema,
  ProductFormData,
} from '@/validations/product.schema.ts';
import { Produto, Categoria } from '@/types';
import { ModalWrapper } from './ModalWrapper';
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormActions,
} from './FormElements';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
// CORREÇÃO (Erro 19): 'getErrorMessage' não é usado aqui,
// pois 'mutationError' já vem formatado do hook.
// import { getErrorMessage } from '@/utils/errors';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData, id?: string) => Promise<void>;
  produto: Produto | null;
  isMutating: boolean;
  categorias: Categoria[];
  mutationError: string | null;
  isLoadingCategorias: boolean;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  produto,
  isMutating,
  categorias,
  mutationError,
  isLoadingCategorias,
}: ProductFormModalProps) {
  const isEditMode = !!produto;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
  });

  useEffect(() => {
    if (isOpen) {
      const initialValues = produto
        ? {
            ...produto,
            // CORREÇÃO (Erro 20): O tipo Produto tem 'descricao: string | null'
            // O formulário (ProductFormData) espera 'descricao: string | undefined'.
            // Converter 'null' para 'undefined'.
            descricao: produto.descricao ?? undefined,
            preco: Number(produto.preco),
            estoque: Number(produto.estoque),
          }
        : {
            nome: '',
            descricao: '',
            preco: 0,
            estoque: 0,
            categoria_id: '',
            ativo: true,
          };
      reset(initialValues);
    }
  }, [isOpen, produto, reset]);

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit(data, produto?.id);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Produto' : 'Novo Produto'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {mutationError && <ErrorMessage message={mutationError} />}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormInput
            id="nome"
            label="Nome do Produto"
            {...register('nome')}
            error={errors.nome?.message}
            placeholder="Ex: X-Burger"
            autoFocus
          />

          <FormSelect
            id="categoria_id"
            label="Categoria"
            {...register('categoria_id')}
            error={errors.categoria_id?.message}
            disabled={isLoadingCategorias}
          >
            <option value="">Selecione...</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </FormSelect>

          <FormInput
            id="preco"
            label="Preço (R$)"
            type="number"
            step="0.01"
            {...register('preco')}
            error={errors.preco?.message}
            placeholder="0.00"
          />

          <FormInput
            id="estoque"
            label="Estoque"
            type="number"
            step="1"
            {...register('estoque')}
            error={errors.estoque?.message}
            placeholder="0"
          />
        </div>

        <FormTextarea
          id="descricao"
          label="Descrição"
          {...register('descricao')}
          error={errors.descricao?.message}
          placeholder="(Opcional) Pão, bife, queijo..."
          rows={3}
        />

        <FormCheckbox
          id="ativo"
          label="Produto Ativo (visível no PDV)"
          {...register('ativo')}
          error={errors.ativo?.message}
        />

        <FormActions
          onClose={onClose}
          isSubmitting={isMutating}
          submitText={isEditMode ? 'Salvar Alterações' : 'Criar Produto'}
        />
      </form>
    </ModalWrapper>
  );
}
