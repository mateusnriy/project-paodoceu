import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import api from '../services/api'; // Remover se usar camada de serviço
import { productService } from '../services/productService'; // <<< USAR CAMADA DE SERVIÇO
import { categoryService } from '../services/categoryService'; // <<< USAR CAMADA DE SERVIÇO
import {
  Produto,
  Categoria,
  PaginatedResponse,
  ApiMeta,
  Pedido, // Manter Pedido para o objeto de exibição
} from '../types';
import { logError } from '../utils/logger';
import { useDebounce } from './useDebounce';
import { useCart } from './useCart'; // <<< Importar useCart
import { getErrorMessage } from '../utils/errors'; // <<< Importar getErrorMessage

export const usePOS = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | 'todos'>(
    'todos',
  );

  // --- Estados de Paginação e Busca ---
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [pagina, setPagina] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const debouncedTermoBusca = useDebounce(termoBusca, 300);

  const [isLoading, setIsLoading] = useState(true); // Loading para produtos/categorias
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // <<< Usar o hook do carrinho >>>
  const { pedidoItens, total, onAddToCart, onRemove, onUpdateQuantity, limparCarrinho } = useCart();

  // Buscar Categorias (executa 1 vez)
  const fetchCategorias = useCallback(async () => {
    // Não precisa de setIsLoading aqui, pois o loading principal é dos produtos
    try {
      // const { data } = await api.get<Categoria[]>('/categorias'); // <<< REMOVER
      const data = await categoryService.listAll(); // <<< USAR SERVIÇO
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
        const params = {
           pagina,
           limite: 12, // Limite de 12 produtos por página no PDV
           categoriaId: categoriaAtiva === 'todos' ? undefined : categoriaAtiva,
           termo: debouncedTermoBusca || undefined,
           // incluirInativos: false, // O backend deve filtrar ativos por padrão para o PDV
        };
      // const { data } = await api.get<PaginatedResponse<Produto>>(/* ... */); // <<< REMOVER
      const responseData = await productService.list(params); // <<< USAR SERVIÇO
      setProdutos(responseData.data); // Corrigido para responseData.data
      setMeta(responseData.meta);
    } catch (err) {
      logError('Erro ao buscar produtos', err);
      setError(getErrorMessage(err)); // Usar getErrorMessage
      setProdutos([]); // Limpar produtos em caso de erro
      setMeta(null); // Limpar meta em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, [pagina, categoriaAtiva, debouncedTermoBusca]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]); // Dependência correta

  // Resetar página ao mudar filtro de categoria ou busca
  useEffect(() => {
    setPagina(1);
  }, [categoriaAtiva, debouncedTermoBusca]);

  // --- Funções de Paginação ---
  const irParaPagina = (novaPagina: number) => {
    // Adicionar verificação de limites
    if (novaPagina > 0 && (!meta || novaPagina <= meta.totalPaginas)) {
      setPagina(novaPagina);
    }
  };

  const handleIrParaPagamento = () => {
    if (pedidoItens.length === 0) {
      alert('O carrinho está vazio.'); // (Substituir por Toast - RF24)
      return;
    }
    // O useCart já salva no localStorage
    navigate('/vendas/pagamento');
  };

   // Criar um objeto Pedido simulado para passar para OrderSummary
   const pedidoParaExibicao = useMemo((): Pedido => ({
      id: 'local', // ID Fixo para o carrinho local
      itens: pedidoItens,
      valor_total: total,
      status: 'LOCAL', // Status especial
      // Usar a data de criação persistida se existir, senão a atual
      criado_em: localStorage.getItem('pedidoLocal') ? JSON.parse(localStorage.getItem('pedidoLocal')!).criado_em : new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      numero_sequencial_dia: 0, // Não aplicável localmente
   }), [pedidoItens, total]);


  return {
    produtos,
    categorias,
    categoriaAtiva,
    setCategoriaAtiva,
    pedido: pedidoParaExibicao, // Passar o objeto Pedido simulado
    total,
    isLoading,
    error,
    onAddToCart, // Vindo do useCart
    onRemove, // Vindo do useCart
    onUpdateQuantity, // Vindo do useCart
    limparCarrinho, // Vindo do useCart
    handleIrParaPagamento,
    // Exportar controles de paginação/busca
    termoBusca,
    setTermoBusca,
    meta,
    irParaPagina,
    pagina, // Exportar página atual
  };
};
