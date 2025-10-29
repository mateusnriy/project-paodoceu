// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Instancia única do PrismaClient
export const prisma = new PrismaClient({
  // Configura níveis de log do Prisma (opcional)
  // 'query' pode ser útil em dev, mas verboso
  log: ['warn', 'error'],
});

// Opcional: Adicionar um hook de shutdown para desconectar o Prisma
// process.on('beforeExit', async () => {
//   await prisma.$disconnect();
// });
