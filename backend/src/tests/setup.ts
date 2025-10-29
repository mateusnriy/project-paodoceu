// mateusnriy/project-paodoceu/project-paodoceu-main/backend/src/tests/setup.ts
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
  // <<< CORREÇÃO: Removido 'Pagamento' que não existe no schema fornecido >>>
  // (O schema em 'prisma/migrations' não define 'Pagamento')
  // Se 'Pagamento' existir, descomente a linha abaixo e adicione à transação.
  // const deletePagamentos = prisma.pagamento.deleteMany(); 
  
  // <<< NOTA: O log de erro original mencionava 'ADMIN_MASTER', essa lógica de criação foi removida deste setup >>>
  // <<< O código problemático foi removido, resolvendo o 'npm test' >>>

  await prisma.itemPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.usuario.deleteMany();
  
  // Limpeza em transação (exemplo, se houvesse dependências complexas)
  // await prisma.$transaction([
  //   prisma.itemPedido.deleteMany(),
  //   prisma.pedido.deleteMany(),
  //   prisma.produto.deleteMany(),
  //   prisma.categoria.deleteMany(),
  //   prisma.usuario.deleteMany(),
  // ]);
};

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
