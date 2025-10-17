import { Categoria } from '@prisma/client';
import { CreateCategoriaDto } from '../dtos/ICreateCategoriaDTO';
import { UpdateCategoriaDto } from '../dtos/IUpdateCategoriaDTO';
import { prisma } from '../lib/prisma';

export class CategoriasService {
  async listarTodas(): Promise<any[]> { 
    return prisma.categoria.findMany({
      include: {
        _count: {
          select: { produtos: true },
        },
      },
    });
  }

  async obterPorId(id: string): Promise<Categoria | null> {
    return prisma.categoria.findUnique({ where: { id } });
  }

  async criar(data: CreateCategoriaDto): Promise<Categoria> {
    const categoriaExistente = await prisma.categoria.findFirst({
      where: { nome: { equals: data.nome, mode: 'insensitive' } },
    });

    if (categoriaExistente) {
      throw new Error('Uma categoria com este nome já existe.');
    }

    return prisma.categoria.create({ data });
  }

  async atualizar(id: string, data: UpdateCategoriaDto): Promise<Categoria> {
    const categoria = await prisma.categoria.findUnique({ where: { id } });
    if (!categoria) {
      throw new Error('Categoria não encontrada.');
    }
    return prisma.categoria.update({
      where: { id },
      data,
    });
  }

  async deletar(id: string): Promise<void> {
    const categoria = await prisma.categoria.findUnique({ where: { id } });
    if (!categoria) {
      throw new Error('Categoria não encontrada.');
    }
    
    const produtoComCategoria = await prisma.produto.findFirst({ where: { categoria_id: id } });
    if (produtoComCategoria) {
      throw new Error('Não é possível deletar a categoria pois ela está associada a produtos.');
    }

    await prisma.categoria.delete({ where: { id } });
  }
}
