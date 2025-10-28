// mateusnriy/project-paodoceu/project-paodoceu-main/backend/src/services/categoriasService.ts
import { Categoria, Prisma } from '@prisma/client';
import { CreateCategoriaDto } from '../dtos/ICreateCategoriaDTO';
import { UpdateCategoriaDto } from '../dtos/IUpdateCategoriaDTO';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { logger } from '../lib/logger'; // <<< CORREÇÃO (Era import default)

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
  
  // <<< CORREÇÃO: Método mantido para /api/categorias (usePOS) >>>
  async listarTodas(): Promise<any[]> { 
    return prisma.categoria.findMany({
      include: {
        _count: {
          select: { produtos: true },
        },
      },
      orderBy: {
        nome: 'asc'
      }
    });
  }

  // <<< CORREÇÃO: Novo método para paginação (Admin) >>>
  async listarPaginado(
    pagina: number,
    limite: number,
    nome?: string
  ): Promise<PaginatedResponse<any>> {
    
    const where: Prisma.CategoriaWhereInput = {};
    if (nome) {
      where.nome = {
        contains: nome,
        mode: 'insensitive',
      };
    }

    const totalItens = await prisma.categoria.count({ where });
    const totalPaginas = Math.ceil(totalItens / limite);
    const skip = (pagina - 1) * limite;

    const data = await prisma.categoria.findMany({
      where,
      include: {
        _count: {
          select: { produtos: true },
        },
      },
      orderBy: {
        nome: 'asc',
      },
      take: limite,
      skip: skip,
    });

    return {
      data,
      meta: {
        total: totalItens,
        pagina,
        limite,
        totalPaginas,
      },
    };
  }

  async obterPorId(id: string): Promise<Categoria | null> {
    return prisma.categoria.findUnique({ where: { id } });
  }

  async criar(data: CreateCategoriaDto): Promise<Categoria> {
    const categoriaExistente = await prisma.categoria.findFirst({
      where: { nome: { equals: data.nome, mode: 'insensitive' } },
    });

    if (categoriaExistente) {
      throw new AppError('Uma categoria com este nome já existe.', 409); // 409 Conflict
    }

    try {
      return await prisma.categoria.create({ data });
    } catch (error: any) {
        logger.error('Error creating category in Prisma:', {
            errorMessage: error.message,
            errorCode: error.code,
            meta: error.meta,
        });
         if (error.code === 'P2002' && error.meta?.target?.includes('nome')) {
             throw new AppError('Uma categoria com este nome já existe (constraint falhou).', 409);
         }
        throw new AppError('Erro interno ao criar categoria.', 500);
    }
  }

  async atualizar(id: string, data: UpdateCategoriaDto): Promise<Categoria> {
    const categoria = await prisma.categoria.findUnique({ where: { id } });
    if (!categoria) {
      throw new AppError('Categoria não encontrada.', 404);
    }

     if (data.nome) {
         const existingName = await prisma.categoria.findFirst({
             where: {
                 nome: { equals: data.nome, mode: 'insensitive' },
                 id: { not: id } // Excluir o próprio ID
             }
         });
         if (existingName) {
             throw new AppError('Já existe outra categoria com este nome.', 409);
         }
     }

    try {
        return await prisma.categoria.update({
          where: { id },
          data,
        });
    } catch (error: any) {
         logger.error('Error updating category in Prisma:', { error: error.message, code: error.code });
         if (error.code === 'P2002' && error.meta?.target?.includes('nome')) {
             throw new AppError('Já existe outra categoria com este nome.', 409);
         }
         throw new AppError('Erro interno ao atualizar categoria.', 500);
    }
  }

  async deletar(id: string): Promise<void> {
    const categoria = await prisma.categoria.findUnique({ 
        where: { id },
        include: { _count: { select: { produtos: true } } }
    });
    if (!categoria) {
      throw new AppError('Categoria não encontrada.', 404);
    }
    
    if (categoria._count.produtos > 0) {
      throw new AppError('Não é possível deletar a categoria pois ela está associada a produtos.', 400);
    }

    try {
        await prisma.categoria.delete({ where: { id } });
    } catch (error: any) {
         logger.error('Error deleting category in Prisma:', { error: error.message, code: error.code });
         throw new AppError('Erro interno ao deletar categoria.', 500);
    }
  }
}
