import { z } from 'zod';
import 'dotenv/config'; // Garante que o .env seja carregado

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
  PORT: z.coerce.number().int().positive().default(3333),
  FRONTEND_ORIGIN: z
    .string()
    .url('FRONTEND_ORIGIN inválido ou ausente.')
    .default('http://localhost:5173'), // Valor padrão para desenvolvimento
  LOG_LEVEL: z // Nível de log (winston)
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info'),

  // REMOVIDO: Configurações de Email (MAIL_HOST, MAIL_PORT, etc.)
  // REMOVIDO: PASSWORD_RESET_URL
});

// Valida as variáveis de ambiente atuais (process.env) contra o schema
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error(
    'Erro ao validar variáveis de ambiente:',
    parseResult.error.format(), // Mostra os erros formatados
  );
  throw new Error(
    `Variáveis de ambiente inválidas. Verifique o .env e .env.example.`,
  );
}

// Exporta as variáveis validadas e tipadas
export const env = parseResult.data;
