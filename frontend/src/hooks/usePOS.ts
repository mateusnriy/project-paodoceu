// frontend/src/hooks/usePOS.ts
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { useCartStore } from './useCart';
import { getErrorMessage } from '@/utils/errors';
import {
  Categoria,
  Pedido,
  Produto,
  StatusPedido,
  ApiMeta,
} from '@/types';
import { useDebounce } from './useDebounce';

const POS_PAGE_LIMIT = 12;

export function usePOS() {
  const navigate = useNavigate();

  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [pagina, setPagina] = useState(1);

  const termoDebounced = useDebounce(termoBusca, 300);

  const {
    items,
    clienteNome,
    total,
    actions: { onAddToCart, onRemove, onUpdateQuantity, setClienteNome, clearCart: limparCarrinho }, // Renomear clearCart aqui
  } = useCartStore();

  const { data: categoriasData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categorias-pos'],
    queryFn: () => categoryService.listAll(),
    staleTime: 1000 * 60 * 5,
    select: (data: Categoria[]) => {
      return data.filter((c) => c._count && c._count.produtos > 0);
    },
  });

  const {
    data: paginatedProducts,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: [
      'produtos-pos',
      categoriaAtiva,
      termoDebounced,
      pagina,
      POS_PAGE_LIMIT,
    ],
    queryFn: async () => {
      const response = await productService.list({
        categoriaId: categoriaAtiva,
        nome: termoDebounced || undefined,
        pagina: pagina,
        limite: POS_PAGE_LIMIT,
      });
      return response;
    },
    staleTime: 1000 * 60,
  });

  // CORREÇÃO (Erro 10): Removida a função 'handleIrParaPagamento' assíncrona
  // que estava duplicada e não era usada.

  // Esta é a função correta que é retornada pelo hook
  const handleNavigateToPayment = () => {
     if (items.length === 0) {
      toast.error('O carrinho está vazio.');
      return;
    }
    
    // Salva o carrinho atual no localStorage 'pedidoLocal'
    // para o usePaymentHandler ler na próxima página.
    // (O usePaymentHandler também tem um fallback para o store do zustand)
    const pedidoParaPagamento: Pedido = {
        id: 'local-checkout',
        itens: items,
        valor_total: total,
        cliente_nome: clienteNome,
        status: StatusPedido.LOCAL,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
    };
    localStorage.setItem('pedidoLocal', JSON.stringify(pedidoParaPagamento));

    navigate('/vendas/pagamento');
  }

  const produtos: Produto[] = paginatedProducts?.data ?? [];
  const meta: ApiMeta | null = paginatedProducts?.meta ?? null;

  const pedidoSimulado: Pedido = useMemo(
    () => ({
      id: 'local',
      itens: items,
      valor_total: total,
      status: StatusPedido.LOCAL,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      cliente_nome: clienteNome,
    }),
    [items, total, clienteNome],
  );

  return {
    // Estado (Produtos e Categorias)
    produtos,
    meta,
    categorias: categoriasData || [],
    isLoading: isLoadingCategories || isLoadingProducts,
    error: productsError ? getErrorMessage(productsError) : null,

    // Estado (Filtros e Paginação)
    categoriaAtiva,
    setCategoriaAtiva,
    termoBusca,
    setTermoBusca,
    pagina,
    irParaPagina: setPagina,

    // Estado (Carrinho - vindo do Store)
    pedido: pedidoSimulado,
    total,
    
    // Ações (Carrinho - vindo do Store)
    onAddToCart,
    onRemove,
    onUpdateQuantity,
    limparCarrinho, // (Erro 11 já estava corrigido)
    setClienteNome,

    // Ações (Pagamento)
    handleIrParaPagamento: handleNavigateToPayment,
    isSubmitting: false, // (Não é mais usado)
  };
}
