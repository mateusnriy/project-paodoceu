import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Categoria, Produto, Pedido, PedidoItem } from '../types';
import { getErrorMessage } from '../utils/errors';
import { logError } from '../utils/logger';

// Estado inicial do pedido local
const estadoInicialPedido: Pedido = {
  id: 'local-cart', // ID provisório para o carrinho local
  status: 'LOCAL',
  total: 0,
  senha: '',
  itens: [],
  dataCriacao: new Date().toISOString(),
  dataAtualizacao: new Date().toISOString(),
};

/**
 * @hook usePOS
 * @description Hook que gerencia todo o estado da tela de Ponto de Venda (POS).
 * Lida com o carregamento de produtos/categorias, gerenciamento do carrinho (pedido local)
 * e navegação para o pagamento.
 */
export const usePOS = () => {
  const navigate = useNavigate();

  // Estados de dados
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);

  // Estados do carrinho (agora como um objeto Pedido)
  const [pedido, setPedido] = useState<Pedido>(estadoInicialPedido);

  // Estados da UI
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(true);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(true);
  const [errorProdutos, setErrorProdutos] = useState<unknown>(null);
  const [errorCategorias, setErrorCategorias] = useState<unknown>(null);

  /**
   * @effect
   * Carrega categorias e produtos na montagem do componente.
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingProdutos(true);
        setIsLoadingCategorias(true);
        setErrorProdutos(null);
        setErrorCategorias(null);

        // Busca categorias
        try {
          const catRes = await api.get<Categoria[]>('/categorias');
          setCategorias(catRes.data);
          // Define a primeira categoria ("Todos") como ativa
          setCategoriaAtiva(null); 
        } catch (err) {
          setErrorCategorias(err);
          logError('Erro ao carregar categorias:', err);
        } finally {
          setIsLoadingCategorias(false);
        }

        // Busca todos os produtos
        try {
          // Otimização: buscar todos os produtos de uma vez
          const prodRes = await api.get<Produto[]>('/produtos?limite=1000'); // Limite alto
          setProdutos(prodRes.data);
        } catch (err) {
          setErrorProdutos(err);
          logError('Erro ao carregar produtos:', err);
        } finally {
          setIsLoadingProdutos(false);
        }
      } catch (err) {
        // Erro geral (improvável, mas como fallback)
        const message = getErrorMessage(err);
        setErrorProdutos(message);
        setErrorCategorias(message);
        setIsLoadingProdutos(false);
        setIsLoadingCategorias(false);
      }
    };
    loadData();
  }, []);

  /**
   * @memo produtosFiltrados
   * Memoiza a filtragem dos produtos com base na categoriaAtiva.
   */
  const produtosFiltrados = useMemo(() => {
    if (categoriaAtiva === null) {
      return produtos; // "Todos"
    }
    return produtos.filter((produto) => produto.categoria.id === categoriaAtiva);
  }, [produtos, categoriaAtiva]);

  /**
   * @memo total
   * Calcula e memoiza o valor total do pedido local.
   */
  const total = useMemo(() => {
    return pedido.itens.reduce((acc, item) => {
      return acc + item.produto.preco * item.quantidade;
    }, 0);
  }, [pedido.itens]);

  /**
   * @function handleAddToCart
   * @description Adiciona um produto ao carrinho ou incrementa sua quantidade.
   * Verifica o estoque.
   */
  const handleAddToCart = useCallback((produto: Produto) => {
    setPedido((prevPedido) => {
      const itemExistente = prevPedido.itens.find(
        (i) => i.produto.id === produto.id
      );

      // Verifica estoque
      const novaQuantidade = (itemExistente?.quantidade || 0) + 1;
      if (novaQuantidade > produto.quantidadeEstoque) {
        // TODO: Substituir alert por um Toast/Snackbar
        alert(`Estoque insuficiente. Disponível: ${produto.quantidadeEstoque}`);
        return prevPedido;
      }

      let novosItens: PedidoItem[];
      if (itemExistente) {
        // Atualiza item existente
        novosItens = prevPedido.itens.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: novaQuantidade }
            : item
        );
      } else {
        // Adiciona novo item
        const novoItem: PedidoItem = {
          id: `item-${produto.id}`, // ID local provisório
          produto: produto,
          quantidade: 1,
          preco: produto.preco, // Armazena o preço no momento da adição
          pedidoId: 'local-cart',
        };
        novosItens = [...prevPedido.itens, novoItem];
      }

      return { ...prevPedido, itens: novosItens };
    });
  }, []);

  /**
   * @function handleUpdateQuantity
   * @description Atualiza a quantidade de um item no carrinho.
   * Remove o item se a quantidade for <= 0.
   */
  const handleUpdateQuantity = useCallback((itemId: string, novaQuantidade: number) => {
    setPedido((prevPedido) => {
      // Remove o item se a quantidade for zero ou menos
      if (novaQuantidade <= 0) {
        const novosItens = prevPedido.itens.filter((i) => i.id !== itemId);
        return { ...prevPedido, itens: novosItens };
      }

      // Encontra o item para verificar o estoque
      const item = prevPedido.itens.find((i) => i.id === itemId);
      if (item && novaQuantidade > item.produto.quantidadeEstoque) {
        alert(`Estoque insuficiente. Disponível: ${item.produto.quantidadeEstoque}`);
        return prevPedido; // Não altera
      }

      // Atualiza a quantidade
      const novosItens = prevPedido.itens.map((i) =>
        i.id === itemId ? { ...i, quantidade: novaQuantidade } : i
      );
      return { ...prevPedido, itens: novosItens };
    });
  }, []);

  /**
   * @function handleRemoveFromCart
   * @description Remove um item completamente do carrinho.
   */
  const handleRemoveFromCart = useCallback((itemId: string) => {
    setPedido((prevPedido) => ({
      ...prevPedido,
      itens: prevPedido.itens.filter((item) => item.id !== itemId),
    }));
  }, []);

  /**
   * @function handleLimparCarrinho
   * @description Reseta o pedido local para o estado inicial.
   */
  const handleLimparCarrinho = useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
      setPedido(estadoInicialPedido);
    }
  }, []);

  /**
   * @function handleNavigateToPayment
   * @description Salva o pedido local no localStorage e navega para /vendas/pagamento.
   */
  const handleNavigateToPayment = useCallback(() => {
    if (pedido.itens.length === 0) {
      alert('O carrinho está vazio.');
      return;
    }
    // Salva o pedido e o total para o hook usePayment recuperar
    localStorage.setItem('pedidoLocal', JSON.stringify({ ...pedido, total }));
    navigate('/vendas/pagamento');
  }, [pedido, total, navigate]);

  return {
    // Estado do Pedido
    pedido,
    total,
    // Estado de Produtos e Categorias
    produtosFiltrados,
    categorias,
    categoriaAtiva,
    setCategoriaAtiva,
    // Estado da UI
    isLoadingProdutos,
    isLoadingCategorias,
    errorProdutos,
    errorCategorias,
    // Ações
    handleAddToCart,
    handleRemoveFromCart,
    handleUpdateQuantity,
    handleLimparCarrinho,
    handleNavigateToPayment,
  };
};
