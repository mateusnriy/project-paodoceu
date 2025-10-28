import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { CreateProdutoDto } from '../dtos/ICreateProdutoDTO';
import { UpdateProdutoDto } from '../dtos/IUpdateProdutoDTO';
import { Prisma, Produto } from '@prisma/client';

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
  
  async listarPaginado(
    pagina: number,
    limite: number,
    nome?: string
  ): Promise<PaginatedResponse<any>> {
    const where: Prisma.ProdutoWhereInput = {
      ativo: true, 
    };
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
        categoria: true, 
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
  
  async listarTodos(): Promise<Produto[]> {
     return prisma.produto.findMany({
       where: { ativo: true },
       include: { categoria: true },
       orderBy: { nome: 'asc' }
     });
  }

  async obterPorId(id: string): Promise<Produto | null> {
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: { categoria: true },
    });
    if (!produto) {
      throw new AppError('Produto não encontrado.', 404);
    }
    return produto;
  }
  
  async criar(data: CreateProdutoDto): Promise<Produto> {
    const categoriaExiste = await prisma.categoria.findUnique({
      where: { id: data.categoriaId }, 
    });

    if (!categoriaExiste) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    const produto = await prisma.produto.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        preco: data.preco,
        estoque: data.estoque,
        ativo: data.ativo, 
        categoria_id: data.categoriaId, // <<< CORREÇÃO (Era categoriaId)
      },
    });
    return produto;
  }

  async atualizar(id: string, data: UpdateProdutoDto): Promise<Produto> {
    if (data.categoriaId) { 
      const categoriaExiste = await prisma.categoria.findUnique({
        where: { id: data.categoriaId }, 
      });
      if (!categoriaExiste) {
        throw new AppError('Categoria não encontrada.', 404);
      }
    }

    try {
      const produto = await prisma.produto.update({
        where: { id },
        data: {
          nome: data.nome,
          descricao: data.descricao,
          preco: data.preco,
          estoque: data.estoque,
          ativo: data.ativo, 
          categoria_id: data.categoriaId, // <<< CORREÇÃO (Era categoriaId)
        },
      });
      return produto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError('Produto não encontrado.', 404);
        }
      }
      throw error;
    }
  }
  
  async ajustarEstoque(id: string, quantidade: number): Promise<Produto> {
    try {
      const produto = await prisma.produto.update({
        where: { id },
        data: {
          estoque: quantidade, 
        },
      });
      return produto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') { 
          throw new AppError('Produto não encontrado.', 404);
        }
      }
      throw new AppError('Erro interno ao ajustar estoque.', 500);
    }
  }

  async deletar(id: string): Promise<void> {
    try {
      const produto = await prisma.produto.findUnique({
        where: { id },
        include: { _count: { select: { itens_pedido: true } } }
      });
      
      if (!produto) {
        throw new AppError('Produto não encontrado.', 404);
      }

      if (produto._count.itens_pedido > 0) {
        await prisma.produto.update({
          where: { id },
          data: { ativo: false }
        });
         throw new AppError('Produto associado a pedidos. Em vez de deletar, foi marcado como "inativo".', 400);
      }
      
      await prisma.produto.delete({ where: { id } });

    } catch (error) {
      if (error instanceof AppError) {
        throw error; 
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new AppError('Produto não encontrado.', 404);
        }
      }
      throw new AppError('Erro interno ao deletar produto.', 500);
    }
  }
}
