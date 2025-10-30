// frontend/src/hooks/useCart.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PedidoItem, Produto } from '@/types';
import { toast } from 'react-hot-toast';

interface CartState {
  items: PedidoItem[];
  clienteNome: string | null;
  total: number;
}

interface CartActions {
  actions: {
    onAddToCart: (produto: Produto) => void;
    onRemove: (produtoId: string) => void;
    onUpdateQuantity: (produtoId: string, novaQuantidade: number) => void;
    setClienteNome: (nome: string | null) => void;
    clearCart: () => void;
  };
}

const initialState: CartState = {
  items: [],
  clienteNome: null,
  total: 0,
};

// Função helper para calcular total
const calcularTotal = (items: PedidoItem[]): number => {
  return items.reduce((acc, item) => acc + item.preco_unitario * item.quantidade, 0);
};

// CORREÇÃO (Erro 2, 3): Usar a sintaxe 'create<T>()(persist(...))'
// Isso define o tipo do store completo no 'create'
export const useCartStore = create<CartState & CartActions>()(
  // CORREÇÃO (Erro 2, 3): Remover as genéricas <TState, TPersistedState>
  // do 'persist' para evitar conflito de tipo.
  persist(
    (set, get) => ({
      ...initialState,
      actions: {
        setClienteNome: (nome: string | null) => {
          set({ clienteNome: nome });
        },

        onAddToCart: (produto: Produto) => {
          if (!produto.ativo) {
            toast.error(`${produto.nome} não está disponível para venda.`);
            return;
          }
          if (produto.estoque <= 0) {
            toast.error(`${produto.nome} está indisponível no estoque.`);
            return;
          }

          const { items } = get();
          const itemExistente = items.find(
            (item) => item.produto.id === produto.id,
          );

          if (itemExistente) {
            if (itemExistente.quantidade >= produto.estoque) {
              toast.error(
                `Quantidade máxima em estoque (${produto.estoque}) atingida para ${produto.nome}.`,
              );
              return; // Não altera o estado
            }
            // Aumenta quantidade
            const novosItens = items.map((item) =>
              item.produto.id === produto.id
                ? { ...item, quantidade: item.quantidade + 1 }
                : item,
            );
            set({ items: novosItens, total: calcularTotal(novosItens) });
          } else {
            // Adiciona novo item
            const novoItem: PedidoItem = {
              id: produto.id, // ID temporário
              produto: produto,
              quantidade: 1,
              preco_unitario: produto.preco,
              pedidoId: 'local',
            };
            const novosItens = [...items, novoItem];
            set({ items: novosItens, total: calcularTotal(novosItens) });
          }
        },

        onRemove: (produtoId: string) => {
          const novosItens = get().items.filter(
            (item) => item.produto.id !== produtoId,
          );
          set({ items: novosItens, total: calcularTotal(novosItens) });
        },

        onUpdateQuantity: (produtoId: string, novaQuantidade: number) => {
          const { items } = get();
          const itemIndex = items.findIndex(
            (item) => item.produto.id === produtoId,
          );
          if (itemIndex === -1) return;

          // Remover se quantidade for zero ou menor
          if (novaQuantidade <= 0) {
            get().actions.onRemove(produtoId);
            return;
          }

          const item = items[itemIndex];
          const produto = item.produto;

          if (novaQuantidade > produto.estoque) {
            toast.error(
              `Quantidade máxima para ${produto.nome} é ${produto.estoque}.`,
            );
            // Atualiza para o máximo
            const novosItens = items.map((i) =>
              i.produto.id === produtoId
                ? { ...i, quantidade: produto.estoque }
                : i,
            );
            set({ items: novosItens, total: calcularTotal(novosItens) });
            return;
          }

          // Atualizar quantidade
          const novosItens = items.map((i) =>
            i.produto.id === produtoId ? { ...i, quantidade: novaQuantidade } : i,
          );
          set({ items: novosItens, total: calcularTotal(novosItens) });
        },

        clearCart: () => {
          set(initialState);
          // Opcional: não mostrar toast ao resetar via teste
          if (process.env.NODE_ENV !== 'test') {
            toast.success('Carrinho limpo.');
          }
        },
      },
    }),
    {
      name: 'pao-do-ceu-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // O 'partialize' agora infere o TPersistedState (CartState)
      partialize: (state) => ({
        items: state.items,
        clienteNome: state.clienteNome,
        total: state.total,
      }),
      onRehydrateStorage: (state) => {
        // O 'state' aqui é o TPersistedState (CartState)
        if (state) {
          // Recalcula o total ao re-hidratar, garantindo consistência
          state.total = calcularTotal(state.items);
        }
        console.log('Carrinho (re)hidratado do localStorage.');
      },
    },
  ),
  // CORREÇÃO (Erro 2, 3): Fechamento do 'create()'
);
