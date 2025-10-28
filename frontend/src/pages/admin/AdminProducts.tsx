import { useState, useCallback, useEffect } from 'react'; // Removido useMemo não utilizado
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { Categoria, Produto, ProdutoFormData } from '../../types'; // Adicionado ProdutoFormData
import { formatarMoeda, formatarData } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { ProductFormModal } from './components/ProductFormModal';
// import { LoadingSpinner } from '../../components/ui/LoadingSpinner'; // Não usado diretamente
import { SkeletonTable } from '../../components/ui/SkeletonTable';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Pencil, Trash2, Plus, Search } from 'lucide-react'; // Ícones importados
import { useDebounce } from '../../hooks/useDebounce'; // Importar useDebounce
import { Pagination } from '../../components/ui/Pagination'; // Importar Pagination
import { getErrorMessage } from '../../utils/errors'; // Importar getErrorMessage
import { useAdminCategories } from '../../hooks/useAdminCategories'; // Importar hook de categorias


// --- Componente QuickStockAdjust ---
const QuickStockAdjust: React.FC<{
  produto: Produto;
  onSave: (id: string, novaQuantidade: number) => Promise<void>; // Ajustado para Promise<void>
  isMutating: boolean; // Receber estado de mutação
}> = ({ produto, onSave, isMutating }) => {
  const [estoqueLocal, setEstoqueLocal] = useState(produto.estoque);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Estado local para salvar

  const handleSave = async () => {
    if (isSaving || isMutating) return; // Evitar saves múltiplos
    const novaQuantidade = Number(estoqueLocal);
    // Validar se o valor mudou e é válido
    if (novaQuantidade !== produto.estoque && novaQuantidade >= 0) {
        setIsSaving(true);
        try {
          await onSave(produto.id, novaQuantidade);
          // O hook pai (useAdminProducts) lida com o feedback (toast)
        } catch (error) {
           // O hook pai já trata o erro e reverte o estado global se necessário
           // Reverter estado local em caso de erro também
           setEstoqueLocal(produto.estoque);
        } finally {
            setIsSaving(false);
            setIsEditing(false); // Fechar edição após salvar (ou falhar)
        }
    } else {
        // Se não mudou ou é inválido, apenas cancelar edição
        setEstoqueLocal(produto.estoque);
        setIsEditing(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Evitar submit de formulário pai se houver
      handleSave();
    }
    if (e.key === 'Escape') {
      setEstoqueLocal(produto.estoque); // Resetar valor
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
      // Pequeno delay para permitir clique no botão OK se houvesse um
      setTimeout(() => {
        // Só salva no blur se o input ainda estiver visível (não foi fechado pelo Enter/Escape)
        if(isEditing) {
            handleSave();
        }
      }, 150);
  };

  // Abre a edição ao clicar
  const handleEditClick = () => {
      if (!isMutating) { // Não permitir edição se outra operação estiver em andamento
          setIsEditing(true);
      }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 relative">
        <input
          type="number"
          value={estoqueLocal}
          onChange={(e) => setEstoqueLocal(Number(e.target.value))}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur} // Salva ao perder o foco
          className="w-20 px-2 py-1 border rounded-md focus:ring-1 focus:ring-primary-blue focus:border-primary-blue"
          autoFocus // Foco automático ao abrir
          min="0" // Impedir valores negativos no input
          disabled={isSaving} // Desabilitar durante o save local
        />
        {/* Opcional: Indicador de salvamento */}
        {/* {isSaving && <Loader2 size={16} className="animate-spin text-primary-blue absolute right-1 top-1/2 -translate-y-1/2" />} */}
      </div>
    );
  }

  // Visualização normal do estoque
  return (
    <div
      className={`flex items-center gap-2 group ${isMutating ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
      onClick={handleEditClick}
      title="Clique para editar estoque"
    >
      <span>{produto.estoque}</span>
      {/* Ícone de lápis aparece no hover (se não estiver mutando) */}
      {!isMutating && (
          <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil size={14} />
          </span>
      )}
    </div>
  );
};


// --- Componente ProductsTable ---
const ProductsTable: React.FC<{
  produtos: Produto[];
  onEdit: (produto: Produto) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (id: string, novaQuantidade: number) => Promise<void>; // Assinatura ajustada
  isLoading: boolean; // Loading geral (busca)
  isMutating: boolean; // Loading de CUD ou ajuste de estoque
}> = React.memo(({ produtos, onEdit, onDelete, onAdjustStock, isLoading, isMutating }) => {
  return (
    <div className="bg-primary-white rounded-xl shadow-soft overflow-x-auto border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Nome</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Categoria</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Preço</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-32"> {/* Largura fixa para estoque */}
              Estoque (Editar)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Ativo</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
         {/* Mostra Skeleton se carregando E ainda não tem dados */}
          {isLoading && !produtos.length ? (
            <SkeletonTable cols={6} rows={5} />
          ) : (
            produtos.map((produto) => (
              <tr key={produto.id} className="hover:bg-background-light-blue transition-colors duration-150">
                {/* Nome */}
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center">
                        {/* Opcional: Imagem pequena */}
                        {produto.imagemUrl && (
                             <img src={produto.imagemUrl} alt={produto.nome} className="w-10 h-10 object-cover rounded-md mr-3 flex-shrink-0" />
                        )}
                         <div className="text-sm font-medium text-text-primary truncate">{produto.nome}</div>
                   </div>
                </td>
                {/* Categoria */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{produto.categoria?.nome || 'N/A'}</div>
                </td>
                {/* Preço */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{formatarMoeda(produto.preco)}</div>
                </td>
                {/* Estoque Editável */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <QuickStockAdjust
                    produto={produto}
                    onSave={onAdjustStock}
                    isMutating={isMutating} // Passar estado de mutação
                  />
                </td>
                {/* Ativo */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    produto.ativo ? 'bg-status-success-bg text-status-success-text' : 'bg-status-error-bg text-status-error-text' // Usar cores de status
                  }`}>
                    {produto.ativo ? 'Sim' : 'Não'}
                  </span>
                </td>
                {/* Ações */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button variant="link" size="sm" onClick={() => onEdit(produto)} disabled={isMutating} title="Editar"> {/* Usar link */}
                    <Pencil size={16} />
                  </Button>
                  <Button variant="link" size="sm" onClick={() => onDelete(produto.id)} disabled={isMutating} className="text-status-error" title="Excluir"> {/* Usar link e cor de erro */}
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))
          )}
           {/* Mensagem se não houver produtos e não estiver carregando */}
           {!isLoading && produtos.length === 0 && (
             <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-text-secondary">
                    Nenhum produto encontrado com os filtros atuais.
                </td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
ProductsTable.displayName = 'ProductsTable';


// --- Componente principal (AdminProducts) ---
export default function AdminProducts() {
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEdit, setProdutoEdit] = useState<Produto | null>(null);

  const termoDebounced = useDebounce(termoBusca, 300); // Debounce na busca

  // Hook para buscar e gerenciar produtos
  const {
    data: paginatedResponse, // Renomeado para evitar conflito com 'produtos' abaixo
    isLoading, // Loading da busca
    error: fetchError, // Erro da busca (unknown)
    isMutating, // Loading das operações CUD + Ajuste Estoque
    mutationError, // Erro das operações CUD + Ajuste Estoque (unknown)
    setMutationError, // Para limpar o erro do modal
    setPagina, // Função do hook para mudar a página (agora usamos o estado local)
    // setTermoBusca, // Função do hook (agora usamos o estado local)
    // termoBusca: hookTermoBusca, // Termo do hook (agora usamos o estado local)
    fetchData, // Função para revalidar/rebuscar
    handleCreate,
    handleUpdate,
    handleDelete,
    handleAdjustStock,
  } = useAdminProducts(pagina, termoDebounced); // Passar estado local para o hook

  // Hook para buscar categorias (necessário para o modal)
  const { data: categoriasResponse, isLoading: isLoadingCategorias, error: categoriasError } = useAdminCategories(1, '', 1000); // Buscar todas categorias (limite alto)
  const categorias = categoriasResponse?.data ?? [];

  const produtos = paginatedResponse?.data ?? [];
  const meta = paginatedResponse?.meta;

  const totalPaginas = useMemo(() => {
    if (!meta) return 1;
    return meta.totalPaginas || 1;
  }, [meta]);


  // Funções para controle do modal
  const handleOpenModal = useCallback((produto: Produto | null = null) => {
    setProdutoEdit(produto);
    setMutationError(null); // Limpar erro anterior
    setModalAberto(true);
  }, [setMutationError]);

  const handleCloseModal = useCallback(() => {
    setProdutoEdit(null);
    setModalAberto(false);
  }, []);

  // Função para salvar (criar ou editar) - chamada pelo modal
  const handleSave = useCallback(async (formData: ProdutoFormData, id?: string): Promise<void> => {
    try {
      if (id) {
        await handleUpdate(id, formData);
      } else {
        await handleCreate(formData);
      }
      handleCloseModal();
      // O hook já chama fetchData internamente após sucesso, mas podemos chamar aqui para garantir
      // fetchData(); // Ou usar a função mutate se o hook a exportasse
      // Opcional: Toast de sucesso
    } catch (err) {
      // O erro já é tratado no hook e passado via mutationError para o modal
       console.error("Erro no handleSave (AdminProducts):", err);
       // Não precisa re-lançar
    }
  }, [handleCreate, handleUpdate, handleCloseModal]); // Remover fetchData daqui se o hook já revalida

  // Função para confirmar e deletar produto
  const handleDeleteConfirm = useCallback(async (id: string) => {
      const produtoParaExcluir = produtos.find(p => p.id === id);
      if (!produtoParaExcluir) return;

       if (window.confirm(`Tem certeza que deseja excluir o produto "${produtoParaExcluir.nome}"? Esta ação não pode ser desfeita.`)) {
         try {
           await handleDelete(id);
           // Se a página atual ficar vazia após a exclusão e não for a primeira página, volte uma página
           if (produtos.length === 1 && pagina > 1) {
              setPagina(pagina - 1);
           } else {
             // O hook já chama fetchData internamente após sucesso, mas podemos chamar aqui para garantir
             // fetchData(); // Ou usar a função mutate se o hook a exportasse
           }
           // Opcional: Adicionar toast de sucesso
         } catch (err) {
           // Exibe erro específico retornado pelo hook/serviço
           alert(`Erro ao excluir produto: ${getErrorMessage(err)}`);
         }
       }
  }, [handleDelete, produtos, pagina]); // Remover fetchData daqui se o hook já revalida

   // Navega entre as páginas
   const handlePageChange = useCallback((newPage: number) => {
     if (newPage >= 1 && newPage <= totalPaginas) {
       setPagina(newPage);
     }
   }, [totalPaginas]);

   // Volta para a página 1 quando o termo de busca muda
   useEffect(() => {
       setPagina(1);
   }, [termoDebounced]);

   // Converte erro geral de busca para string
   const displayFetchError = fetchError ? getErrorMessage(fetchError) : null;
   // Converte erro de busca de categorias para string
   const displayCategoriasError = categoriasError ? getErrorMessage(categoriasError) : null;


  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Gerenciamento de Produtos</h1>
        <Button onClick={() => handleOpenModal(null)} disabled={isLoading || isMutating || isLoadingCategorias}>
          <Plus size={18} className="mr-1" /> Novo Produto
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <Search size={20} className="text-text-secondary" aria-hidden="true" />
        </div>
        <input
          type="search"
          placeholder="Buscar produtos por nome..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          disabled={isMutating} // Desabilitar durante CUD
          className="
            block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
            leading-5 bg-primary-white text-text-primary placeholder-text-secondary/70
            focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue
            sm:text-sm transition-colors duration-150
          "
        />
      </div>

      {/* Mensagem de Erro (Busca de Produtos ou Categorias) */}
      {(displayFetchError && !isLoading) && <ErrorMessage message={displayFetchError} title="Erro ao Carregar Produtos"/>}
      {(displayCategoriasError && !isLoadingCategorias) && <ErrorMessage message={`Erro ao carregar categorias: ${displayCategoriasError}`} title="Erro Interno"/>}


      {/* Tabela de Produtos */}
      <ProductsTable
        produtos={produtos}
        onEdit={handleOpenModal}
        onDelete={handleDeleteConfirm}
        onAdjustStock={handleAdjustStock}
        isLoading={isLoading} // Passar apenas o loading da busca aqui
        isMutating={isMutating} // Passar o loading das mutações (CUD, estoque)
      />

      {/* Paginação */}
      {meta && (
          <Pagination
            paginaAtual={meta.pagina}
            totalPaginas={totalPaginas}
            onPageChange={handlePageChange}
            isLoading={isLoading || isMutating} // Desabilitar durante busca ou CUD/estoque
          />
       )}


      {/* Modal de Formulário */}
      {modalAberto && (
        <ProductFormModal
          isOpen={modalAberto}
          onClose={handleCloseModal}
          onSave={handleSave}
          produto={produtoEdit}
          categorias={categorias} // Passar categorias buscadas
          isMutating={isMutating} // Passar estado de mutação CUD
          mutationError={mutationError} // Passar erro CUD
          isLoadingCategorias={isLoadingCategorias} // Passar estado de loading das categorias
        />
      )}
    </div>
  );
}
