// mateusnriy/project-paodoceu/project-paodoceu-main/frontend/src/types/product.ts
// <<< CORREÇÃO: Renomeado para Categoria >>>
export interface Categoria {
  id: string;
  nome: string;
  criado_em?: string;
  _count?: {
    produtos: number;
  };
}

// <<< CORREÇÃO: Renomeado para Produto e campos alinhados ao que o backend ENVIA >>>
export interface Produto {
  id: string;
  nome: string;
  preco: number;
  quantidadeEstoque: number; // <<< O backend agora mapeia 'estoque' para este nome
  imagemUrl: string | null;  // <<< O backend agora mapeia 'imagem_url' para este nome
  descricao?: string;
  categoria: Categoria;
  categoriaId: string; // <<< O backend agora mapeia 'categoria_id' para este nome
}

// <<< CORREÇÃO: FormData alinhado com os nomes de campo do frontend >>>
export interface ProdutoFormData {
  nome: string;
  descricao?: string;
  preco: number;
  quantidadeEstoque: number; // <<< Nome usado no formulário
  categoriaId: string; // <<< Nome usado no formulário
  imagemUrl?: string; // <<< Nome usado no formulário
}

