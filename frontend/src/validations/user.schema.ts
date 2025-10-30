// frontend/src/validations/user.schema.ts
import { z } from 'zod';
import { PerfilUsuario } from '@/types'; // Usar alias

export const userFormSchema = z
  .object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
    email: z.string().email('E-mail inválido.'),
    perfil: z.nativeEnum(PerfilUsuario, {
      errorMap: () => ({ message: 'Perfil inválido.' }),
    }),
    ativo: z.boolean(),
    // Senha é opcional na *atualização*
    senha: z.string().optional(),
    confirmarSenha: z.string().optional(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: 'As senhas não coincidem.',
    path: ['confirmarSenha'],
  })
  .refine((data) => (data.senha ? data.senha.length >= 6 : true), {
    message: 'Senha deve ter pelo menos 6 caracteres.',
    path: ['senha'],
  });

// Schema específico para criação (senha é obrigatória)
export const createUserFormSchema = userFormSchema.refine(
  (data) => !!data.senha,
  {
    message: 'Senha é obrigatória para criar usuário.',
    path: ['senha'],
  },
);

export type UserFormData = z.infer<typeof userFormSchema>;
