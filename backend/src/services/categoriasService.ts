import { Categoria, Prisma } from '@prisma/client';
import { AppError } from '../middlewares/errorMiddleware';
import { prisma } from '../lib/prisma';
import { CreateCategoriaDto } from '../dtos/ICreateCategoriaDTO';
import { UpdateCategoriaDto } from '../dtos/IUpdateCategoriaDTO';
import { logger } from '../lib/logger';

// Interface para a resposta paginada
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

export class CategoriasService {
  async listarPaginado(
    pagina: number,
    limite: number,
    nome?: string,
  ): Promise<PaginatedResponse<Categoria>> {
    const where: Prisma.CategoriaWhereInput = {};
    if (nome) {
      where.nome = { contains: nome, mode: 'insensitive' };
    }

    const totalItens = await prisma.categoria.count({ where });
    const totalPaginas = Math.ceil(totalItens / limite);
    const skip = (pagina - 1) * limite;

    const categorias = await prisma.categoria.findMany({
      where,
      orderBy: { nome: 'asc' },
      take: limite,
      skip: skip,
      include: {
        _count: {
          select: { produtos: true },
        },
      },
    });

    return {
      data: categorias,
      meta: {
        total: totalItens,
        pagina,
        limite,
        totalPaginas,
      },
    };
  }

  async listarTodas(): Promise<Categoria[]> {
    return prisma.categoria.findMany({
      where: {
      },
      orderBy: {
        nome: 'asc',
      },
      include: {
        _count: {
          select: { produtos: true },
        },
      },
    });
  }

  async obterPorId(id: string): Promise<Categoria | null> {
    return prisma.categoria.findUnique({
      where: { id },
    });
  }

  async criar(data: CreateCategoriaDto): Promise<Categoria> {
    const categoriaExistente = await prisma.categoria.findFirst({
      where: { nome: { equals: data.nome, mode: 'insensitive' } },
    });
    if (categoriaExistente) {
      throw new AppError('Uma categoria com este nome já existe.', 409);
    }
    
    try {
        const novaCategoria = await prisma.categoria.create({ data });
        return novaCategoria;
    } catch (error: any) {
         logger.error('Erro ao criar categoria:', { error: error.message, code: error.code });
         throw new AppError('Erro interno ao criar categoria.', 500);
    }
  }

  async atualizar(id: string, data: UpdateCategoriaDto): Promise<Categoria> {
    const categoriaExistente = await prisma.categoria.findUnique({
      where: { id },
    });
    if (!categoriaExistente) {
      throw new AppError('Categoria não encontrada.', 404);
    }
    
    if (data.nome) {
        const conflitoNome = await prisma.categoria.findFirst({
            where: {
                nome: { equals: data.nome, mode: 'insensitive' },
                id: { not: id }
            }
        });
        if (conflitoNome) {
             throw new AppError('Já existe outra categoria com este nome.', 409);
        }
    }

    try {
        const categoriaAtualizada = await prisma.categoria.update({
          where: { id },
          data,
        });
        return categoriaAtualizada;
    } catch (error: any) {
         logger.error('Erro ao atualizar categoria:', { error: error.message, code: error.code });
         if (error.code === 'P2025') {
              throw new AppError('Categoria não encontrada (concorrência).', 404);
         }
         throw new AppError('Erro interno ao atualizar categoria.', 500);
    }
  }

  
  async deletar(id: string): Promise<void> {
    const categoria = await prisma.categoria.findUnique({
      where: { id },
    });

    if (!categoria) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    const contagemProdutos = await prisma.produto.count({
      where: { categoria_id: id },
    });

    if (contagemProdutos > 0) {
      throw new AppError(
        'Não é possível deletar a categoria pois ela está associada a produtos.',
        400,
      );
    }

    try {
      await prisma.categoria.delete({
        where: { id },
      });
    } catch (error: any) {
      logger.error('Erro ao deletar categoria (catch):', { error: error.message, code: error.code });
      if (error.code === 'P2025') {
        throw new AppError('Categoria não encontrada.', 404);
      }
      throw new AppError('Erro interno ao deletar categoria.', 500);
    }
  }
}
