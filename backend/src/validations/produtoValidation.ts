import { z } from 'zod';

const precoSchema = z
  .number()
  .positive('Preço deve ser positivo.')
  .refine((val) => Number(val.toFixed(2)) === val, {
    message: 'Preço deve ter no máximo 2 casas decimais.',
  });

export const criarProdutoSchema = z.object({
  nome: z.string().min(3, 'Nome do produto é obrigatório.'),
  descricao: z.string().optional(),
  preco: precoSchema,
  estoque: z.number().int().min(0, 'Estoque não pode ser negativo.'),
  ativo: z.boolean().optional().default(true),
  categoria_id: z.string().uuid('ID da categoria é obrigatório.'),
});

export const atualizarProdutoSchema = z.object({
  nome: z.string().min(3, 'Nome do produto é obrigatório.').optional(),
  descricao: z.string().optional(),
  preco: precoSchema.optional(),
  estoque: z.number().int().min(0, 'Estoque não pode ser negativo.').optional(),
  ativo: z.boolean().optional(),
  categoria_id: z.string().uuid('ID da categoria é obrigatório.').optional(),
});


export const ajustarEstoqueSchema = z.object({
  quantidade: z
    .number()
    .int('Quantidade deve ser um número inteiro.')
    .min(0, 'Estoque não pode ser negativo.'), 
});
