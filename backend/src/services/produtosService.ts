import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { CreateProdutoDto } from '../dtos/ICreateProdutoDTO';
import { UpdateProdutoDto } from '../dtos/IUpdateProdutoDTO';
import { Prisma, Produto } from '@prisma/client';
import { PaginatedResponse } from '../types/pagination'; // (CORREÇÃO ERRO 7) Importação agora funciona

export class ProdutosService {
  /**
   * Lista produtos para o painel de Administração (paginado).
   * CORREÇÃO P1.5: Remove o filtro 'ativo: true' para que admins vejam todos.
   */
  async listarPaginado(
    pagina: number,
    limite: number,
    nome?: string,
  ): Promise<PaginatedResponse<Produto>> {
    const where: Prisma.ProdutoWhereInput = {}; // Objeto 'where' base

    // CORREÇÃO P1.5: Filtro 'ativo: true' REMOVIDO daqui.
    // O Admin (RF02/UC05) deve poder ver todos os produtos.

    if (nome) {
      where.nome = {
        contains: nome,
        mode: 'insensitive',
      };
    }

    // Executa as duas queries em paralelo para otimização
    const [totalItens, data] = await prisma.$transaction([
      prisma.produto.count({ where }),
      prisma.produto.findMany({
        where,
        include: {
          categoria: true, // Inclui a categoria (importante para o Admin)
        },
        orderBy: {
          nome: 'asc',
        },
        take: limite,
        skip: (pagina - 1) * limite,
      }),
    ]);

    const totalPaginas = Math.ceil(totalItens / limite);

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

  /**
   * Lista produtos para o PDV (apenas ativos e com estoque).
   * (RF05, RN05, RN06)
   */
  async listarTodosAtivos(): Promise<Produto[]> {
    return prisma.produto.findMany({
      where: {
        ativo: true,
        // RN06 (Bloqueio de Venda) é aplicado no PDV
        estoque: {
          gt: 0,
        },
      },
      include: { categoria: true },
      orderBy: { nome: 'asc' },
    });
  }

  async obterPorId(id: string): Promise<Produto> {
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
    // CORREÇÃO P1.1: Usa data.categoria_id (snake_case)
    const categoriaExiste = await prisma.categoria.findUnique({
      where: { id: data.categoria_id },
    });

    if (!categoriaExiste) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    // Valida nome único
    const nomeExistente = await prisma.produto.findFirst({
      where: { nome: { equals: data.nome, mode: 'insensitive' } },
    });
    if (nomeExistente) {
      throw new AppError('Um produto com este nome já existe.', 409);
    }

    const produto = await prisma.produto.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        preco: data.preco, // Prisma/Zod cuidam da conversão Num -> Decimal
        estoque: data.estoque,
        ativo: data.ativo,
        categoria_id: data.categoria_id, // CORREÇÃO P1.1
      },
    });
    return produto;
  }

  async atualizar(id: string, data: UpdateProdutoDto): Promise<Produto> {
    // CORREÇÃO P1.1: Usa data.categoria_id
    if (data.categoria_id) {
      const categoriaExiste = await prisma.categoria.findUnique({
        where: { id: data.categoria_id },
      });
      if (!categoriaExiste) {
        throw new AppError('Categoria não encontrada.', 404);
      }
    }

    // Valida nome único
    if (data.nome) {
      const nomeExistente = await prisma.produto.findFirst({
        where: {
          nome: { equals: data.nome, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (nomeExistente) {
        throw new AppError('Já existe outro produto com este nome.', 409);
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
          categoria_id: data.categoria_id, // CORREÇÃO P1.1
        },
      });
      return produto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2025 = "Record to update not found"
        if (error.code === 'P2025') {
          throw new AppError('Produto não encontrado.', 404);
        }
      }
      throw error;
    }
  }

  /**
   * Ajuste rápido de estoque (RF14, RF22)
   */
  async ajustarEstoque(id: string, quantidade: number): Promise<Produto> {
    if (quantidade < 0) {
      throw new AppError('Estoque não pode ser negativo.', 400);
    }

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
        include: { _count: { select: { itens_pedido: true } } },
      });

      if (!produto) {
        throw new AppError('Produto não encontrado.', 404);
      }

      // Se houver pedidos associados, não deleta, apenas inativa (DRS)
      if (produto._count.itens_pedido > 0) {
        await prisma.produto.update({
          where: { id },
          data: { ativo: false },
        });
        // Lança erro 400 (Bad Request) informando a ação tomada
        throw new AppError(
          'Produto associado a pedidos. Em vez de deletar, foi marcado como "inativo".',
          400,
        );
      }

      // Se não houver pedidos, deleta permanentemente
      await prisma.produto.delete({ where: { id } });
    } catch (error) {
      if (error instanceof AppError) {
        throw error; // Re-lança o AppError (ex: 404 ou 400)
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

