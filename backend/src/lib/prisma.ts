// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Instancia o PrismaClient e o exporta para ser usado em toda a aplicação.
// Isso garante que haverá apenas uma instância do client, otimizando conexões.
export const prisma = new PrismaClient({
  log: ['warn', 'error'], // Opcional: Loga avisos e erros do Prisma no console
});
