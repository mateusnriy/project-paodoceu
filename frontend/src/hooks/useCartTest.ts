// frontend/src/hooks/useCartTest.ts
import { renderHook, act } from '@testing-library/react';
// CORREÇÃO (Erro 5): Removido 'vi' não utilizado
import { describe, it, expect, beforeEach } from 'vitest';
// CORREÇÃO (Erro 6): Importar o store real
import { useCartStore } from './useCart';
import { Produto } from '../types';

const mockProduto: Produto = {
  id: 'p1',
  nome: 'Pão Francês',
  preco: 1,
  estoque: 10,
  imagem_url: '',
  descricao: '',
  categoria: { id: 'c1', nome: 'Padaria', criado_em: '', atualizado_em: '' },
  categoria_id: 'c1',
  criado_em: '',
  atualizado_em: '',
  ativo: true,
};

const mockProdutoSemEstoque: Produto = {
    ...mockProduto,
    id: 'p2',
    nome: 'Pão Doce',
    estoque: 0,
};

beforeEach(() => {
  // Limpa o store e o localStorage antes de cada teste
  act(() => {
    useCartStore.getState().actions.clearCart();
  });
  localStorage.clear();
  // Resetar o estado inicial do Zustand
  useCartStore.setState(useCartStore.getInitialState());
});

describe('useCart Hook', () => {

  it('deve adicionar um item ao carrinho', () => {
    // CORREÇÃO (Erro 6): Usar 'useCartStore'
    const { result } = renderHook(() => useCartStore());
    // CORREÇÃO: Acessar via 'actions'
    act(() => { result.current.actions.onAddToCart(mockProduto); });
    // CORREÇÃO: Acessar via 'items'
    expect(result.current.items[0].produto.id).toBe('p1');
    expect(result.current.items[0].quantidade).toBe(1);
    expect(result.current.total).toBe(1);
  });

  it('deve aumentar a quantidade de um item existente', () => {
     const { result } = renderHook(() => useCartStore());
     act(() => { result.current.actions.onAddToCart(mockProduto); });
     act(() => { result.current.actions.onAddToCart(mockProduto); });
     expect(result.current.items[0].quantidade).toBe(2);
     expect(result.current.total).toBe(2);
  });

  it('não deve adicionar item sem estoque (RN06)', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => { result.current.actions.onAddToCart(mockProdutoSemEstoque); });
    expect(result.current.items).toHaveLength(0);
  });

  it('deve respeitar o limite de estoque ao adicionar', () => {
    const { result } = renderHook(() => useCartStore());
    const mockProdutoLimitado = { ...mockProduto, id: 'p3', estoque: 2 };
    act(() => { result.current.actions.onAddToCart(mockProdutoLimitado); });
    act(() => { result.current.actions.onAddToCart(mockProdutoLimitado); });
    act(() => { result.current.actions.onAddToCart(mockProdutoLimitado); }); // Tentativa 3
    expect(result.current.items[0].quantidade).toBe(2);
  });

  it('deve atualizar a quantidade de um item', () => {
     const { result } = renderHook(() => useCartStore());
     act(() => { result.current.actions.onAddToCart(mockProduto); });
     // CORREÇÃO: Acessar via 'actions'
     act(() => { result.current.actions.onUpdateQuantity('p1', 5); });
     expect(result.current.items[0].quantidade).toBe(5);
     expect(result.current.total).toBe(5);
  });

   it('não deve atualizar a quantidade acima do estoque', () => {
     const { result } = renderHook(() => useCartStore());
     act(() => { result.current.actions.onAddToCart(mockProduto); }); // Estoque 10
     act(() => { result.current.actions.onUpdateQuantity('p1', 15); }); // Tenta 15
     expect(result.current.items[0].quantidade).toBe(10); // Limita a 10 (estoque)
     expect(result.current.total).toBe(10);
  });
});
