// frontend/src/validations/category.schema.ts
import { z } from 'zod';

export const categoryFormSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
