import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { Pedido, Prisma, StatusPedido } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';

export class RelatoriosService {
  /**
   * Gera um relatório de vendas consolidado (RF13).
   */
  async obterRelatorioVendas(
    dataInicio: Date,
    dataFim: Date,
  ): Promise<any> {
    if (dataInicio > dataFim) {
      throw new AppError('Data inicial deve ser anterior à data final.', 400);
    }

    // Ajustar datas para cobrir o dia inteiro
    const inicio = startOfDay(dataInicio);
    const fim = endOfDay(dataFim);

    // 1. Agregação principal (Total Vendido, Total Pedidos)
    const agregacao = await prisma.pedido.aggregate({
      _sum: {
        valor_total: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: StatusPedido.ENTREGUE, // Apenas pedidos concluídos
        criado_em: {
          gte: inicio,
          lte: fim,
        },
      },
    });

    // (CORREÇÃO ERRO 8) Usar Decimal para cálculos
    // const totalVendido = agregacao._sum.valor_total || 0; // OLD
    // _sum retorna Decimal | null
    const totalVendidoDecimal =
      agregacao._sum.valor_total ?? new Prisma.Decimal(0);
    const totalPedidos = agregacao._count.id; // _count retorna number

    // const ticketMedio = totalPedidos > 0 ? totalVendido / totalPedidos : 0; // OLD
    const ticketMedioDecimal =
      totalPedidos > 0
        ? totalVendidoDecimal.dividedBy(totalPedidos)
        : new Prisma.Decimal(0);

    // 2. Produtos Mais Vendidos
    const produtosMaisVendidos = await prisma.itemPedido.groupBy({
      by: ['produto_id'],
      _sum: {
        quantidade: true,
        subtotal: true,
      },
      where: {
        pedido: {
          status: StatusPedido.ENTREGUE,
          criado_em: { gte: inicio, lte: fim },
        },
      },
      orderBy: {
        _sum: {
          quantidade: 'desc',
        },
      },
      take: 10,
    });

    // 3. Buscar nomes dos produtos (otimização: buscar todos de uma vez)
    const produtoIds = produtosMaisVendidos.map((p) => p.produto_id);
    const produtos = await prisma.produto.findMany({
      where: { id: { in: produtoIds } },
      select: { id: true, nome: true },
    });
    const produtosMap = new Map(produtos.map((p) => [p.id, p.nome]));

    // Mapear resultado
    const topProdutos = produtosMaisVendidos.map((p) => ({
      produtoNome: produtosMap.get(p.produto_id) || 'Produto Excluído',
      quantidadeVendida: p._sum.quantidade || 0,
      // (CORREÇÃO ERRO 8) Converter Decimal para DTO
      totalVendido: p._sum.subtotal?.toNumber() || 0,
    }));

    // 4. Vendas por Categoria
    const vendasPorCategoria = await prisma.itemPedido.groupBy({
      by: ['produto_id'], // Agrupa por produto
      _sum: {
        subtotal: true,
      },
      where: {
        pedido: {
          status: StatusPedido.ENTREGUE,
          criado_em: { gte: inicio, lte: fim },
        },
      },
    });

    // Buscar categorias dos produtos
    const produtosComCategoria = await prisma.produto.findMany({
      where: {
        id: { in: vendasPorCategoria.map((p) => p.produto_id) },
      },
      select: {
        id: true,
        categoria: { select: { id: true, nome: true } },
      },
    });
    const produtoCategoriaMap = new Map(
      produtosComCategoria.map((p) => [p.id, p.categoria]),
    );

    // Consolidar por Categoria
    const consolidadoCategoria: Record<
      string,
      { nome: string; total: Prisma.Decimal }
    > = {};

    for (const item of vendasPorCategoria) {
      const categoria = produtoCategoriaMap.get(item.produto_id);
      if (categoria && item._sum.subtotal) {
        if (!consolidadoCategoria[categoria.id]) {
          consolidadoCategoria[categoria.id] = {
            nome: categoria.nome,
            total: new Prisma.Decimal(0),
          };
        }
        consolidadoCategoria[categoria.id].total =
          consolidadoCategoria[categoria.id].total.plus(item._sum.subtotal);
      }
    }

    const topCategorias = Object.values(consolidadoCategoria)
      .map((c) => ({
        ...c,
        // (CORREÇÃO ERRO 8) Converter Decimal para DTO
        total: c.total.toNumber(),
      }))
      .sort((a, b) => b.total - a.total);

    return {
      periodo: { inicio, fim },
      resumo: {
        // (CORREÇÃO ERRO 8) Converter Decimal para DTO (saída da API)
        totalVendido: totalVendidoDecimal.toNumber(),
        totalPedidos,
        ticketMedio: ticketMedioDecimal.toDecimalPlaces(2).toNumber(),
      },
      topProdutos,
      topCategorias,
    };
  }
}

