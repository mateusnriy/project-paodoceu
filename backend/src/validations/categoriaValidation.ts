import { z } from 'zod';

export const criarCategoriaSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: 'O nome é obrigatório.' }).min(3, 'O nome deve ter no mínimo 3 caracteres.'),
  }),
});

export const atualizarCategoriaSchema = z.object({
  body: z.object({
    nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.').optional(),
  }),
  params: z.object({
    id: z.string().uuid('ID de categoria inválido.'),
  }),
});
