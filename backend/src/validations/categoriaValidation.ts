// backend/src/validations/categoriaValidation.ts
import { z } from 'zod';

export const criarCategoriaSchema = z.object({
  body: z.object({
    nome: z.string().min(3, 'Nome da categoria é obrigatório (mín. 3 caracteres).'),
  }),
});

export const atualizarCategoriaSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido.'), // Validar parâmetro de rota
  }),
  body: z.object({
    nome: z.string().min(3, 'Nome da categoria é obrigatório (mín. 3 caracteres).'),
  }),
});

export const listarCategoriasSchema = z.object({ // Schema para GET com query params
  query: z.object({
    pagina: z.coerce.number().int().positive().optional(), // Coerce para número
    limite: z.coerce.number().int().positive().optional(),
    nome: z.string().optional(),
  }),
});

export const obterCategoriaSchema = z.object({
   params: z.object({
     id: z.string().uuid('ID inválido.'),
   }),
});

export const deletarCategoriaSchema = z.object({
   params: z.object({
     id: z.string().uuid('ID inválido.'),
   }),
});
