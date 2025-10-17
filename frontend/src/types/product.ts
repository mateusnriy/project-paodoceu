export interface Category {
  id: string;
  nome: string;
  _count?: {
    produtos: number;
  };
}

export interface Product {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagem_url: string | null;
  categoria: Category;
  categoria_id: string;
}
