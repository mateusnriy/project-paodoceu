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
      // Mapear campos para o frontend
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

    // Mapear campos para o frontend
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
        // Mapear DTO (frontend/controller) para Schema (db)
        const { estoque, categoria_id, imagem_url, ...restData } = data;
        return prisma.produto.create({
            data: {
                ...restData,
                estoque: estoque ?? 0,
                categoria_id: categoria_id, // Correto para criação
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

    // Valida se a categoria existe, se for fornecida
    if (data.categoria_id) {
        const categoria = await prisma.categoria.findUnique({ where: { id: data.categoria_id } });
        if (!categoria) {
            throw new AppError('Nova categoria não encontrada.', 404);
        }
    }

    try {
        // Desestrutura a DTO.
        const { estoque, categoria_id, imagem_url, ...restData } = data;

        // Monta o objeto de dados para atualização usando Prisma.ProdutoUpdateInput
        const dataToUpdate: Prisma.ProdutoUpdateInput = { ...restData };

        if (estoque !== undefined) dataToUpdate.estoque = estoque;

        // *** CORREÇÃO APLICADA AQUI ***
        // Usa a sintaxe de relação 'connect' para atualizar a FK.
        if (categoria_id !== undefined) {
             dataToUpdate.categoria = { connect: { id: categoria_id } };
        }

        // Garante que o campo é atualizado para null se for explicitamente fornecido como null
        // ou se a string vazia foi convertida para null no controller.
        if (imagem_url !== undefined) dataToUpdate.imagem_url = imagem_url;

        // Executa a atualização no banco de dados
        const updatedProduto = await prisma.produto.update({
            where: { id },
            data: dataToUpdate
        });
        
        // Mapeia o resultado de volta para o formato esperado pelo frontend, se necessário
        // (O Prisma retorna com snake_case por padrão)
        return {
            ...updatedProduto,
            quantidadeEstoque: updatedProduto.estoque,
            categoriaId: updatedProduto.categoria_id,
            imagemUrl: updatedProduto.imagem_url,
        } as any; // Usar 'as any' aqui pode ser necessário se houver conflito de tipo temporário

    } catch (error: any) {
         logger.error('Error updating product in Prisma:', { error: error.message, code: error.code, data });
         if (error.code === 'P2025') { // Recurso não encontrado para atualização
             throw new AppError('Produto não encontrado para atualização.', 404);
         }
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
        const updatedProduto = await prisma.produto.update({
          where: { id },
          data: { estoque: quantidade },
        });
        // Mapeia o resultado
        return {
            ...updatedProduto,
            quantidadeEstoque: updatedProduto.estoque,
            categoriaId: updatedProduto.categoria_id,
            imagemUrl: updatedProduto.imagem_url,
        } as any;
    } catch (error: any) {
         logger.error('Error adjusting stock in Prisma:', { error: error.message, code: error.code });
         if (error.code === 'P2025') {
              throw new AppError('Produto não encontrado para ajuste de estoque.', 404);
         }
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
         if (error.code === 'P2003' || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2014')) { // Erro de Foreign Key ou relação
             throw new AppError('Não é possível deletar o produto pois ele está associado a pedidos.', 400);
         }
         if (error.code === 'P2025') { // "Record to delete does not exist"
              throw new AppError('Produto não encontrado para deleção.', 404);
         }
         throw new AppError('Erro interno ao deletar produto.', 500);
    }
  }
}
