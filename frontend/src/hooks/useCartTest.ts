// frontend/src/hooks/useCart.test.ts

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCart } from './useCart';
import { Produto, PerfilUsuario } from '../types';

// Mock de produto
const mockProduto: Produto = {
  id: 'p1',
  nome: 'Pão Francês',
  preco: 1,
  quantidadeEstoque: 10,
  imagemUrl: '',
  descricao: '',
  categoria: { id: 'c1', nome: 'Padaria', criado_em: '', atualizado_em: '' },
  categoriaId: 'c1',
  criado_em: '',
  atualizado_em: '',
  ativo: true,
};

const mockProdutoSemEstoque: Produto = {
    ...mockProduto,
    id: 'p2',
    nome: 'Pão Doce',
    quantidadeEstoque: 0,
};

// Mock localStorage
beforeEach(() => {
  Storage.prototype.getItem = vi.fn(() => null); // Começa limpo
  Storage.prototype.setItem = vi.fn();
  Storage.prototype.removeItem = vi.fn();
});

describe('useCart Hook', () => {

  it('deve adicionar um item ao carrinho', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.onAddToCart(mockProduto);
    });

    expect(result.current.pedidoItens).toHaveLength(1);
    expect(result.current.pedidoItens[0].produto.id).toBe('p1');
    expect(result.current.pedidoItens[0].quantidade).toBe(1);
    expect(result.current.total).toBe(1);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('deve aumentar a quantidade de um item existente', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.onAddToCart(mockProduto); // 1
    });
     act(() => {
      result.current.onAddToCart(mockProduto); // 2
    });

    expect(result.current.pedidoItens).toHaveLength(1);
    expect(result.current.pedidoItens[0].quantidade).toBe(2);
    expect(result.current.total).toBe(2);
  });

  it('não deve adicionar item sem estoque (RN06)', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.onAddToCart(mockProdutoSemEstoque);
    });

    expect(result.current.pedidoItens).toHaveLength(0);
  });

  it('deve respeitar o limite de estoque ao adicionar', () => {
    const { result } = renderHook(() => useCart());
    const mockProdutoLimitado = { ...mockProduto, id: 'p3', quantidadeEstoque: 2 };

    act(() => {
      result.current.onAddToCart(mockProdutoLimitado); // 1
    });
    act(() => {
      result.current.onAddToCart(mockProdutoLimitado); // 2
    });
    act(() => {
      result.current.onAddToCart(mockProdutoLimitado); // Tentativa 3 (falha)
    });

    expect(result.current.pedidoItens).toHaveLength(1);
    expect(result.current.pedidoItens[0].quantidade).toBe(2);
    expect(result.current.total).toBe(2);
  });

  it('deve atualizar a quantidade de um item', () => {
     const { result } = renderHook(() => useCart());
     act(() => {
       result.current.onAddToCart(mockProduto);
     });

     act(() => {
       result.current.onUpdateQuantity('p1', 5);
     });
     
     expect(result.current.pedidoItens[0].quantidade).toBe(5);
     expect(result.current.total).toBe(5);
  });

   it('não deve atualizar a quantidade acima do estoque', () => {
     const { result } = renderHook(() => useCart());
     act(() => {
       result.current.onAddToCart(mockProduto); // Estoque 10
     });

     act(() => {
       result.current.onUpdateQuantity('p1', 15); // Tenta 15
     });
     
     expect(result.current.pedidoItens[0].quantidade).toBe(10); // Limita a 10
     expect(result.current.total).toBe(10);
  });
  
  it('deve remover um item se a quantidade for <= 0', () => {
     const { result } = renderHook(() => useCart());
     act(() => {
       result.current.onAddToCart(mockProduto);
     });

     act(() => {
       result.current.onUpdateQuantity('p1', 0);
     });
     
     expect(result.current.pedidoItens).toHaveLength(0);
     expect(result.current.total).toBe(0);
  });
  
  it('deve remover um item pelo onRemove', () => {
     const { result } = renderHook(() => useCart());
     act(() => {
       result.current.onAddToCart(mockProduto);
     });
     
     expect(result.current.pedidoItens).toHaveLength(1);

     act(() => {
       result.current.onRemove('p1');
     });
     
     expect(result.current.pedidoItens).toHaveLength(0);
  });
  
  it('deve limpar o carrinho e o localStorage', () => {
      const { result } = renderHook(() => useCart());
      act(() => {
        result.current.onAddToCart(mockProduto);
      });
      expect(result.current.pedidoItens).toHaveLength(1);
      
      act(() => {
          result.current.limparCarrinho();
      });
      
      expect(result.current.pedidoItens).toHaveLength(0);
      expect(result.current.total).toBe(0);
      expect(localStorage.removeItem).toHaveBeenCalledWith('pedidoLocal');
  });

});
