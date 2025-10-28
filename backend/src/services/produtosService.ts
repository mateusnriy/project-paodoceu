import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { CreateProdutoDto } from '../dtos/ICreateProdutoDTO';
import { UpdateProdutoDto } from '../dtos/IUpdateProdutoDTO';
import { Prisma, Produto } from '@prisma/client';

export class ProdutosService {
  
  // (listarPaginado, listarTodos, obterPorId - sem alteração)
  
  async criar(data: CreateProdutoDto): Promise<Produto> {
    const categoriaExiste = await prisma.categoria.findUnique({
      where: { id: data.categoriaId }, // <--- USAR DIRETO
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
        // Remover mapeamento manual
        // categoria: { connect: { id: data.categoria_id } },
        categoriaId: data.categoriaId, // <--- USAR DIRETO
      },
    });
    return produto;
  }

  async atualizar(id: string, data: UpdateProdutoDto): Promise<Produto> {
    if (data.categoriaId) { // <--- USAR DIRETO
      const categoriaExiste = await prisma.categoria.findUnique({
        where: { id: data.categoriaId }, // <--- USAR DIRETO
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
          // Remover mapeamento manual
          // categoriaId: data.categoria_id ? data.categoria_id : undefined,
          categoriaId: data.categoriaId, // <--- USAR DIRETO
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
  
  // (ajustarEstoque, deletar - sem alteração)
}
