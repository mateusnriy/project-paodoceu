// mateusnriy/project-paodoceu/project-paodoceu-main/frontend/src/hooks/usePOS.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
// <<< CORREÇÃO: Importar PaginatedResponse >>>
import { Categoria, Produto, Pedido, PedidoItem, PaginatedResponse } from '../types';
import { getErrorMessage } from '../utils/errors';
import { logError } from '../utils/logger';

// Estado inicial do pedido local
const estadoInicialPedido: Pedido = {
  id: 'local-cart',
  status: 'LOCAL',
  total: 0,
  senha: '',
  itens: [],
  dataCriacao: new Date().toISOString(),
  dataAtualizacao: new Date().toISOString(),
};

export const usePOS = () => {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [pedido, setPedido] = useState<Pedido>(estadoInicialPedido);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(true);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(true);
  const [errorProdutos, setErrorProdutos] = useState<unknown>(null);
  const [errorCategorias, setErrorCategorias] = useState<unknown>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingProdutos(true);
        setIsLoadingCategorias(true);
        setErrorProdutos(null);
        setErrorCategorias(null);

        // Busca categorias
        try {
          // <<< CORREÇÃO: Chamar /api/categorias SEM paginação (lógica do controller) >>>
          const catRes = await api.get<Categoria[]>('/categorias');
          setCategorias(catRes.data); // Espera um array simples
          setCategoriaAtiva(null); 
        } catch (err) {
          setErrorCategorias(err);
          logError('Erro ao carregar categorias:', err);
        } finally {
          setIsLoadingCategorias(false);
        }

        // Busca todos os produtos
        try {
          // <<< CORREÇÃO: Chamar /api/produtos COM limite alto >>>
          const prodRes = await api.get<PaginatedResponse<Produto>>('/produtos', {
              params: { pagina: 1, limite: 999 } // Limite alto
          });
          setProdutos(prodRes.data.data); // <<< Acessar data.data
        } catch (err) {
          setErrorProdutos(err);
          logError('Erro ao carregar produtos:', err);
        } finally {
          setIsLoadingProdutos(false);
        }
      } catch (err) {
        const message = getErrorMessage(err);
        setErrorProdutos(message);
        setErrorCategorias(message);
        setIsLoadingProdutos(false);
        setIsLoadingCategorias(false);
      }
    };
    loadData();
  }, []);

  const produtosFiltrados = useMemo(() => {
    if (categoriaAtiva === null) {
      return produtos; // "Todos"
    }
    // <<< CORREÇÃO: Acessar produto.categoria.id >>>
    return produtos.filter((produto) => produto.categoria?.id === categoriaAtiva);
  }, [produtos, categoriaAtiva]);

  const total = useMemo(() => {
    return pedido.itens.reduce((acc, item) => {
      return acc + item.produto.preco * item.quantidade;
    }, 0);
  }, [pedido.itens]);

  const handleAddToCart = useCallback((produto: Produto) => {
    setPedido((prevPedido) => {
      const itemExistente = prevPedido.itens.find(
        (i) => i.produto.id === produto.id
      );

      // <<< CORREÇÃO: Usar 'quantidadeEstoque' do tipo Produto >>>
      const novaQuantidade = (itemExistente?.quantidade || 0) + 1;
      if (novaQuantidade > produto.quantidadeEstoque) {
        alert(`Estoque insuficiente. Disponível: ${produto.quantidadeEstoque}`);
        return prevPedido;
      }

      let novosItens: PedidoItem[];
      if (itemExistente) {
        novosItens = prevPedido.itens.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: novaQuantidade }
            : item
        );
      } else {
        const novoItem: PedidoItem = {
          id: `item-${produto.id}`,
          produto: produto,
          quantidade: 1,
          preco: produto.preco,
          pedidoId: 'local-cart',
        };
        novosItens = [...prevPedido.itens, novoItem];
      }

      return { ...prevPedido, itens: novosItens };
    });
  }, []);

  const handleUpdateQuantity = useCallback((itemId: string, novaQuantidade: number) => {
    setPedido((prevPedido) => {
      if (novaQuantidade <= 0) {
        const novosItens = prevPedido.itens.filter((i) => i.id !== itemId);
        return { ...prevPedido, itens: novosItens };
      }

      const item = prevPedido.itens.find((i) => i.id === itemId);
      // <<< CORREÇÃO: Usar 'quantidadeEstoque' do tipo Produto >>>
      if (item && novaQuantidade > item.produto.quantidadeEstoque) {
        alert(`Estoque insuficiente. Disponível: ${item.produto.quantidadeEstoque}`);
        return prevPedido;
      }

      const novosItens = prevPedido.itens.map((i) =>
        i.id === itemId ? { ...i, quantidade: novaQuantidade } : i
      );
      return { ...prevPedido, itens: novosItens };
    });
  }, []);

  const handleRemoveFromCart = useCallback((itemId: string) => {
    setPedido((prevPedido) => ({
      ...prevPedido,
      itens: prevPedido.itens.filter((item) => item.id !== itemId),
    }));
  }, []);

  const handleLimparCarrinho = useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
      setPedido(estadoInicialPedido);
    }
  }, []);

  const handleNavigateToPayment = useCallback(() => {
    if (pedido.itens.length === 0) {
      alert('O carrinho está vazio.');
      return;
    }
    localStorage.setItem('pedidoLocal', JSON.stringify({ ...pedido, total }));
    navigate('/vendas/pagamento');
  }, [pedido, total, navigate]);

  return {
    pedido,
    total,
    produtosFiltrados,
    categorias,
    categoriaAtiva,
    setCategoriaAtiva,
    isLoadingProdutos,
    isLoadingCategorias,
    errorProdutos,
    errorCategorias,
    handleAddToCart,
    handleRemoveFromCart,
    handleUpdateQuantity,
    handleLimparCarrinho,
    handleNavigateToPayment,
  };
};
