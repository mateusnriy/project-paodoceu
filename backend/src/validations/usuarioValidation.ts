// src/validations/usuario.validation.ts
import { z } from 'zod';
import { PerfilUsuario } from '@prisma/client';

// Schema de validação para a criação de um novo usuário pelo admin
export const criarUsuarioSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: "O nome é obrigatório." }).min(3, "O nome precisa ter no mínimo 3 caracteres."),
    email: z.string({ required_error: "O email é obrigatório." }).email("Formato de email inválido."),
    senha: z.string({ required_error: "A senha é obrigatória." }).min(6, "A senha precisa ter no mínimo 6 caracteres."),
    perfil: z.nativeEnum(PerfilUsuario, { errorMap: () => ({ message: "Perfil inválido. Use 'ADMINISTRADOR' ou 'ATENDENTE'." }) }),
  }),
});

// Schema de validação para a atualização de um usuário
export const atualizarUsuarioSchema = z.object({
  body: z.object({
    nome: z.string().min(3, "O nome precisa ter no mínimo 3 caracteres.").optional(),
    email: z.string().email("Formato de email inválido.").optional(),
    senha: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres.").optional(),
    perfil: z.nativeEnum(PerfilUsuario).optional(),
  }),
  params: z.object({
    id: z.string().uuid("ID de usuário inválido."),
  })
});
