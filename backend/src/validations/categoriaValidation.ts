import { z } from 'zod';

export const criarCategoriaSchema = z.object({
  nome: z.string().min(3, 'Nome da categoria é obrigatório (mín. 3 caracteres).'),
});

export const atualizarCategoriaSchema = z.object({
  nome: z.string().min(3, 'Nome da categoria é obrigatório (mín. 3 caracteres).').optional(),
});
