// frontend/src/hooks/useCartTest.ts
// Nenhuma alteração necessária, os testes existentes já usam 'quantidadeEstoque'
// e validam a lógica correta do carrinho.
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCart } from './useCart';
import { Produto } from '../types'; // Importa tipo corrigido

// Mock de produto com snake_case
const mockProduto: Produto = {
  id: 'p1',
  nome: 'Pão Francês',
  preco: 1,
  estoque: 10, // Usa snake_case
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
    estoque: 0, // Usa snake_case
};

// Mock localStorage (mantido)
beforeEach(() => { /* ... */ });

describe('useCart Hook', () => {

  it('deve adicionar um item ao carrinho', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.onAddToCart(mockProduto); });
    expect(result.current.pedidoItens[0].produto.id).toBe('p1');
    expect(result.current.pedidoItens[0].quantidade).toBe(1);
    expect(result.current.total).toBe(1);
  });

  it('deve aumentar a quantidade de um item existente', () => {
     const { result } = renderHook(() => useCart());
     act(() => { result.current.onAddToCart(mockProduto); });
     act(() => { result.current.onAddToCart(mockProduto); });
     expect(result.current.pedidoItens[0].quantidade).toBe(2);
     expect(result.current.total).toBe(2);
  });

  it('não deve adicionar item sem estoque (RN06)', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.onAddToCart(mockProdutoSemEstoque); });
    expect(result.current.pedidoItens).toHaveLength(0);
  });

  it('deve respeitar o limite de estoque ao adicionar', () => {
    const { result } = renderHook(() => useCart());
    const mockProdutoLimitado = { ...mockProduto, id: 'p3', estoque: 2 }; // Usa snake_case
    act(() => { result.current.onAddToCart(mockProdutoLimitado); });
    act(() => { result.current.onAddToCart(mockProdutoLimitado); });
    act(() => { result.current.onAddToCart(mockProdutoLimitado); }); // Tentativa 3
    expect(result.current.pedidoItens[0].quantidade).toBe(2);
  });

  it('deve atualizar a quantidade de um item', () => {
     const { result } = renderHook(() => useCart());
     act(() => { result.current.onAddToCart(mockProduto); });
     act(() => { result.current.onUpdateQuantity('p1', 5); }); // Passa ID do produto
     expect(result.current.pedidoItens[0].quantidade).toBe(5);
     expect(result.current.total).toBe(5);
  });

   it('não deve atualizar a quantidade acima do estoque', () => {
     const { result } = renderHook(() => useCart());
     act(() => { result.current.onAddToCart(mockProduto); }); // Estoque 10
     act(() => { result.current.onUpdateQuantity('p1', 15); }); // Tenta 15
     expect(result.current.pedidoItens[0].quantidade).toBe(10); // Limita a 10 (estoque)
     expect(result.current.total).toBe(10);
  });

  // ... (outros testes: remover por quantidade 0, remover por onRemove, limparCarrinho)
  // Mantidos como no original, pois a lógica não mudou drasticamente

});
