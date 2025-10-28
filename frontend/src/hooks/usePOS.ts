import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Produto,
  Categoria,
  PedidoItem,
  PaginatedResponse,
  ApiMeta,
} from '../types';
import { logError } from '../utils/logger';
import { useDebounce } from './useDebounce';

// Estado do carrinho
const useCart = () => {
  // (Lógica do carrinho movida para cá para organizar)
  // ... (useState<PedidoItem[]>, onAddToCart, onRemove, etc.)
  // Por simplicidade, manteremos no hook principal por enquanto.
};

export const usePOS = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | 'todos'>(
    'todos',
  );
  
  // --- Novos estados para Paginação e Busca ---
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const debouncedTermoBusca = useDebounce(termoBusca, 300); // 300ms debounce

  const [pedido, setPedido] = useState<PedidoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Buscar Categorias (executa 1 vez)
  const fetchCategorias = useCallback(async () => {
    try {
      // Categorias não precisam de paginação no PDV
      const { data } = await api.get<Categoria[]>('/api/categorias');
      setCategorias(data);
    } catch (err) {
      logError('Erro ao buscar categorias', err);
      setError('Falha ao carregar categorias.');
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // Buscar Produtos (agora paginado e com busca)
  const fetchProdutos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('pagina', String(pagina));
      params.append('limite', '12'); // Limite de 12 produtos por página

      if (categoriaAtiva !== 'todos') {
        params.append('categoriaId', categoriaAtiva);
      }
      if (debouncedTermoBusca) {
        params.append('termo', debouncedTermoBusca);
      }

      const { data } = await api.get<PaginatedResponse<Produto>>(
        `/api/produtos?${params.toString()}`,
      );
      
      setProdutos(data.dados);
      setMeta(data.meta);
    } catch (err) {
      logError('Erro ao buscar produtos', err);
      setError('Falha ao carregar produtos.');
      setProdutos([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, categoriaAtiva, debouncedTermoBusca]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  // Resetar página ao mudar filtro
  useEffect(() => {
    setPagina(1);
  }, [categoriaAtiva, debouncedTermoBusca]);
  
  // --- Funções de Paginação ---
  const irParaPagina = (novaPagina: number) => {
    if (novaPagina > 0 && (!meta || novaPagina <= meta.totalPaginas)) {
      setPagina(novaPagina);
    }
  };

  // ... (Lógica do carrinho: onAddToCart, onRemove, onUpdateQuantity, total)
  // ... (handleIrParaPagamento)
  // (O restante do hook permanece o mesmo)

  // (Lógica do carrinho - omitida para brevidade)
  const onAddToCart = (produto: Produto) => { /* ... */ };
  const onRemove = (produtoId: string) => { /* ... */ };
  const onUpdateQuantity = (produtoId: string, novaQuantidade: number) => { /* ... */ };
  const limparCarrinho = () => setPedido([]);
  
  const total = useMemo(() => {
    return pedido.reduce((acc, item) => acc + item.precoVenda * item.quantidade, 0);
  }, [pedido]);

  const handleIrParaPagamento = () => {
    if (pedido.length === 0) {
      // (Substituir por Toast - RF24)
      alert('O carrinho está vazio.');
      return;
    }
    // Salvar no localStorage (ou Zustand/Contexto)
    localStorage.setItem('paodoceu-carrinho', JSON.stringify(pedido));
    localStorage.setItem('paodoceu-total', JSON.stringify(total));
    navigate('/vendas/pagamento');
  };

  return {
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
    // Exportar novos controles
    termoBusca,
    setTermoBusca,
    meta,
    irParaPagina,
    pagina,
  };
};

