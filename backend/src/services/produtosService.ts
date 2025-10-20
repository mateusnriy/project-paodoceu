// mateusnriy/project-paodoceu/project-paodoceu-main/backend/src/services/produtosService.ts
import { PrismaClient, Produto, Prisma } from '@prisma/client';
import { CreateProdutoDto } from '../dtos/ICreateProdutoDTO';
import { UpdateProdutoDto } from '../dtos/IUpdateProdutoDTO';
import { AppError } from '../middlewares/errorMiddleware';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';

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

export class ProdutosService {
  
  // <<< CORREÇÃO: Renomeado para listarPaginado >>>
  async listarPaginado(
    pagina: number,
    limite: number,
    nome?: string
  ): Promise<PaginatedResponse<any>> {
    
    const where: Prisma.ProdutoWhereInput = {};
    if (nome) {
      where.nome = {
        contains: nome,
        mode: 'insensitive',
      };
    }

    const totalItens = await prisma.produto.count({ where });
    const totalPaginas = Math.ceil(totalItens / limite);
    const skip = (pagina - 1) * limite;

    const data = await prisma.produto.findMany({
      where,
      include: {
        categoria: {
          select: { id: true, nome: true },
        },
      },
      orderBy: {
        nome: 'asc',
      },
      take: limite,
      skip: skip,
    });

    return {
      // <<< CORREÇÃO: Mapear 'quantidadeEstoque' e 'categoriaId' para o frontend >>>
      data: data.map(p => ({
          ...p,
          quantidadeEstoque: p.estoque, // Mapeia 'estoque' (db) para 'quantidadeEstoque' (frontend)
          categoriaId: p.categoria_id,  // Mapeia 'categoria_id' (db) para 'categoriaId' (frontend)
          imagemUrl: p.imagem_url,      // Mapeia 'imagem_url' (db) para 'imagemUrl' (frontend)
      })),
      meta: {
        total: totalItens,
        pagina,
        limite,
        totalPaginas,
      },
    };
  }

  async obterPorId(id: string): Promise<any | null> {
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: {
        categoria: {
          select: { id: true, nome: true },
        },
      },
    });

    if (!produto) return null;
    
    // <<< CORREÇÃO: Mapear campos para o frontend >>>
    return {
        ...produto,
        quantidadeEstoque: produto.estoque,
        categoriaId: produto.categoria_id,
        imagemUrl: produto.imagem_url,
    };
  }

  async criar(data: CreateProdutoDto): Promise<Produto> {
    const categoria = await prisma.categoria.findUnique({ where: { id: data.categoria_id } });
    if (!categoria) {
      throw new AppError('Categoria não encontrada.', 404);
    }
    
    try {
        // <<< CORREÇÃO: Mapear DTO (frontend) para Schema (db) >>>
        const { estoque, categoria_id, imagem_url, ...restData } = data;
        return prisma.produto.create({ 
            data: {
                ...restData,
                estoque: estoque ?? 0,
                categoria_id: categoria_id,
                imagem_url: imagem_url
            } 
        });
    } catch (error: any) {
        logger.error('Error creating product in Prisma:', { error: error.message, code: error.code });
        throw new AppError('Erro interno ao criar produto.', 500);
    }
  }

  async atualizar(id: string, data: UpdateProdutoDto): Promise<Produto> {
    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      throw new AppError('Produto não encontrado.', 404);
    }

    if (data.categoria_id) {
        const categoria = await prisma.categoria.findUnique({ where: { id: data.categoria_id } });
        if (!categoria) {
            throw new AppError('Nova categoria não encontrada.', 404);
        }
    }
    
    try {
        // <<< CORREÇÃO: Mapear DTO (frontend) para Schema (db) >>>
        const { estoque, categoria_id, imagem_url, ...restData } = data;
        const dataToUpdate: Prisma.ProdutoUpdateInput = { ...restData };
        
        if (estoque !== undefined) dataToUpdate.estoque = estoque;
        if (categoria_id !== undefined) dataToUpdate.categoria_id = categoria_id;
        if (imagem_url !== undefined) dataToUpdate.imagem_url = imagem_url;

        return prisma.produto.update({ 
            where: { id }, 
            data: dataToUpdate
        });
    } catch (error: any) {
         logger.error('Error updating product in Prisma:', { error: error.message, code: error.code });
         throw new AppError('Erro interno ao atualizar produto.', 500);
    }
  }

  async ajustarEstoque(id: string, quantidade: number): Promise<Produto> {
    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      throw new AppError('Produto não encontrado.', 404);
    }
    if (quantidade < 0) {
      throw new AppError('A quantidade em estoque não pode ser negativa.', 400);
    }
    
    try {
        return prisma.produto.update({
          where: { id },
          data: { estoque: quantidade },
        });
    } catch (error: any) {
         logger.error('Error adjusting stock in Prisma:', { error: error.message, code: error.code });
         throw new AppError('Erro interno ao ajustar estoque.', 500);
    }
  }

  async deletar(id: string): Promise<void> {
    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      throw new AppError('Produto não encontrado.', 404);
    }
    
    try {
        await prisma.produto.delete({ where: { id } });
    } catch (error: any) {
         logger.error('Error deleting product in Prisma:', { error: error.message, code: error.code });
         if (error.code === 'P2003') { // Erro de Foreign Key
             throw new AppError('Não é possível deletar o produto pois ele está associado a pedidos.', 400);
         }
         throw new AppError('Erro interno ao deletar produto.', 500);
    }
  }
}