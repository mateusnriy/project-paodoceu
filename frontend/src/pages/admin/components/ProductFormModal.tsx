// src/pages/admin/components/ProductFormModal.tsx
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form'; // Controller removido
import { Produto, Categoria, ProdutoFormData } from '../../../types';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getErrorMessage } from '../../../utils/errors';
import { ModalWrapper } from './ModalWrapper';
import { FormInput, FormTextarea, FormSelect } from './FormElements';
import { Loader2 } from 'lucide-react';

interface ProductFormInputs extends ProdutoFormData {}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormInputs, id?: string) => Promise<Produto | void>;
  produto: Produto | null;
  categorias: Categoria[];
  isMutating: boolean;
  mutationError: unknown; // <<< CORRIGIDO: Aceita unknown
  isLoadingCategorias: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  produto,
  categorias,
  isMutating,
  mutationError,
  isLoadingCategorias,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    // control, // REMOVIDO
    formState: { errors },
  } = useForm<ProductFormInputs>();

  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        if (produto) {
          reset({
            nome: produto.nome,
            descricao: produto.descricao || '',
            preco: produto.preco,
            quantidadeEstoque: produto.quantidadeEstoque,
            categoriaId: produto.categoriaId,
            imagemUrl: produto.imagemUrl || '',
          });
        } else {
          reset({
            nome: '',
            descricao: '',
            preco: 0,
            quantidadeEstoque: 0,
            categoriaId: categorias[0]?.id || '',
            imagemUrl: '',
          });
        }
        setApiError(null);
    }
  }, [isOpen, produto, categorias, reset]);

  useEffect(() => {
    // CORREÇÃO: Converte 'unknown' para string de erro
    setApiError(mutationError ? getErrorMessage(mutationError) : null);
  }, [mutationError]);

  const onSubmit: SubmitHandler<ProductFormInputs> = async (data) => {
    setApiError(null);
    const dataToSend = {
      ...data,
      preco: Number(data.preco),
      quantidadeEstoque: Number(data.quantidadeEstoque),
      descricao: data.descricao || undefined,
      imagemUrl: data.imagemUrl || undefined,
    };

    try {
        await onSave(dataToSend, produto?.id);
    } catch (err) {
        console.error("Erro capturado no onSubmit do modal (Produto):", err);
        // O erro já está sendo tratado pela prop 'mutationError'
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={produto ? 'Editar Produto' : 'Novo Produto'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <FormInput
          id="nome"
          label="Nome do Produto"
          {...register('nome', { required: 'O nome é obrigatório' })}
          error={errors.nome?.message}
          disabled={isMutating}
          autoFocus
        />

        <FormTextarea
          id="descricao"
          label="Descrição (Opcional)"
          {...register('descricao')}
          disabled={isMutating}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="preco"
            label="Preço (R$)"
            type="number"
            step="0.01"
            {...register('preco', {
              required: 'O preço é obrigatório',
              valueAsNumber: true,
              min: { value: 0.01, message: 'O preço deve ser positivo' },
            })}
            error={errors.preco?.message}
            disabled={isMutating}
          />
          <FormInput
            id="quantidadeEstoque"
            label="Estoque"
            type="number"
            step="1"
            {...register('quantidadeEstoque', {
              required: 'O estoque é obrigatório',
              valueAsNumber: true,
              min: { value: 0, message: 'O estoque não pode ser negativo' },
            })}
            error={errors.quantidadeEstoque?.message}
            disabled={isMutating}
          />
        </div>

        <FormSelect
          id="categoriaId"
          label="Categoria"
          {...register('categoriaId', { required: 'A categoria é obrigatória' })}
          error={errors.categoriaId?.message}
          disabled={isMutating || isLoadingCategorias}
        >
          <option value="" disabled>
            {isLoadingCategorias ? 'Carregando...' : 'Selecione...'}
          </option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </FormSelect>

        <FormInput
          id="imagemUrl"
          label="URL da Imagem (Opcional)"
          {...register('imagemUrl')}
          disabled={isMutating}
        />

        {/* Mostra o erro da API (mutationError convertido) */}
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
          <Button type="submit" variant="primary" disabled={isMutating || isLoadingCategorias}>
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
