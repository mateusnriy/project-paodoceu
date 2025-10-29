import { z } from 'zod';
import { PerfilUsuario } from '@prisma/client';

const senhaSchema = z
  .string()
  .min(6, 'Senha deve ter pelo menos 6 caracteres.')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    'Senha deve conter maiúscula, minúscula, número e caractere especial.',
  );

export const criarUsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Email inválido.'),
  senha: senhaSchema, 
  perfil: z.nativeEnum(PerfilUsuario),
  ativo: z.boolean().optional().default(false),
});

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres.').optional(),
  email: z.string().email('Email inválido.').optional(),
  senha: senhaSchema.optional().or(z.literal('')), 
  perfil: z.nativeEnum(PerfilUsuario).optional(),
  ativo: z.boolean().optional(),
});
