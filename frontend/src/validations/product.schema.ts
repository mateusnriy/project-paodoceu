// frontend/src/validations/product.schema.ts
import { z } from 'zod';

export const productFormSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório.'),
  descricao: z.string().optional(),
  // Coerce (força) o valor do input (string) para número
  preco: z.coerce
    .number()
    .positive('Preço deve ser positivo.'),
  estoque: z.coerce
    .number()
    .int('Estoque deve ser um número inteiro.')
    .min(0, 'Estoque não pode ser negativo.'),
  categoria_id: z.string().uuid('Categoria é obrigatória.'),
  ativo: z.boolean().default(true),
  // imagem_url é opcional e não gerenciado ativamente neste formulário
});

export type ProductFormData = z.infer<typeof productFormSchema>;
