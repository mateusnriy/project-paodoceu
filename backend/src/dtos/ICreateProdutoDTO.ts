export type CreateProdutoDto = {
  nome: string;
  descricao?: string;
  preco: number;
  estoque?: number;
  categoria_id: string;
  imagem_url?: string;
};
