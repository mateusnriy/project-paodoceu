// backend/src/tests/setup.ts
import { beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../lib/prisma';

// Mock do logger para silenciar logs durante os testes
vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Garante que o banco de dados de teste está limpo
const setupTestDatabase = async () => {
  // Limpa todas as tabelas (ordem de dependência)
  await prisma.$transaction([
    // (CORREÇÃO TESTE) Modelo removido do schema.prisma
    // prisma.passwordResetToken.deleteMany(),
    prisma.pagamento.deleteMany(),
    prisma.itemPedido.deleteMany(),
    prisma.pedido.deleteMany(),
    prisma.produto.deleteMany(),
    prisma.categoria.deleteMany(),
    prisma.usuario.deleteMany(),
  ]);
};

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await setupTestDatabase(); // Limpa após os testes também
  await prisma.$disconnect();
});
