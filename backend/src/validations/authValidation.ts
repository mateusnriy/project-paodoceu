import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'O email é obrigatório.' })
      .email('Formato de email inválido.')
      .transform(email => email.toLowerCase()), // Normaliza o email para minúsculas
    senha: z
      .string({ required_error: 'A senha é obrigatória.' })
      .min(1, 'A senha não pode estar vazia.'), // Senha não pode ser vazia, mas a validação de tamanho real é no login
  }),
});

export const registrarSchema = z.object({
  body: z.object({
    nome: z
      .string({ required_error: 'O nome é obrigatório.' })
      .min(3, 'O nome precisa ter no mínimo 3 caracteres.')
      .trim(), // Remove espaços extras
    email: z
      .string({ required_error: 'O email é obrigatório.' })
      .email('Formato de email inválido.')
      .transform(email => email.toLowerCase()), // Normaliza o email para minúsculas
    senha: z
      .string({ required_error: 'A senha é obrigatória.' })
      .min(6, 'A senha precisa ter no mínimo 6 caracteres.'),
  }),
});
