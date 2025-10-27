// src/hooks/usePOS.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Categoria, Produto, Pedido, PedidoItem, PaginatedResponse, StatusPedido } from '../types';
import { getErrorMessage } from '../utils/errors';
import { logError } from '../utils/logger';

// Estado inicial do pedido local
const estadoInicialPedido: Pedido = {
  id: 'local-cart',
  status: StatusPedido.LOCAL,
  valor_total: 0, // <<< CORRIGIDO AQUI
  itens: [],
  criado_em: new Date().toISOString(),
  atualizado_em: new Date().toISOString(),
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
      // Reset states at the beginning
      setIsLoadingProdutos(true);
      setIsLoadingCategorias(true);
      setErrorProdutos(null);
      setErrorCategorias(null);
  
      try {
        // Fetch categories first
        try {
          const catRes = await api.get<Categoria[]>('/categorias');
          setCategorias(catRes.data);
          setCategoriaAtiva(null); // Set default category after fetching
        } catch (err) {
          setErrorCategorias(err);
          logError('Erro ao carregar categorias:', err);
        } finally {
          setIsLoadingCategorias(false);
        }
  
        // Then fetch products
        try {
          const prodRes = await api.get<PaginatedResponse<Produto>>('/produtos', {
              params: { pagina: 1, limite: 999 } // Fetch all products
          });
          setProdutos(prodRes.data.data);
        } catch (err) {
          setErrorProdutos(err);
          logError('Erro ao carregar produtos:', err);
        } finally {
          setIsLoadingProdutos(false);
        }
  
      } catch (err) {
        // General error handling (less likely needed if individual try/catches are used)
        const message = getErrorMessage(err);
        setErrorProdutos(message); // Set both errors if there's a general fetch issue
        setErrorCategorias(message);
        setIsLoadingProdutos(false);
        setIsLoadingCategorias(false);
      }
    };
    loadData();
  }, []); // Empty dependency array means this runs once on mount
  

  const produtosFiltrados = useMemo(() => {
    if (categoriaAtiva === null) {
      return produtos; // "Todos"
    }
    return produtos.filter((produto) => produto.categoria?.id === categoriaAtiva);
  }, [produtos, categoriaAtiva]);

  // Calcula o total do pedido local
  const total = useMemo(() => {
    return pedido.itens.reduce((acc, item) => {
      return acc + item.preco * item.quantidade; // Use item.preco for consistency
    }, 0);
  }, [pedido.itens]);

  const handleAddToCart = useCallback((produto: Produto) => {
    setPedido((prevPedido) => {
      const itemExistente = prevPedido.itens.find(
        (i) => i.produto.id === produto.id
      );

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
          preco: produto.preco, // Armazena o preço no momento da adição
          pedidoId: 'local-cart',
        };
        novosItens = [...prevPedido.itens, novoItem];
      }

      // Calcula o novo total
      const novoTotal = novosItens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

      return { ...prevPedido, itens: novosItens, valor_total: novoTotal }; // Atualiza valor_total
    });
  }, []); // Sem dependência 'total'

  const handleUpdateQuantity = useCallback((itemId: string, novaQuantidade: number) => {
    setPedido((prevPedido) => {
      let novosItens: PedidoItem[];

      if (novaQuantidade <= 0) {
        novosItens = prevPedido.itens.filter((i) => i.id !== itemId);
      } else {
        const item = prevPedido.itens.find((i) => i.id === itemId);
        if (item && novaQuantidade > item.produto.quantidadeEstoque) {
          alert(`Estoque insuficiente. Disponível: ${item.produto.quantidadeEstoque}`);
          return prevPedido;
        }
        novosItens = prevPedido.itens.map((i) =>
          i.id === itemId ? { ...i, quantidade: novaQuantidade } : i
        );
      }
      // Calcula o novo total
      const novoTotal = novosItens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
      return { ...prevPedido, itens: novosItens, valor_total: novoTotal }; // Atualiza valor_total
    });
  }, []);

  const handleRemoveFromCart = useCallback((itemId: string) => {
    setPedido((prevPedido) => {
      const novosItens = prevPedido.itens.filter((item) => item.id !== itemId);
      const novoTotal = novosItens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
      return {
        ...prevPedido,
        itens: novosItens,
        valor_total: novoTotal, // Atualiza valor_total
      };
    });
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
    // Garante que o total está atualizado antes de salvar
    const currentTotal = pedido.itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
    localStorage.setItem('pedidoLocal', JSON.stringify({ ...pedido, valor_total: currentTotal }));
    navigate('/vendas/pagamento');
  }, [pedido, navigate]);

  return {
    pedido,
    total, // O total calculado ainda é útil para exibir na UI
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
