import { beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../lib/prisma';

// Mock do logger para silenciar logs durante os testes
// (Corresponde ao 'export const logger' do arquivo 'logger.ts' corrigido)
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
  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.usuario.deleteMany();
};

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

