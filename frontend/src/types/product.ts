// frontend/src/types/product.ts
// Garante snake_case em ProdutoFormData
export interface Categoria {
  id: string;
  nome: string;
  criado_em: string;
  atualizado_em: string;
  _count?: {
    produtos: number;
  };
}

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagem_url: string | null;
  descricao?: string | null;
  categoria: Categoria;
  categoria_id: string;
  criado_em: string;
  atualizado_em: string;
  ativo: boolean;
}

export interface ProdutoFormData {
  nome: string;
  descricao?: string;
  preco: number;
  // --- Correção: Garantir snake_case ---
  estoque: number;
  categoria_id: string;
  imagem_url?: string;
  // --- Fim Correção ---
  ativo?: boolean;
}
