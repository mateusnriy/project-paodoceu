import { z } from 'zod';
import 'dotenv/config'; 

// Define o schema de validação para as variáveis de ambiente
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL inválida ou ausente.'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres.'),
  CSRF_SECRET: z
    .string()
    .min(32, 'CSRF_SECRET deve ter no mínimo 32 caracteres.'),
  COOKIE_SECRET: z
    .string()
    .min(32, 'COOKIE_SECRET deve ter no mínimo 32 caracteres.'),
  PORT: z.coerce.number().default(3333),
  FRONTEND_ORIGIN: z
    .string()
    .url('FRONTEND_ORIGIN inválido ou ausente.')
    .default('http://localhost:5173'),
});

// Valida as variáveis de ambiente atuais (process.env) contra o schema
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    'Erro ao validar variáveis de ambiente:',
    _env.error.format(),
  );
  throw new Error('Variáveis de ambiente inválidas.');
}

export const env = _env.data;
