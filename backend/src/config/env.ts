import { z } from 'zod'; // <-- Agora é a primeira linha significativa

// Define o schema de validação para as variáveis de ambiente
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3333),
});

// Valida as variáveis de ambiente atuais (process.env) contra o schema
const _env = envSchema.safeParse(process.env);

// Se a validação falhar, loga o erro no console (mas não trava aqui)
if (!_env.success) {
  console.error(
    '❌ Erro ao validar variáveis de ambiente:',
    _env.error.format(),
  );
}

// Exporta as variáveis validadas e tipadas (ou 'undefined' se falhar)
export const env = _env.success ? _env.data : undefined;
