// src/services/produtos.service.ts
import { PrismaClient, Produto } from '@prisma/client';
import { CreateProdutoDto } from '../dtos/CreateProdutoDto';
import { UpdateProdutoDto } from '../dtos/UpdateProdutoDto';

const prisma = new PrismaClient();

export class ProdutosService {
  async listarTodos(): Promise<any[]> {
    // Inclui a informação da categoria no retorno
    return prisma.produto.findMany({
      include: {
        categoria: {
          select: { id: true, nome: true },
        },
      },
    });
  }

  async obterPorId(id: string): Promise<any | null> {
    return prisma.produto.findUnique({
      where: { id },
      include: {
        categoria: {
          select: { id: true, nome: true },
        },
      },
    });
  }

  async criar(data: CreateProdutoDto): Promise<Produto> {
    const categoria = await prisma.categoria.findUnique({ where: { id: data.categoria_id } });
    if (!categoria) {
      throw new Error('Categoria não encontrada.');
    }
    return prisma.produto.create({ data });
  }

  async atualizar(id: string, data: UpdateProdutoDto): Promise<Produto> {
    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      throw new Error('Produto não encontrado.');
    }
    // Se a categoria for alterada, verifica se a nova categoria existe
    if (data.categoria_id) {
        const categoria = await prisma.categoria.findUnique({ where: { id: data.categoria_id } });
        if (!categoria) {
            throw new Error('Nova categoria não encontrada.');
        }
    }
    return prisma.produto.update({ where: { id }, data });
  }

  async ajustarEstoque(id: string, quantidade: number): Promise<Produto> {
    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      throw new Error('Produto não encontrado.');
    }
    if (quantidade < 0) {
      throw new Error('A quantidade em estoque não pode ser negativa.');
    }
    return prisma.produto.update({
      where: { id },
      data: { estoque: quantidade },
    });
  }

  async deletar(id: string): Promise<void> {
    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      throw new Error('Produto não encontrado.');
    }
    await prisma.produto.delete({ where: { id } });
  }
}
