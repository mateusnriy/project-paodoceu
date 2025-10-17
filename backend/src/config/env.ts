import { z } from 'zod';
import dotenv from 'dotenv';
import logger from '../lib/logger'; // Para logar erro na validação

// Carrega as variáveis do .env para process.env
dotenv.config();

// Define o schema esperado para as variáveis de ambiente
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333), // Coerce converte string para número
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL é obrigatória.'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres.'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
});

// Tenta validar process.env contra o schema
const validationResult = envSchema.safeParse(process.env);

if (!validationResult.success) {
  logger.error('Erro na validação das variáveis de ambiente:', validationResult.error.flatten().fieldErrors);
  // Encerrar a aplicação se variáveis críticas estiverem faltando/inválidas
  process.exit(1);
}

// Exporta as variáveis validadas e tipadas
export const env = validationResult.data;

logger.info('Variáveis de ambiente carregadas e validadas com sucesso.');
