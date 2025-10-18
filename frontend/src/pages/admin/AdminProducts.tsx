import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Categoria, Produto, ProdutoFormData, PaginatedResponse } from '../../types';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { Button } from '../../components/common/Button';
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { ProductFormModal } from './components/ProductFormModal';
import { getErrorMessage } from '../../utils/errors';
import { useDebounce } from '../../hooks/useDebounce';
import { formatarMoeda, formatarData } from '../../utils/formatters';

// --- Componente de Tabela de Produtos (Memoizado) ---
const ProductsTable: React.FC<{
  produtos: Produto[];
  onEdit: (produto: Produto) => void;
  onDelete: (id: string) => void;
  isLoading: boolean; // Indica se a tabela está carregando dados (busca/paginação OU CUD)
}> = React.memo(({ produtos, onEdit, onDelete, isLoading }) => {

  // <<< CORREÇÃO: Subcomponente StatusBadge definido DENTRO do componente da tabela onde é usado >>>
  const StatusBadge: React.FC<{ disponivel: boolean }> = ({ disponivel }) => (
    <span
      className={`
        inline-block px-3 py-1 text-xs font-semibold rounded-full leading-tight
        ${
          disponivel
            ? 'bg-status-success-bg text-status-success-text' // Verde para disponível
            : 'bg-status-disabled-bg text-status-disabled-text' // Cinza para indisponível
        }
      `}
    >
      {disponivel ? 'Disponível' : 'Indisponível'}
    </span>
  );

  return (
    <div className="bg-primary-white rounded-xl shadow-soft overflow-x-auto border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Nome
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Preço
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Estoque
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Categoria
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {/* Mostra Skeleton se isLoading=true E não houver produtos antigos */}
          {isLoading && !produtos.length ? (
             <SkeletonTable cols={6} rows={5} />
          ) : (
            // Mapeia os produtos
            produtos.map((produto) => (
              <tr key={produto.id} className="hover:bg-background-light-blue transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                  {produto.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  <StatusBadge disponivel={produto.quantidadeEstoque > 0} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  {formatarMoeda(produto.preco)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  {produto.quantidadeEstoque}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  {produto.categoria?.nome ?? 'Sem categoria'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onEdit(produto)}
                    aria-label={`Editar ${produto.nome}`}
                    className="text-primary-blue hover:underline p-1"
                    title="Editar"
                    disabled={isLoading} // Desabilita se tabela estiver carregando/mutando
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onDelete(produto.id)}
                    className="text-status-error hover:underline p-1"
                    aria-label={`Excluir ${produto.nome}`}
                    title="Excluir"
                     disabled={isLoading} // Desabilita se tabela estiver carregando/mutando
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))
          )}
          {/* Mensagem de Tabela Vazia */}
          {!isLoading && produtos.length === 0 && (
              <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-text-secondary">
                      Nenhum produto encontrado.
                  </td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
ProductsTable.displayName = 'ProductsTable';

// --- Componente de Paginação (Memoizado) ---
const Pagination: React.FC<{
  paginaAtual: number;
  totalPaginas: number;
  onPageChange: (page: number) => void;
  isLoading: boolean; // Desabilita botões durante qualquer loading
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

// --- Página Principal: AdminProducts ---
const AdminProducts: React.FC = () => {
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);

  const termoDebounced = useDebounce(termoBusca, 300);

  // Hook de Produtos (Data Fetching e CUD)
  const {
    data,
    isLoading,         // Loading da busca/paginação
    error,             // Erro da busca/paginação
    mutate,
    handleCreate,
    handleUpdate,
    handleDelete,
    isMutating,        // Loading das operações CUD
    setIsMutating,     // Setter isMutating
    mutationError,     // Erro das operações CUD
    setMutationError,  // Setter mutationError
  } = useAdminProducts(pagina, termoDebounced);

  // Hook de Categorias (Apenas para buscar todas para o Select)
  const {
    categorias,
    isLoading: isLoadingCategorias,
    error: errorCategorias,
  } = useAdminCategories(1, '', 999); // Busca todas de uma vez

  const produtos = data?.data ?? [];
  const totalPaginas = data?.meta?.totalPaginas ?? 1;

  // Handlers da UI
  const handleOpenModal = useCallback((produto: Produto | null) => {
    setProdutoSelecionado(produto);
    setMutationError(null); // Limpa erro CUD anterior
    setModalAberto(true);
  }, [setMutationError]);

  const handleCloseModal = useCallback(() => {
    setProdutoSelecionado(null);
    setModalAberto(false);
  }, []);

  const handleSave = useCallback(async (formData: ProdutoFormData, id?: string): Promise<Produto> => {
    // A lógica de setMutationError, setIsMutating é feita DENTRO do hook agora
    try {
      let result: Produto;
      if (id) {
        result = await handleUpdate(id, formData); // Chama hook
      } else {
        result = await handleCreate(formData); // Chama hook
      }
      handleCloseModal(); // Fecha se sucesso
      mutate();           // Revalida dados
      return result;
    } catch (err) {
      // O erro já foi setado em `mutationError` pelo hook
      // Apenas relançamos para o modal saber que falhou e não fechar
      throw err;
    }
    // O finally para setIsMutating(false) está no hook
  }, [handleCreate, handleUpdate, mutate, handleCloseModal]); // Remove setters daqui

  const handleDeleteConfirm = useCallback(async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
     // A lógica de setMutationError, setIsMutating é feita DENTRO do hook agora
      try {
        await handleDelete(id); // Chama hook
        mutate(); // Revalida
      } catch (err) {
        alert(`Erro ao excluir produto: ${getErrorMessage(err)}`);
        // O erro já foi setado em `mutationError` pelo hook
      }
      // O finally para setIsMutating(false) está no hook
    }
  }, [handleDelete, mutate]); // Remove setters daqui

  const handlePageChange = useCallback((newPage: number) => {
      if (newPage >= 1 && newPage <= totalPaginas) { // Adiciona verificação de totalPaginas
        setPagina(newPage);
      }
  }, [totalPaginas]); // Adiciona totalPaginas como dependência

   // Renderização
   return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gestão de Produtos</h1>
        <Button
          variant="primary"
          onClick={() => handleOpenModal(null)}
          // Desabilita se buscando dados, fazendo CUD ou carregando categorias
          disabled={isLoading || isMutating || isLoadingCategorias}
        >
          <Plus size={20} className="-ml-1 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <Search size={20} className="text-text-secondary" aria-hidden="true" />
        </div>
        <input
          type="search"
          placeholder="Buscar produtos por nome..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          disabled={isMutating} // Desabilita busca durante CUD
          className="
            block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
            leading-5 bg-primary-white text-text-primary placeholder-gray-500
            focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue
            sm:text-sm
          "
        />
      </div>

      {/* Erro da busca de produtos */}
      {error && !isLoading && (
        <ErrorMessage
          title="Erro ao carregar produtos"
          message={getErrorMessage(error)}
        />
      )}
      {/* Erro da busca de categorias */}
      {errorCategorias && !isLoadingCategorias && (
          <ErrorMessage
              title="Erro ao carregar categorias para o formulário"
              message={getErrorMessage(errorCategorias)}
              variant="warning"
          />
      )}

      {/* Tabela */}
      <ProductsTable
        produtos={produtos}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        isLoading={isLoading || isMutating} // Passa loading combinado para desabilitar ações na tabela
      />

      {/* Paginação */}
      <Pagination
        paginaAtual={pagina}
        totalPaginas={totalPaginas}
        onPageChange={handlePageChange}
        isLoading={isLoading || isMutating} // Desabilita botões de paginação
      />

      {/* Modal */}
      {modalAberto && (
        <ProductFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSave={handleSave} // Passa a função intermediária
          produto={produtoSelecionado}
          categorias={categorias ?? []}
          isMutating={isMutating} // Passa estado CUD loading
          mutationError={mutationError} // Passa erro CUD
          isLoadingCategorias={isLoadingCategorias} // Passa loading das categorias
        />
      )}
    </div>
  );
};

export default AdminProducts;
