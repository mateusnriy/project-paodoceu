export interface UpdateProdutoDto {
  nome?: string;
  descricao?: string;
  preco?: number;
  // categoria_id?: string; // <-- DE
  categoriaId?: string; // <-- PARA
  estoque?: number;
  ativo?: boolean;
}
