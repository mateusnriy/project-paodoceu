// backend/src/tests/services/categoriasService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { CategoriasService } from '../../services/categoriasService';
import { AppError } from '../../middlewares/errorMiddleware';

// Mock do Prisma Client
vi.mock('../../lib/prisma', () => ({
  prisma: {
    categoria: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    produto: {
      count: vi.fn(),
    },
  },
}));

// Cast para os tipos mockados
const prismaMock = prisma as unknown as {
  categoria: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  produto: {
    count: ReturnType<typeof vi.fn>;
  };
};

describe('CategoriasService', () => {
  let categoriasService: CategoriasService;

  beforeEach(() => {
    categoriasService = new CategoriasService();
    // Resetar todos os mocks usados
    vi.mocked(prismaMock.categoria.findFirst).mockReset();
    vi.mocked(prismaMock.categoria.create).mockReset();
    vi.mocked(prismaMock.categoria.findUnique).mockReset();
    vi.mocked(prismaMock.categoria.update).mockReset();
    vi.mocked(prismaMock.categoria.delete).mockReset();
    vi.mocked(prismaMock.categoria.count).mockReset();
    vi.mocked(prismaMock.categoria.findMany).mockReset();
    vi.mocked(prismaMock.produto.count).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Testes de criar()
  describe('criar', () => {
    it('deve criar uma nova categoria com sucesso', async () => {
      const mockCategoria = {
        id: '1',
        nome: 'Padaria',
        criado_em: new Date(),
        atualizado_em: new Date(),
      };
      vi.mocked(prismaMock.categoria.findFirst).mockResolvedValue(null);
      vi.mocked(prismaMock.categoria.create).mockResolvedValue(mockCategoria);

      const result = await categoriasService.criar({ nome: 'Padaria' });
      expect(result).toEqual(mockCategoria);
    });

    it('deve lançar AppError 409 se a categoria já existe', async () => {
      vi.mocked(prismaMock.categoria.findFirst).mockResolvedValue({
        id: '1',
        nome: 'Padaria',
        criado_em: new Date(),
        atualizado_em: new Date(),
      });
      await expect(
        categoriasService.criar({ nome: 'Padaria' }),
      ).rejects.toThrow(
        new AppError('Uma categoria com este nome já existe.', 409),
      );
    });
  });

  // Testes de atualizar()
  describe('atualizar', () => {
    it('deve atualizar uma categoria com sucesso', async () => {
      const mockCategoria = {
        id: '1',
        nome: 'Padaria Antiga',
        criado_em: new Date(),
        atualizado_em: new Date(),
      };
      const mockCategoriaAtualizada = { ...mockCategoria, nome: 'Padaria Nova' };

      vi.mocked(prismaMock.categoria.findUnique).mockResolvedValue(mockCategoria);
      vi.mocked(prismaMock.categoria.findFirst).mockResolvedValue(null);
      vi.mocked(prismaMock.categoria.update).mockResolvedValue(
        mockCategoriaAtualizada,
      );

      const result = await categoriasService.atualizar('1', {
        nome: 'Padaria Nova',
      });
      expect(result.nome).toBe('Padaria Nova');
    });

    it('deve lançar AppError 404 se a categoria não for encontrada', async () => {
      vi.mocked(prismaMock.categoria.findUnique).mockResolvedValue(null);
      await expect(
        categoriasService.atualizar('1', { nome: 'Inexistente' }),
      ).rejects.toThrow(new AppError('Categoria não encontrada.', 404));
    });

    it('deve lançar AppError 409 se o novo nome já existir em outra categoria', async () => {
      vi.mocked(prismaMock.categoria.findUnique).mockResolvedValue({
        id: '1',
        nome: 'Original',
        criado_em: new Date(),
        atualizado_em: new Date(),
      });
      vi.mocked(prismaMock.categoria.findFirst).mockResolvedValue({
        id: '2',
        nome: 'Conflito',
        criado_em: new Date(),
        atualizado_em: new Date(),
      });
      await expect(
        categoriasService.atualizar('1', { nome: 'Conflito' }),
      ).rejects.toThrow(
        new AppError('Já existe outra categoria com este nome.', 409),
      );
    });
  });

  // (P4.2) Teste de 'deletar' alinhado com a regra de negócio
  describe('deletar', () => {
    it('deve deletar uma categoria sem produtos', async () => {
      const mockCategoria = {
        id: '1',
        nome: 'Vazia',
        criado_em: new Date(),
        atualizado_em: new Date(),
      };
      // 1. Mock para findUnique (serviço chama isso primeiro)
      vi.mocked(prismaMock.categoria.findUnique).mockResolvedValue(mockCategoria);
      // 2. Mock para contagem de produtos (retorna 0)
      vi.mocked(prismaMock.produto.count).mockResolvedValue(0);
      // 3. Mock da deleção
      vi.mocked(prismaMock.categoria.delete).mockResolvedValue(mockCategoria);

      await categoriasService.deletar('1');

      expect(prismaMock.categoria.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(prismaMock.produto.count).toHaveBeenCalledWith({
        where: { categoria_id: '1' },
      });
      expect(prismaMock.categoria.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('deve lançar AppError 400 se a categoria tiver produtos associados', async () => {
      const mockCategoria = {
        id: '1',
        nome: 'Cheia',
        criado_em: new Date(),
        atualizado_em: new Date(),
      };
      // 1. Mock para findUnique
      vi.mocked(prismaMock.categoria.findUnique).mockResolvedValue(mockCategoria);
      // 2. Mock para contagem de produtos (retorna 1)
      vi.mocked(prismaMock.produto.count).mockResolvedValue(1);

      // 3. Verificar se o erro correto (AppError) é lançado
      await expect(categoriasService.deletar('1')).rejects.toThrow(
        new AppError(
          'Não é possível deletar a categoria pois ela está associada a produtos.',
          400,
        ),
      );

      // Garantir que o delete não foi chamado
      expect(prismaMock.categoria.delete).not.toHaveBeenCalled();
    });

    it('deve lançar AppError 404 se a categoria não for encontrada', async () => {
      // 1. Mock para findUnique (retorna null)
      vi.mocked(prismaMock.categoria.findUnique).mockResolvedValue(null);

      await expect(categoriasService.deletar('id-invalido')).rejects.toThrow(
        new AppError('Categoria não encontrada.', 404),
      );

      expect(prismaMock.produto.count).not.toHaveBeenCalled();
      expect(prismaMock.categoria.delete).not.toHaveBeenCalled();
    });
  });
});
