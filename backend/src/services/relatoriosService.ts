import { Prisma, PrismaClient, StatusPedido } from '@prisma/client';
import { endOfDay, startOfDay, formatISO } from 'date-fns';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { AppError } from '../middlewares/errorMiddleware';

export class RelatoriosService {
  private getDateRange(dataInicio?: Date, dataFim?: Date) {
    const inicio = dataInicio ? startOfDay(dataInicio) : undefined;
    const fim = dataFim ? endOfDay(dataFim) : undefined;
    return inicio || fim ? { gte: inicio, lte: fim } : undefined;
  }

  private get paidOrderFilter() {
    return {
      status: {
        not: StatusPedido.PENDENTE,
      },
      pagamento: {
        isNot: null,
      },
    };
  }

  private async vendasPorDia(dataInicio?: Date, dataFim?: Date) {
    const range = this.getDateRange(dataInicio, dataFim);
    
    const dataInicioSql = range?.gte ?? startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const dataFimSql = range?.lte ?? endOfDay(new Date());

    const query = Prisma.sql`
      SELECT
        DATE(p."criado_em") as data,
        SUM(p."valor_total") as total
      FROM "pedidos" p
      INNER JOIN "pagamentos" pag ON p."id" = pag."pedido_id"
      WHERE p."criado_em" >= ${dataInicioSql}::timestamp
      AND p."criado_em" <= ${dataFimSql}::timestamp
      GROUP BY DATE(p."criado_em")
      ORDER BY data ASC;
    `;

    try {
      const vendasAgrupadas: { data: Date; total: number }[] =
        await prisma.$queryRaw(query);

      return vendasAgrupadas.map((item) => ({
        data: formatISO(new Date(item.data), { representation: 'date' }),
        total: Number(item.total) || 0,
      }));
    } catch (error: any) {
      logger.error('Erro na query $queryRaw de vendasPorDia:', {
        errorMessage: error.message,
      });
      throw new AppError('Erro ao processar relatório diário.', 500);
    }
  }

  async vendasPorPeriodo(dataInicio?: Date, dataFim?: Date) {
    const range = this.getDateRange(dataInicio, dataFim);

    const agregacao = await prisma.pedido.aggregate({
      _sum: {
        valor_total: true,
      },
      _count: {
        id: true,
      },
      where: {
        ...this.paidOrderFilter,
        criado_em: range,
      },
    });

    const totalVendido = agregacao._sum.valor_total || 0;
    const totalPedidos = agregacao._count.id || 0;
    const ticketMedio = totalPedidos > 0 ? totalVendido / totalPedidos : 0;

    return {
      periodo: {
        inicio: dataInicio?.toISOString().split('T')[0] || 'N/A',
        fim: dataFim?.toISOString().split('T')[0] || 'N/A',
      },
      totalVendido,
      totalPedidos,
      ticketMedio,
    };
  }

  async vendasPorProduto(
    dataInicio?: Date,
    dataFim?: Date,
    limite: number = 5,
  ) {
    const range = this.getDateRange(dataInicio, dataFim);

    const itensVendidosAgrupados = await prisma.itemPedido.groupBy({
      by: ['produto_id'],
      where: {
        pedido: {
          ...this.paidOrderFilter,
          criado_em: range,
        },
      },
      _sum: {
        subtotal: true,
        quantidade: true,
      },
      orderBy: {
        _sum: {
          subtotal: 'desc',
        },
      },
      take: limite,
    });

    const produtoIds = itensVendidosAgrupados.map((item) => item.produto_id);
    const produtos = await prisma.produto.findMany({
      where: { id: { in: produtoIds } },
      select: { id: true, nome: true },
    });
    const produtoMap = new Map(produtos.map((p) => [p.id, p.nome]));

    return itensVendidosAgrupados.map((item) => ({
      nome: produtoMap.get(item.produto_id) || 'Produto Desconhecido',
      quantidade: Number(item._sum.quantidade) || 0,
      total: Number(item._sum.subtotal) || 0,
    }));
  }

  async vendasPorCategoria(dataInicio?: Date, dataFim?: Date) {
    const range = this.getDateRange(dataInicio, dataFim);

    const itensAgrupados = await prisma.itemPedido.groupBy({
      by: ['produto_id'],
      where: {
        pedido: {
          ...this.paidOrderFilter,
          criado_em: range,
        },
      },
      _sum: {
        quantidade: true,
        subtotal: true,
      },
    });

    const produtoIds = itensAgrupados.map((item) => item.produto_id);
    const produtosComCategoria = await prisma.produto.findMany({
      where: { id: { in: produtoIds } },
      select: {
        id: true,
        categoria_id: true,
        categoria: {
          select: { nome: true },
        },
      },
    });
    const produtoCategoriaMap = new Map(
      produtosComCategoria.map((p) => [
        p.id,
        { id: p.categoria_id, nome: p.categoria.nome },
      ]),
    );

    const relatorioMap = new Map<string, { nome: string; quantidade: number; valor: number }>();

    for (const item of itensAgrupados) {
      const categoria = produtoCategoriaMap.get(item.produto_id);
      if (!categoria) continue;

      const { id, nome } = categoria;
      const quantidade = Number(item._sum.quantidade) || 0;
      const valor = Number(item._sum.subtotal) || 0;

      const entrada = relatorioMap.get(id) || { nome, quantidade: 0, valor: 0 };
      entrada.quantidade += quantidade;
      entrada.valor += valor;
      relatorioMap.set(id, entrada);
    }

    return Array.from(relatorioMap.values()).sort((a, b) => b.valor - a.valor);
  }

  async relatorioDeVendas(
    tipo: string,
    dataInicio?: Date,
    dataFim?: Date,
    limite?: number,
  ) {
    switch (tipo) {
      case 'periodo':
        return this.vendasPorPeriodo(dataInicio, dataFim);
      case 'produto':
        return this.vendasPorProduto(dataInicio, dataFim, limite);
      case 'categoria':
        return this.vendasPorCategoria(dataInicio, dataFim);
      case 'diario':
        return this.vendasPorDia(dataInicio, dataFim);
      default:
        throw new AppError(
          "Tipo de relatório inválido. Valores válidos: 'periodo', 'produto', 'categoria', 'diario'.",
          400,
        );
    }
  }
}
