// src/services/categorias.service.ts
import { PrismaClient, Categoria } from '@prisma/client';
import { CreateCategoriaDto } from '../dtos/CreateCategoriaDto';
import { UpdateCategoriaDto } from '../dtos/UpdateCategoriaDto';

const prisma = new PrismaClient();

export class CategoriasService {
  async listarTodas(): Promise<Categoria[]> {
    return prisma.categoria.findMany();
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
    
    // Verifica se a categoria está sendo usada por algum produto
    const produtoComCategoria = await prisma.produto.findFirst({ where: { categoria_id: id } });
    if (produtoComCategoria) {
      throw new Error('Não é possível deletar a categoria pois ela está associada a produtos.');
    }

    await prisma.categoria.delete({ where: { id } });
  }
}
