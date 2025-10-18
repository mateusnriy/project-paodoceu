import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Categoria } from '../../../types';
import { Button } from '../../../components/common/Button';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getErrorMessage } from '../../../utils/errors';
import { ModalWrapper } from './ModalWrapper';
import { FormInput } from './FormElements';
import { Loader2 } from 'lucide-react';

// Interface para os dados do formulário gerenciados pelo react-hook-form
interface CategoryFormInputs {
  nome: string;
}

// Props que o modal recebe da página pai (AdminCategories)
interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Assinatura da função de salvar (vinda do hook useAdminCategories)
  onSave: (data: { nome: string }, id?: string) => Promise<Categoria>; // Espera retornar a Categoria criada/atualizada
  categoria: Categoria | null; // Categoria a ser editada (null para criar)
  isMutating: boolean; // Estado de loading da mutação (vindo do hook)
  mutationError: unknown; // Erro da mutação (vindo do hook)
}

/**
 * @component CategoryFormModal
 * @description Modal para criar ou editar uma Categoria.
 * Utiliza react-hook-form para gerenciamento e validação do formulário.
 */
export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categoria,
  isMutating,
  mutationError,
}) => {
  // Inicializa o react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors }, // Renomeia 'errors' para evitar conflito com 'mutationError'
  } = useForm<CategoryFormInputs>();

  // Estado local para exibir erros específicos da API no modal
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * @effect
   * Reseta o formulário e limpa erros da API sempre que o modal abre
   * ou a categoria selecionada muda.
   */
  useEffect(() => {
    if (isOpen) {
      // Preenche o campo 'nome' se estiver editando, ou limpa se for criar
      reset({ nome: categoria?.nome || '' });
      setApiError(null); // Limpa erros da API anteriores
    }
  }, [isOpen, categoria, reset]);

  /**
   * @effect
   * Atualiza o estado de erro local (apiError) se um erro de mutação
   * for recebido do hook pai (mutationError).
   */
  useEffect(() => {
    setApiError(mutationError ? getErrorMessage(mutationError) : null);
  }, [mutationError]);


  /**
   * @function onSubmit
   * @description Função chamada pelo react-hook-form após a validação bem-sucedida.
   * Chama a função onSave (do hook pai) para realizar a mutação na API.
   */
  const onSubmit: SubmitHandler<CategoryFormInputs> = async (data) => {
    setApiError(null); // Limpa erro anterior antes de tentar salvar
    try {
      // Chama a função onSave passada pelo hook pai
      // O hook pai (useAdminCategories) é responsável por:
      // 1. Chamar a API (handleCreate ou handleUpdate)
      // 2. Definir isMutating como true/false
      // 3. Capturar erros e colocá-los em mutationError
      // 4. Se sucesso, chamar onClose e mutate (revalidar)
      await onSave({ nome: data.nome }, categoria?.id);
      // O fechamento do modal e a revalidação são feitos na página pai (AdminCategories)
      // após a confirmação de sucesso da função onSave.
    } catch (err) {
      // O erro já é tratado no hook pai e passado via `mutationError`.
      // Este catch é um fallback, caso a promessa rejeite antes do hook atualizar o estado.
      console.error("Erro capturado diretamente no onSubmit do modal:", err);
      setApiError(getErrorMessage(err)); // Define o erro local como fallback
    }
    // O estado 'isMutating' (loading do botão) é controlado pelo hook pai.
  };

  // Renderiza o componente ModalWrapper e o formulário dentro dele
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose} // Permite fechar clicando fora ou no botão X
      title={categoria ? 'Editar Categoria' : 'Nova Categoria'}
    >
      {/* O handleSubmit do RHF valida os campos e chama nosso onSubmit */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"> {/* 8px grid (space-y-4 = 16px) */}

        {/* Campo Nome */}
        <FormInput
          id="nome"
          label="Nome da Categoria"
          // Registra o input com react-hook-form e define regras de validação
          {...register('nome', {
             required: 'O nome é obrigatório', // Mensagem de erro para campo vazio
             minLength: { value: 3, message: 'O nome deve ter no mínimo 3 caracteres' } // Exemplo de outra regra
          })}
          // Passa a mensagem de erro de validação do RHF para o FormInput
          error={formErrors.nome?.message}
          disabled={isMutating} // Desabilita o input durante o envio
          autoFocus // Foca automaticamente neste campo ao abrir o modal
        />

        {/* Exibição de Erro da API */}
        {/* Mostra o erro vindo do hook pai (mutationError) */}
        {apiError && <ErrorMessage message={apiError} />}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4 pt-4"> {/* 8px grid (gap-4 = 16px) */}
          <Button
            type="button" // Garante que não submete o form
            variant="secondary"
            onClick={onClose} // Fecha o modal
            disabled={isMutating} // Desabilita durante o envio
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isMutating}>
            {isMutating ? ( // Mostra spinner se estiver enviando
              <Loader2 size={20} className="animate-spin" />
            ) : (
              'Salvar' // Texto padrão
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};
