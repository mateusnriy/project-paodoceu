import React, { useState, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Categoria, PaginatedResponse } from '../../types';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { CategoryFormModal } from './components/CategoryFormModal';
import { getErrorMessage } from '../../utils/errors';
import { formatarData } from '../../utils/formatters';

// --- Componente de Paginação (Reutilizado - Memoizado) ---
const Pagination: React.FC<{
  paginaAtual: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}> = React.memo(({ paginaAtual, totalPaginas, onPageChange, isLoading }) => {
  if (totalPaginas <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(paginaAtual - 1)}
        disabled={paginaAtual === 1 || isLoading}
        aria-label="Página anterior"
      >
        Anterior
      </Button>
      <span className="text-sm text-text-secondary font-medium">
        Página {paginaAtual} de {totalPaginas}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(paginaAtual + 1)}
        disabled={paginaAtual === totalPaginas || isLoading}
        aria-label="Próxima página"
      >
        Próxima
      </Button>
    </div>
  );
});
Pagination.displayName = 'Pagination';

// --- Tabela de Categorias (Memoizado) ---
const CategoriesTable: React.FC<{
  categorias: Categoria[];
  onEdit: (categoria: Categoria) => void;
  onDelete: (id: string) => void;
  isLoading: boolean; // Estado de carregamento da tabela (busca/paginação)
}> = React.memo(({ categorias, onEdit, onDelete, isLoading }) => {
  return (
    <div className="bg-primary-white rounded-xl shadow-soft overflow-x-auto border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Nome
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Criada em
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {/* Mostra Skeleton apenas no loading inicial E se não houver dados antigos */}
          {isLoading && !categorias.length ? (
            <SkeletonTable cols={3} rows={5} />
          ) : (
            categorias.map((categoria) => (
              <tr key={categoria.id} className="hover:bg-background-light-blue transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                  {categoria.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {categoria.dataCriacao ? formatarData(categoria.dataCriacao, { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onEdit(categoria)}
                    aria-label={`Editar ${categoria.nome}`}
                    className="text-primary-blue hover:underline p-1"
                    title="Editar"
                    disabled={isLoading} // Desabilita botões se a tabela estiver recarregando
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onDelete(categoria.id)}
                    className="text-status-error hover:underline p-1"
                    aria-label={`Excluir ${categoria.nome}`}
                    title="Excluir"
                    disabled={isLoading} // Desabilita botões se a tabela estiver recarregando
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))
          )}
          {/* Mensagem de Tabela Vazia */}
          {!isLoading && categorias.length === 0 && (
             <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-text-secondary">
                    Nenhuma categoria encontrada.
                </td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
CategoriesTable.displayName = 'CategoriesTable';

// --- Página Principal: AdminCategories ---
const AdminCategories: React.FC = () => {
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);

  // Hook para buscar categorias (data fetching e CUD)
  const {
    data,
    isLoading,
    error,
    mutate,
    handleCreate,
    handleUpdate,
    handleDelete,
    isMutating,
    // <<< CORREÇÃO: Destructuring correto das funções de estado do hook >>>
    setIsMutating,
    mutationError,
    setMutationError,
  } = useAdminCategories(pagina, '', 10); // Limite de 10 por página

  const categorias = data?.data ?? [];
  const totalPaginas = data?.meta?.totalPaginas ?? 1;

  // Handler para abrir o modal (limpa erro anterior)
  const handleOpenModal = useCallback((categoria: Categoria | null) => {
    setCategoriaSelecionada(categoria);
    setMutationError(null); // <<< CORREÇÃO: Chamada correta >>>
    setModalAberto(true);
  }, [setMutationError]); // <<< CORREÇÃO: Dependência correta >>>

  // Handler para fechar o modal
  const handleCloseModal = useCallback(() => {
    setCategoriaSelecionada(null);
    setModalAberto(false);
  }, []);

  /**
   * @function handleSave
   * @description Função intermediária que lida com a lógica de salvar (criar/atualizar),
   * controla estados de loading/erro e revalida os dados.
   * É passada para o `CategoryFormModal`.
   */
  const handleSave = useCallback(async (formData: { nome: string }, id?: string): Promise<Categoria> => {
    setMutationError(null); // Limpa erro anterior
    setIsMutating(true);    // Ativa loading
    let result: Categoria;
    try {
      if (id) {
        result = await handleUpdate(id, formData); // Chama update do hook
      } else {
        result = await handleCreate(formData); // Chama create do hook
      }
      handleCloseModal(); // Fecha modal em caso de sucesso
      mutate();           // Revalida dados da tabela
      return result;      // Retorna o resultado (pode ser útil)
    } catch (err) {
      setMutationError(err); // Define o erro de mutação (será passado para o modal)
      throw err;             // Relança o erro para o modal saber que falhou
    } finally {
      setIsMutating(false);   // Desativa loading
    }
  }, [handleCreate, handleUpdate, mutate, handleCloseModal, setMutationError, setIsMutating]); // Dependências

  // Handler para confirmar e deletar
  const handleDeleteConfirm = useCallback(async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria? Atenção: Produtos associados podem ser afetados.')) {
      setIsMutating(true);      // Ativa loading
      setMutationError(null);   // Limpa erro
      try {
        await handleDelete(id); // Chama delete do hook
        mutate();               // Revalida dados
      } catch (err) {
        // Exibe um alerta simples para erros de deleção
        alert(`Erro ao excluir categoria: ${getErrorMessage(err)}`);
        setMutationError(err); // Armazena o erro (embora já mostrado)
      } finally {
        setIsMutating(false);     // Desativa loading
      }
    }
  }, [handleDelete, mutate, setIsMutating, setMutationError]); // Dependências

  // Handler para mudança de página
  const handlePageChange = useCallback((newPage: number) => {
      // Garante que a página não seja menor que 1
      if (newPage >= 1) {
          setPagina(newPage);
      }
  }, []);

  // Renderização da Página
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gestão de Categorias</h1>
        <Button
           variant="primary"
           onClick={() => handleOpenModal(null)} // Chama o handler correto
           disabled={isLoading || isMutating} // Desabilita se carregando dados ou fazendo CUD
        >
          <Plus size={20} className="-ml-1 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Mensagem de Erro (Busca/Paginação) */}
      {error && !isLoading && (
        <ErrorMessage
          title="Erro ao carregar categorias"
          message={getErrorMessage(error)}
        />
      )}

      {/* Tabela */}
      <CategoriesTable
        categorias={categorias}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        // Passa isLoading OU isMutating para a tabela saber se está carregando/ocupada
        isLoading={isLoading || isMutating}
      />

      {/* Paginação */}
      <Pagination
        paginaAtual={pagina}
        totalPaginas={totalPaginas}
        onPageChange={handlePageChange}
        isLoading={isLoading || isMutating} // Desabilita se carregando ou fazendo CUD
      />

      {/* Modal (Renderizado condicionalmente) */}
      {modalAberto && (
        <CategoryFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSave={handleSave} // Passa a função handleSave correta
          categoria={categoriaSelecionada}
          isMutating={isMutating}      // Passa estado de loading CUD
          mutationError={mutationError} // Passa erro CUD
        />
      )}
    </div>
  );
};

export default AdminCategories;
