// frontend/src/validations/auth.schema.ts
import { z } from 'zod';

// --- INÍCIO DA CORREÇÃO ---
// 1. Defina o schema de senha forte (copiado do backend/src/validations/authValidation.ts)
const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres.')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula.')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula.')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número.')
  .regex(/[^a-zA-Z0-9]/, 'Senha deve conter pelo menos um caractere especial.');
// --- FIM DA CORREÇÃO ---

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
});

export const registerSchema = z
  .object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
    email: z.string().email('E-mail inválido.'),
    
    // --- INÍCIO DA CORREÇÃO ---
    // 2. Use o schema de senha forte aqui
    senha: passwordSchema,
    // --- FIM DA CORREÇÃO ---

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
