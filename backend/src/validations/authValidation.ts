// backend/src/validations/authValidation.ts
import { z } from 'zod';
import { PerfilUsuario } from '@prisma/client';

// Schema de senha reutilizável (forte)
const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres.')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula.')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula.')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número.')
  .regex(/[^a-zA-Z0-9]/, 'Senha deve conter pelo menos um caractere especial.');

// Schema para Login (RF01)
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido.'),
    senha: z.string().min(1, 'Senha é obrigatória.'),
  }),
});
export type LoginDto = z.infer<typeof loginSchema>['body'];

// Schema para Registro (RF15)
export const registrarSchema = z.object({
  body: z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
    email: z.string().email('Email inválido.'),
    senha: passwordSchema,
  }),
});
export type RegistrarDto = z.infer<typeof registrarSchema>['body'];

// REMOVIDO: Schema para Solicitar Reset de Senha

// REMOVIDO: Schema para Redefinir Senha com Token

// Schema para Atualizar Próprio Perfil (GAP RF18)
export const updateOwnProfileSchema = z.object({
  body: z
    .object({
      nome: z
        .string()
        .min(3, 'Nome deve ter pelo menos 3 caracteres.')
        .optional(),
      currentPassword: z
        .string()
        .min(1, 'Senha atual é obrigatória para qualquer alteração.'),
      newPassword: passwordSchema.optional(), // Nova senha é opcional
    })
    .refine(data => data.nome || data.newPassword, {
      message: 'Forneça um novo nome ou uma nova senha para atualizar.',
      path: ['nome'],
    }),
});
export type UpdateOwnProfileDto = z.infer<
  typeof updateOwnProfileSchema
>['body'];
