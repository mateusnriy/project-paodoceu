
export interface CreateProdutoDto {
  nome: string;
  descricao?: string;
  preco: number;
  categoriaId: string;
  estoque: number;
  ativo?: boolean;
}
