import React, { useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Produto, Categoria } from '../../../types';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getErrorMessage } from '../../../utils/errors';
import { ModalWrapper } from './ModalWrapper';
import { FormInput, FormTextarea, FormSelect } from './FormElements';
import { Loader2 } from 'lucide-react';

interface ProductFormInputs {
  nome: string;
  descricao: string;
  preco: number;
  quantidadeEstoque: number;
  categoriaId: string;
  imagemUrl: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProductFormInputs, id?: string) => Promise<void>;
  produto: Produto | null;
  categorias: Categoria[];
  isLoading: boolean;
  error: unknown;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  produto,
  categorias,
  isLoading,
  error,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProductFormInputs>();

  useEffect(() => {
    if (produto) {
      reset({
        ...produto,
        preco: produto.preco, // O hook já lida com a formatação
        quantidadeEstoque: produto.quantidadeEstoque,
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
  }, [produto, categorias, reset]);

  const onSubmit: SubmitHandler<ProductFormInputs> = async (data) => {
    // Garante que os números sejam enviados como números
    const dataToSend = {
      ...data,
      preco: Number(data.preco),
      quantidadeEstoque: Number(data.quantidadeEstoque),
    };
    await onSave(dataToSend, produto?.id);
    // Não fecha automaticamente se houver erro da API
    if (!error) { 
      onClose();
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={produto ? 'Editar Produto' : 'Novo Produto'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"> {/* 8px grid */}
        
        {/* Campo Nome */}
        <FormInput
          id="nome"
          label="Nome do Produto"
          {...register('nome', { required: 'O nome é obrigatório' })}
          error={errors.nome?.message}
          disabled={isLoading}
          autoFocus
        />

        {/* Campo Descrição */}
        <FormTextarea
          id="descricao"
          label="Descrição"
          {...register('descricao')}
          disabled={isLoading}
        />

        {/* Grid para Preço e Estoque */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* 8px grid */}
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        {/* Campo Categoria */}
        <FormSelect
          id="categoriaId"
          label="Categoria"
          {...register('categoriaId', { required: 'A categoria é obrigatória' })}
          error={errors.categoriaId?.message}
          disabled={isLoading}
        >
          <option value="" disabled>Selecione...</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </FormSelect>

        {/* Campo URL da Imagem */}
        <FormInput
          id="imagemUrl"
          label="URL da Imagem (Opcional)"
          {...register('imagemUrl')}
          disabled={isLoading}
        />

        {/* Exibição de Erro da API */}
        {error && <ErrorMessage message={getErrorMessage(error)} />}
        
        {/* Ações do Formulário */}
        <div className="flex justify-end gap-4 pt-4"> {/* 8px grid */}
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
