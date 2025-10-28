import { useState, useMemo, useCallback, useEffect } from 'react';
import { PedidoItem, Produto, Pedido } from '../types'; // Importar Pedido também
import { logError } from '../utils/logger';
// Opcional: Importar toast se for usar para feedback
// import { toast } from 'react-hot-toast';

export const useCart = () => {
  const [pedidoItens, setPedidoItens] = useState<PedidoItem[]>([]);

  const onAddToCart = useCallback((produto: Produto) => {
    if (!produto.ativo) {
        // toast.error(`${produto.nome} não está disponível para venda.`);
        console.warn(`${produto.nome} não está disponível para venda (inativo).`);
        return;
    }
    if (produto.quantidadeEstoque <= 0) {
      // toast.error(`${produto.nome} está indisponível no estoque.`);
      console.warn(`${produto.nome} está indisponível no estoque.`);
      return;
    }

    setPedidoItens((prevItens) => {
      const itemExistente = prevItens.find(item => item.produto.id === produto.id);

      if (itemExistente) {
        // Verificar estoque antes de aumentar
        if (itemExistente.quantidade >= produto.quantidadeEstoque) {
           // toast.error(`Quantidade máxima em estoque (${produto.quantidadeEstoque}) atingida para ${produto.nome}.`);
           console.warn(`Quantidade máxima em estoque (${produto.quantidadeEstoque}) atingida para ${produto.nome}.`);
           return prevItens; // Não altera o estado
        }
        // Aumenta quantidade
        return prevItens.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        // Adiciona novo item
        return [
          ...prevItens,
          {
            id: produto.id, // Usar ID do produto como key temporária no frontend
            produto: produto, // Armazenar o objeto produto completo
            quantidade: 1,
            preco: produto.preco, // Guardar preço unitário atual no item do carrinho
            pedidoId: 'local', // Indicar que é local, não salvo no backend ainda
          }
        ];
      }
    });
    // Opcional: Feedback visual ao adicionar
    // toast.success(`${produto.nome} adicionado ao carrinho!`);
  }, []);

  const onRemove = useCallback((produtoId: string) => {
    setPedidoItens((prevItens) => prevItens.filter(item => item.produto.id !== produtoId));
    // Opcional: Feedback visual ao remover
    // const removedItem = pedidoItens.find(item => item.produto.id === produtoId);
    // if (removedItem) toast.success(`${removedItem.produto.nome} removido.`);
  }, []);

  const onUpdateQuantity = useCallback((produtoId: string, novaQuantidade: number) => {
    setPedidoItens((prevItens) => {
      const itemIndex = prevItens.findIndex(item => item.produto.id === produtoId);
      if (itemIndex === -1) return prevItens; // Item não encontrado

      const item = prevItens[itemIndex];
      const produto = item.produto;

      // Remover se quantidade for zero ou menor
      if (novaQuantidade <= 0) {
        return prevItens.filter(i => i.produto.id !== produtoId);
      }

      // Verificar estoque
      if (novaQuantidade > produto.quantidadeEstoque) {
        // toast.error(`Quantidade máxima em estoque para ${produto.nome} é ${produto.quantidadeEstoque}.`);
        console.warn(`Quantidade máxima em estoque para ${produto.nome} é ${produto.quantidadeEstoque}.`);
        // Manter quantidade no máximo estoque permitido
         return prevItens.map(i =>
           i.produto.id === produtoId ? { ...i, quantidade: produto.quantidadeEstoque } : i
         );
      }

      // Atualizar quantidade
      return prevItens.map(i =>
        i.produto.id === produtoId ? { ...i, quantidade: novaQuantidade } : i
      );
    });
  }, []);

  const limparCarrinho = useCallback(() => {
    setPedidoItens([]);
    localStorage.removeItem('pedidoLocal'); // Limpar persistência também
    // Opcional: Feedback
    // toast.success('Carrinho limpo.');
  }, []);

  // Calcula o valor total do carrinho
  const total = useMemo(() => {
    // Usar o preço armazenado no item (item.preco) para consistência,
    // caso o preço do produto mude enquanto está no carrinho.
    return pedidoItens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  }, [pedidoItens]);

  // Persistir no localStorage sempre que o carrinho mudar
  useEffect(() => {
      try {
          if (pedidoItens.length > 0) {
              // Criar um objeto Pedido simplificado para salvar
              // Isso é útil para a tela de pagamento carregar os dados
              const pedidoParaSalvar: Pedido = {
                  id: 'local', // ID Fixo
                  itens: pedidoItens,
                  valor_total: total,
                  status: 'LOCAL', // Status especial
                  criado_em: localStorage.getItem('pedidoLocal') ? JSON.parse(localStorage.getItem('pedidoLocal')!).criado_em : new Date().toISOString(), // Manter data de criação original se já existir
                  atualizado_em: new Date().toISOString(),
                  // Não incluir campos que não fazem sentido localmente (atendente, pagamento, etc.)
              };
              localStorage.setItem('pedidoLocal', JSON.stringify(pedidoParaSalvar));
          } else {
              localStorage.removeItem('pedidoLocal'); // Limpar se vazio
          }
      } catch (error) {
          logError("Erro ao salvar carrinho no localStorage", error);
      }
  }, [pedidoItens, total]);

  // Carregar do localStorage na inicialização
  useEffect(() => {
      try {
          const pedidoString = localStorage.getItem('pedidoLocal');
          if (pedidoString) {
              const pedidoData = JSON.parse(pedidoString) as Pedido; // Tenta parsear como Pedido
              // Validar se tem itens e a estrutura básica
              if (pedidoData && Array.isArray(pedidoData.itens) && pedidoData.itens.length > 0 && typeof pedidoData.valor_total === 'number') {
                  // TODO: Idealmente, verificar aqui se os produtos ainda existem e se o estoque é suficiente,
                  //       e talvez atualizar preços se eles mudaram desde que foi salvo.
                  //       Por simplicidade, apenas carregamos os itens como estão.
                  setPedidoItens(pedidoData.itens);
              } else {
                  console.warn('Dados do carrinho inválidos no localStorage, limpando.', pedidoData);
                  localStorage.removeItem('pedidoLocal');
              }
          }
      } catch (error) {
           logError("Erro ao carregar carrinho do localStorage", error);
           localStorage.removeItem('pedidoLocal'); // Limpar em caso de erro de parse
      }
  }, []); // Executa apenas uma vez na montagem do hook


  return { pedidoItens, total, onAddToCart, onRemove, onUpdateQuantity, limparCarrinho };
};
