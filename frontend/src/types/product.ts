// src/types/product.ts

export interface Categoria {
  id: string;
  nome: string;
  criado_em: string; // Adicionado
  atualizado_em: string; // Adicionado
  _count?: {
    produtos: number;
  };
}

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  quantidadeEstoque: number; // Mapeado de 'estoque'
  imagemUrl: string | null;  // Mapeado de 'imagem_url'
  descricao?: string;
  categoria: Categoria;
  categoriaId: string; // Mapeado de 'categoria_id'
  criado_em: string; // Adicionado
  atualizado_em: string; // Adicionado
}

// FormData permanece o mesmo, focado nos campos editáveis
export interface ProdutoFormData {
  nome: string;
  descricao?: string;
  preco: number;
  quantidadeEstoque: number;
  categoriaId: string;
  imagemUrl?: string;
}
