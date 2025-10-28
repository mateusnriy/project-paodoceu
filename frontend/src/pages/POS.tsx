import { usePOS } from '../hooks/usePOS';
import { formatarMoeda } from '../utils/formatters';
import { ProductCard } from '../components/common/ProductCard';
import { OrderSummary } from '../components/common/OrderSummary';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Button } from '../components/common/Button';

// (Assumindo que ícones (ex: Search, ChevronLeft, ChevronRight)
// estão disponíveis ou são importados de 'lucide-react')
// import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

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
    handleIrParaPagamento,
    // Importar novos estados
    termoBusca,
    setTermoBusca,
    meta,
    irParaPagina,
    pagina,
  } = usePOS();

  return (
    <div className="flex h-[calc(100vh-4rem)]"> {/* Subtrai altura do Header */}
      {/* Coluna de Produtos (Esquerda) */}
      <div className="flex-1 flex flex-col p-4 bg-gray-50 overflow-y-auto">
        
        {/* --- Filtros (Busca e Categorias) --- */}
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar produto por nome..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {/* Ícone de Lupa (Exemplo) */}
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {/* <Search size={20} /> */}
              (Lupa)
            </span>
          </div>
          
          {/* Filtro de Categoria */}
          <select
            value={categoriaAtiva}
            onChange={(e) => setCategoriaAtiva(e.target.value)}
            className="w-full md:w-48 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="todos">Todas as Categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>

        {/* --- Grid de Produtos --- */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner className="h-10 w-10" />
          </div>
        )}

        {error && !isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <ErrorMessage message={error} />
          </div>
        )}

        {!isLoading && !error && produtos.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          </div>
        )}

        {!isLoading && !error && produtos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {produtos.map((produto) => (
              <ProductCard
                key={produto.id}
                produto={produto}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}

        {/* --- Paginação --- */}
        {meta && meta.totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button
              onClick={() => irParaPagina(pagina - 1)}
              disabled={!meta.hasAnterior || isLoading}
              variant="outline"
            >
              {/* <ChevronLeft size={16} /> */}
              Anterior
            </Button>
            <span className="text-gray-700 font-medium">
              Página {meta.pagina} de {meta.totalPaginas}
            </span>
            <Button
              onClick={() => irParaPagina(pagina + 1)}
              disabled={!meta.hasNext || isLoading}
              variant="outline"
            >
              Próximo
              {/* <ChevronRight size={16} /> */}
            </Button>
          </div>
        )}

      </div>

      {/* Coluna do Pedido (Direita) */}
      <aside className="w-80 md:w-96 bg-white border-l shadow-lg flex flex-col">
        <OrderSummary
          itens={pedido}
          total={total}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
        />
        <div className="p-4 mt-auto border-t">
          <Button
            size="lg"
            className="w-full"
            onClick={handleIrParaPagamento}
            disabled={pedido.length === 0}
          >
            Ir para Pagamento ({formatarMoeda(total)})
          </Button>
        </div>
      </aside>
    </div>
  );
}

