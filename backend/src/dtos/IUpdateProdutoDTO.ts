// backend/src/dtos/IUpdateProdutoDTO.ts

export interface UpdateProdutoDto {
  nome?: string;
  descricao?: string;
  preco?: number;
  categoria_id?: string; // CORRIGIDO P1.1
  estoque?: number;
  ativo?: boolean;
}
