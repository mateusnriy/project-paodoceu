// src/types/product.ts

export interface Categoria {
  id: string;
  nome: string;
  criado_em: string; // Corrigido de dataCriacao
  atualizado_em: string; // Adicionado
  _count?: {
    produtos: number;
  };
}

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  quantidadeEstoque: number; // Mapeado de 'estoque' pelo backend
  imagemUrl: string | null;  // Mapeado de 'imagem_url' pelo backend
  descricao?: string;
  categoria: Categoria; // Inclui o objeto categoria
  categoriaId: string; // Mapeado de 'categoria_id' pelo backend
  criado_em: string; // Adicionado
  atualizado_em: string; // Adicionado
}

// FormData está correto
export interface ProdutoFormData {
  nome: string;
  descricao?: string;
  preco: number;
  quantidadeEstoque: number;
  categoriaId: string;
  imagemUrl?: string;
}
