// frontend/src/validations/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
});

export const registerSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.'),
  confirmarSenha: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória.'),
})
.refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem.',
  path: ['confirmarSenha'], // Campo onde o erro será exibido
});

// Tipos inferidos para uso com react-hook-form
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
