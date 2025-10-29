
export interface CreateProdutoDto {
  nome: string;
  descricao?: string;
  preco: number; // A validação Zod/Prisma trata a conversão para Decimal
  categoria_id: string; // CORRIGIDO P1.1
  estoque: number;
  ativo?: boolean;
}
