import { usePOS } from '../hooks/usePOS';
import { formatarMoeda } from '../utils/formatters';
import { ProductCard } from '../components/common/ProductCard';
import { OrderSummary } from '../components/common/OrderSummary';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Button } from '../components/common/Button';
// CORREÇÃO (Erro 21, 22): Removido 'ChevronLeft', 'ChevronRight'
import { Search, XCircle } from 'lucide-react';
// CORREÇÃO (Erro 24): Adicionada importação do Pagination
import { Pagination } from '../components/ui/Pagination';

export default function POS() {
  const {
    produtos,
    categorias,
    categoriaAtiva,
    setCategoriaAtiva,
    pedido,
    total,
    isLoading,
    error,
    onAddToCart,
    onRemove,
    onUpdateQuantity,
    limparCarrinho,
    handleIrParaPagamento,
    termoBusca,
    setTermoBusca,
    meta,
    irParaPagina,
    // CORREÇÃO (Erro 23): Removida 'pagina' (não utilizada)
    // pagina,
  } = usePOS();

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Coluna de Produtos (Esquerda) */}
      <div className="flex-1 flex flex-col p-6 bg-gray-50 overflow-hidden">

        {/* --- Filtros (Busca e Categorias) --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 flex-shrink-0">
          {/* Campo de Busca */}
          <div className="relative flex-1">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-text-secondary" aria-hidden="true" />
             </div>
            <input
              type="search"
              placeholder="Buscar produto por nome..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="
                block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
                leading-5 bg-primary-white text-text-primary placeholder-text-secondary/70
                focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-blue focus:border-primary-blue
                sm:text-sm transition-colors duration-150
              "
            />
          </div>

          {/* Filtro de Categoria */}
          <select
            value={categoriaAtiva}
            onChange={(e) => setCategoriaAtiva(e.target.value)}
             className="
                w-full md:w-56 border border-gray-300 rounded-lg pl-3 pr-8 py-2 bg-primary-white
                text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-blue focus:border-primary-blue
                sm:text-sm appearance-none cursor-pointer transition-colors duration-150
             "
            aria-label="Filtrar por categoria"
          >
            <option value="todos">Todas as Categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome} ({cat._count?.produtos ?? 0})
              </option>
            ))}
          </select>
        </div>

        {/* --- Grid de Produtos --- */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-4">
            {isLoading && (
              <div className="flex-1 flex items-center justify-center pt-16">
                <LoadingSpinner size={40} />
              </div>
            )}

            {error && !isLoading && (
              <div className="flex-1 flex items-center justify-center pt-16">
                <ErrorMessage message={error} title="Erro ao Carregar Produtos" />
              </div>
            )}

            {!isLoading && !error && produtos.length === 0 && (
              <div className="flex-1 flex items-center justify-center pt-16">
                <p className="text-text-secondary text-lg">
                  {termoBusca || categoriaAtiva !== 'todos'
                    ? 'Nenhum produto encontrado com os filtros aplicados.'
                    : 'Nenhum produto disponível no momento.'}
                </p>
              </div>
            )}

            {!isLoading && !error && produtos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {produtos.map((produto) => (
                  <ProductCard
                    key={produto.id}
                    produto={produto}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            )}
        </div>

        {/* --- Paginação (fora da área de scroll dos produtos) --- */}
         {meta && meta.totalPaginas > 1 && (
             <div className="flex-shrink-0 pt-4">
                {/* CORREÇÃO (Erro 24): Componente 'Pagination' agora é renderizado corretamente */}
                <Pagination
                    paginaAtual={meta.pagina}
                    totalPaginas={meta.totalPaginas}
                    onPageChange={irParaPagina}
                    isLoading={isLoading}
                />
            </div>
         )}

      </div>

      {/* Coluna do Pedido (Direita) */}
      <aside className="w-80 md:w-96 bg-primary-white border-l border-gray-200 shadow-lg flex flex-col">
        <OrderSummary
          pedido={pedido}
          total={total}
          onItemUpdateQuantity={onUpdateQuantity}
          onItemRemove={onRemove}
        >
            <Button
                variant="secondary"
                size="sm"
                onClick={limparCarrinho}
                disabled={pedido.itens.length === 0 || isLoading}
                className="w-full text-status-error hover:bg-status-error/10"
            >
                <XCircle size={16} className="mr-1"/> Limpar Carrinho
            </Button>
        </OrderSummary>
        <div className="p-6 mt-auto border-t border-gray-200 bg-gray-50">
          <Button
            size="lg"
            className="w-full"
            onClick={handleIrParaPagamento}
            disabled={pedido.itens.length === 0 || isLoading}
          >
            Ir para Pagamento ({formatarMoeda(total)})
          </Button>
        </div>
      </aside>
    </div>
  );
}
