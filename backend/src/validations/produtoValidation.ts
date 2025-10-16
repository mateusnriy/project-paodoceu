import { z } from 'zod';

export const criarProdutoSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: 'O nome é obrigatório.' }).min(3),
    descricao: z.string().optional(),
    preco: z.number({ required_error: 'O preço é obrigatório.' }).positive('O preço deve ser positivo.'),
    estoque: z.number().int().nonnegative('O estoque não pode ser negativo.').optional(),
    categoria_id: z.string({ required_error: 'O ID da categoria é obrigatório.' }).uuid('ID de categoria inválido.'),
  }),
});

export const atualizarProdutoSchema = z.object({
  body: z.object({
    nome: z.string().min(3).optional(),
    descricao: z.string().optional(),
    preco: z.number().positive('O preço deve ser positivo.').optional(),
    estoque: z.number().int().nonnegative('O estoque não pode ser negativo.').optional(),
    categoria_id: z.string().uuid('ID de categoria inválido.').optional(),
  }),
  params: z.object({
    id: z.string().uuid('ID de produto inválido.'),
  }),
});

export const ajustarEstoqueSchema = z.object({
  body: z.object({
    quantidade: z.number({ required_error: 'A quantidade é obrigatória.' }).int().nonnegative('A quantidade não pode ser negativa.'),
  }),
  params: z.object({
    id: z.string().uuid('ID de produto inválido.'),
  }),
});
