// backend/src/config/env.ts (adicionar/modificar)
import { z } from 'zod';
import dotenv from 'dotenv';
import { logger } from '../lib/logger'; // <<< CORREÇÃO (Era import default)

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL é obrigatória.'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres.'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  // --- NOVAS VARIÁVEIS ---
  FRONTEND_ORIGIN: z.string().url('FRONTEND_ORIGIN deve ser uma URL válida.').min(1, 'FRONTEND_ORIGIN é obrigatória.'),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET deve ter no mínimo 32 caracteres.'), // Segredo para csurf
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET deve ter no mínimo 32 caracteres.'), // Segredo para cookie-parser (pode ser o mesmo que CSRF_SECRET)
});

const validationResult = envSchema.safeParse(process.env);

if (!validationResult.success) {
  logger.error('Erro na validação das variáveis de ambiente:', validationResult.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = validationResult.data;

logger.info('Variáveis de ambiente carregadas e validadas com sucesso.');
