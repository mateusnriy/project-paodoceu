// mateusnriy/project-paodoceu/project-paodoceu-main/frontend/src/pages/admin/components/ProductFormModal.tsx
import React, { useEffect, useState } from 'react'; // <<< CORREÇÃO: Adicionar useState
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
// <<< CORREÇÃO: Importar tipos corretos >>>
import { Produto, Categoria, ProdutoFormData } from '../../../types';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getErrorMessage } from '../../../utils/errors';
import { ModalWrapper } from './ModalWrapper';
import { FormInput, FormTextarea, FormSelect } from './FormElements';
import { Loader2 } from 'lucide-react';

// <<< CORREÇÃO: Usar ProdutoFormData >>>
interface ProductFormInputs extends ProdutoFormData {}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // <<< CORREÇÃO: Assinatura de onSave >>>
  onSave: (data: ProductFormInputs, id?: string) => Promise<Produto>;
  produto: Produto | null;
  categorias: Categoria[];
  // <<< CORREÇÃO: Renomeado para isMutating/mutationError >>>
  isMutating: boolean;
  mutationError: unknown;
  isLoadingCategorias: boolean; // Novo
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  produto,
  categorias,
  isMutating,
  mutationError,
  isLoadingCategorias, // Novo
}) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProductFormInputs>();

  const [apiError, setApiError] = useState<string | null>(null); // <<< Estado de erro local

  useEffect(() => {
    if (isOpen) {
        if (produto) {
          reset({
            nome: produto.nome,
            descricao: produto.descricao || '',
            preco: produto.preco,
            quantidadeEstoque: produto.quantidadeEstoque, // <<< CORREÇÃO: Usar 'quantidadeEstoque'
            categoriaId: produto.categoriaId, // <<< CORREÇÃO: Usar 'categoriaId'
            imagemUrl: produto.imagemUrl || '', // <<< CORREÇÃO: Usar 'imagemUrl'
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
        setApiError(null); // Limpa erro ao abrir
    }
  }, [isOpen, produto, categorias, reset]); // <<< CORREÇÃO: Dependência 'isOpen'

  // <<< CORREÇÃO: Sincronizar erro do hook >>>
  useEffect(() => {
    setApiError(mutationError ? getErrorMessage(mutationError) : null);
  }, [mutationError]);

  const onSubmit: SubmitHandler<ProductFormInputs> = async (data) => {
    setApiError(null); // <<< Limpar erro local
    const dataToSend = {
      ...data,
      preco: Number(data.preco),
      quantidadeEstoque: Number(data.quantidadeEstoque),
      // Garante que campos opcionais vazios sejam undefined
      descricao: data.descricao || undefined,
      imagemUrl: data.imagemUrl || undefined,
    };
    
    try {
        await onSave(dataToSend, produto?.id);
        // Sucesso: O fechamento é tratado pelo componente pai (AdminProducts)
    } catch (err) {
        // Erro é pego e exibido pelo useEffect de mutationError
        console.error("Erro capturado no onSubmit do modal (Produto):", err);
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
          label="Descrição (Opcional)" // <<< Opcional
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
          {/* <<< CORREÇÃO: Usar 'quantidadeEstoque' >>> */}
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
          // <<< CORREÇÃO: Renomeado para 'categoriaId' >>>
          {...register('categoriaId', { required: 'A categoria é obrigatória' })}
          error={errors.categoriaId?.message}
          disabled={isMutating || isLoadingCategorias} // <<< Desabilita se carregando categorias
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
           // <<< CORREÇÃO: Renomeado para 'imagemUrl' >>>
          {...register('imagemUrl')}
          disabled={isMutating}
        />

        {/* <<< CORREÇÃO: Usando 'apiError' local >>> */}
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
