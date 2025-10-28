// src/pages/admin/AdminCategories.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Categoria } from '../../types';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { CategoryFormModal } from './components/CategoryFormModal';
import { getErrorMessage } from '../../utils/errors';
import { formatarData } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../../components/ui/Pagination'; // <<< Importar Pagination

// --- Tabela de Categorias (Memoizado - sem alterações no código interno) ---
const CategoriesTable: React.FC<{
  categorias: Categoria[];
  onEdit: (categoria: Categoria) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
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
              Produtos Assoc.
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
          {isLoading && !categorias.length ? (
            <SkeletonTable cols={4} rows={5} />
          ) : (
            categorias.map((categoria) => (
              <tr key={categoria.id} className="hover:bg-background-light-blue transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                  {categoria.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                   {categoria._count?.produtos ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {categoria.criado_em ? formatarData(categoria.criado_em, { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onEdit(categoria)}
                    aria-label={`Editar ${categoria.nome}`}
                    className="text-primary-blue hover:underline p-1"
                    title="Editar"
                    disabled={isLoading}
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
                    // Desabilitar se houver produtos ou se estiver carregando
                    disabled={isLoading || (categoria._count?.produtos ?? 0) > 0}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))
          )}
          {!isLoading && categorias.length === 0 && (
             <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-text-secondary">
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
  const [termoBusca, setTermoBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);

  const termoDebounced = useDebounce(termoBusca, 300);

  const {
    data,
    isLoading,
    error, // Erro geral de carregamento
    mutate,
    handleCreate,
    handleUpdate,
    handleDelete,
    isMutating,
    mutationError, // Erro específico das operações CUD
    setMutationError,
  } = useAdminCategories(pagina, termoDebounced, 10); // Limite de 10 por página

  // Usa optional chaining e nullish coalescing para segurança
  const categorias = data?.data ?? [];
  const meta = data?.meta;

  const totalPaginas = useMemo(() => {
      if (!meta) return 1;
      return meta.totalPaginas || 1;
  }, [meta]);

  const handleOpenModal = useCallback((categoria: Categoria | null) => {
    setCategoriaSelecionada(categoria);
    setMutationError(null); // Limpa erro anterior ao abrir modal
    setModalAberto(true);
  }, [setMutationError]);

  const handleCloseModal = useCallback(() => {
    setCategoriaSelecionada(null);
    setModalAberto(false);
  }, []);

  const handleSave = useCallback(async (formData: { nome: string }, id?: string): Promise<void> => { // Retorno ajustado para void, pois não usamos o resultado aqui
    try {
      if (id) {
        await handleUpdate(id, formData);
      } else {
        await handleCreate(formData);
      }
      handleCloseModal();
      mutate(); // Revalida os dados da página atual
    } catch (err) {
      // O erro já é tratado no hook e passado via mutationError para o modal
      console.error("Erro no handleSave (AdminCategories):", err);
      // Não precisa re-lançar se o modal já exibe o mutationError
    }
  }, [handleCreate, handleUpdate, mutate, handleCloseModal]);


  const handleDeleteConfirm = useCallback(async (id: string) => {
    const categoriaParaExcluir = categorias.find(c => c.id === id);
    if (!categoriaParaExcluir) return;

    if ((categoriaParaExcluir._count?.produtos ?? 0) > 0) {
         alert('Não é possível excluir categorias com produtos associados. Remova ou altere os produtos primeiro.');
         return;
    }

    if (window.confirm(`Tem certeza que deseja excluir a categoria "${categoriaParaExcluir?.nome}"? Esta ação não pode ser desfeita.`)) {
      try {
        await handleDelete(id);
        // Se a página atual ficar vazia após a exclusão e não for a primeira página, volte uma página
        if (categorias.length === 1 && pagina > 1) {
            setPagina(pagina - 1); // O useEffect [pagina] buscará os dados da página anterior
        } else {
            mutate(); // Revalida a página atual
        }
        // Opcional: Adicionar toast de sucesso
      } catch (err) {
        // Exibe erro específico retornado pelo hook/serviço
        alert(`Erro ao excluir categoria: ${getErrorMessage(err)}`);
      }
    }
  }, [handleDelete, mutate, categorias, pagina]);

  const handlePageChange = useCallback((newPage: number) => {
      // A verificação já está dentro do componente Pagination, mas mantemos aqui por segurança
      if (newPage >= 1 && newPage <= totalPaginas) {
          setPagina(newPage);
      }
  }, [totalPaginas]);

  // Reseta para a primeira página quando o termo de busca (debounced) mudar
  useEffect(() => {
      setPagina(1);
  }, [termoDebounced]);

  // Converte erro geral (unknown) para string ou null
  const displayError = error ? getErrorMessage(error) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gestão de Categorias</h1>
        <Button
           variant="primary"
           onClick={() => handleOpenModal(null)}
           disabled={isLoading || isMutating} // Desabilitar se carregando ou mutando
        >
          <Plus size={20} className="-ml-1 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Input de Busca */}
      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <Search size={20} className="text-text-secondary" aria-hidden="true" />
        </div>
        <input
          type="search" // Usar tipo search para melhor semântica e UX (botão X)
          placeholder="Buscar categorias por nome..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          disabled={isMutating} // Desabilitar durante CUD
          className="
            block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
            leading-5 bg-primary-white text-text-primary placeholder-text-secondary/70 {/* Placeholder mais sutil */}
            focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue
            sm:text-sm transition-colors duration-150
          "
        />
      </div>

      {/* Exibição de Erro Geral */}
      {displayError && !isLoading && (
        <ErrorMessage message={displayError} title="Erro ao Carregar Categorias"/>
      )}

      {/* Tabela de Categorias */}
      <CategoriesTable
        categorias={categorias}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        // Passar isLoading OU isMutating para mostrar loading na tabela durante CUD
        isLoading={isLoading || isMutating}
      />

      {/* Paginação */}
      {meta && (
        <Pagination
          paginaAtual={meta.pagina}
          totalPaginas={totalPaginas}
          onPageChange={handlePageChange}
          isLoading={isLoading || isMutating} // Desabilitar botões durante CUD
        />
      )}


      {/* Modal de Formulário */}
      {modalAberto && (
        <CategoryFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSave={handleSave}
          categoria={categoriaSelecionada}
          isMutating={isMutating} // Passa o estado de mutação para o modal
          mutationError={mutationError} // Passa o erro original (unknown) para o modal
        />
      )}
    </div>
  );
};

export default AdminCategories;
