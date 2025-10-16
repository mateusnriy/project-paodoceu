// src/dtos/CreateProdutoDto.ts
export type CreateProdutoDto = {
  nome: string;
  descricao?: string;
  preco: number;
  estoque?: number;
  categoria_id: string;
};
