import { z } from 'zod';
import { PerfilUsuario } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  senha: z.string().min(1, 'Senha é obrigatória.'),
});

export const registrarSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Email inválido.'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.'),
  perfil: z.nativeEnum(PerfilUsuario).optional(), // Perfil é opcional no DTO, definido pelo serviço
});

// Correção: Exportar os tipos inferidos (DTOs)
export type LoginDto = z.infer<typeof loginSchema>;
export type RegistrarDto = z.infer<typeof registrarSchema>;
