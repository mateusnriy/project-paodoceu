// mateusnriy/project-paodoceu/project-paodoceu-main/backend/src/services/relatoriosService.ts
import { PrismaClient, Pedido, ItemPedido, Produto, Categoria, Prisma } from '@prisma/client';
import { endOfDay, startOfDay, formatISO } from 'date-fns';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';
import { AppError } from '../middlewares/errorMiddleware';

export class RelatoriosService {

  private getDateRange(dataInicio?: Date, dataFim?: Date) {
    const inicio = dataInicio ? startOfDay(dataInicio) : undefined;
    const fim = dataFim ? endOfDay(dataFim) : undefined;
    return { gte: inicio, lte: fim };
  }

  private async vendasPorDia(dataInicio?: Date, dataFim?: Date) {
    const range = this.getDateRange(dataInicio, dataFim);
    const dataInicioSql = range.gte ? range.gte : startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const dataFimSql = range.lte ? range.lte : endOfDay(new Date());

    // <<< CORREÇÃO: Usar JOIN com 'pagamentos' (nome correto da tabela) >>>
    const query = Prisma.sql`
      SELECT
        DATE(p."criado_em") as data,
        SUM(p."valor_total") as total
      FROM "pedidos" p
      INNER JOIN "pagamentos" pag ON p."id" = pag."pedido_id" -- <<< Garante que existe pagamento
      WHERE p."criado_em" >= ${dataInicioSql}::timestamp
      AND p."criado_em" <= ${dataFimSql}::timestamp
      GROUP BY DATE(p."criado_em")
      ORDER BY data ASC;
    `;

    try {
        const vendasAgrupadas: { data: Date; total: Prisma.Decimal }[] = await prisma.$queryRaw(query);

        return vendasAgrupadas.map(item => ({
            data: formatISO(new Date(item.data), { representation: 'date' }),
            total: item.total.toNumber() || 0, // Converter Decimal para number
        }));

    } catch (error: any) {
        logger.error('Erro na query $queryRaw de vendasPorDia:', {
            errorMessage: error.message,
            query: query.sql,
            values: query.values
        });
        throw new AppError('Erro ao processar relatório diário.', 500);
    }
  }


  async vendasPorPeriodo(dataInicio?: Date, dataFim?: Date) {
    const range = this.getDateRange(dataInicio, dataFim);

    const pedidosPagos = await prisma.pedido.findMany({
      where: {
        // <<< CORREÇÃO: Filtrar pela relação 'pagamento' >>>
        pagamento: {
          isNot: null
        },
        criado_em: range,
      },
    });

    const totalVendido = pedidosPagos.reduce((acc: number, pedido: Pedido) => acc + pedido.valor_total, 0);
    const totalPedidos = pedidosPagos.length;
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

  async vendasPorProduto(dataInicio?: Date, dataFim?: Date, limite: number = 5) {
    const range = this.getDateRange(dataInicio, dataFim);

    const itensVendidosAgrupados = await prisma.itemPedido.groupBy({
        by: ['produto_id'],
        where: {
            pedido: {
                // <<< CORREÇÃO: Filtrar pela relação 'pagamento' >>>
                pagamento: {
                  isNot: null
                },
                criado_em: range,
            }
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

     const produtoIds = itensVendidosAgrupados.map(item => item.produto_id);
     const produtos = await prisma.produto.findMany({
         where: { id: { in: produtoIds } },
         select: { id: true, nome: true }
     });
     const produtoMap = new Map(produtos.map(p => [p.id, p.nome]));

     return itensVendidosAgrupados.map(item => ({
        nome: produtoMap.get(item.produto_id) || 'Produto Desconhecido',
        quantidade: Number(item._sum.quantidade) || 0,
        total: Number(item._sum.subtotal) || 0,
    }));

  }

  async vendasPorCategoria(dataInicio?: Date, dataFim?: Date) {
    const range = this.getDateRange(dataInicio, dataFim);

    const agregacaoPorCategoria = await prisma.categoria.findMany({
        select: {
            id: true,
            nome: true,
            produtos: {
                select: {
                    itens_pedido: {
                        where: {
                            pedido: {
                                // <<< CORREÇÃO: Filtrar pela relação 'pagamento' >>>
                                pagamento: {
                                  isNot: null
                                },
                                criado_em: range,
                            }
                        },
                        select: {
                            quantidade: true,
                            subtotal: true
                        }
                    }
                }
            }
        },
         where: {
              produtos: {
                 some: {
                     itens_pedido: {
                         some: {
                             pedido: {
                                // <<< CORREÇÃO: Filtrar pela relação 'pagamento' >>>
                                pagamento: {
                                  isNot: null
                                },
                                criado_em: range,
                             }
                         }
                     }
                 }
             }
         }
    });

    const relatorio: { nome: string; quantidade: number; valor: number }[] = [];
    agregacaoPorCategoria.forEach(categoria => {
        let quantidadeTotal = 0;
        let valorTotal = 0;
        categoria.produtos.forEach(produto => {
            produto.itens_pedido.forEach(item => {
                quantidadeTotal += item.quantidade;
                valorTotal += item.subtotal;
            });
        });
         if (quantidadeTotal > 0) {
             relatorio.push({
                nome: categoria.nome,
                quantidade: quantidadeTotal,
                valor: valorTotal,
            });
         }
    });

    return relatorio.sort((a, b) => b.valor - a.valor);
  }

  async relatorioDeVendas(tipo: string, dataInicio?: Date, dataFim?: Date, limite?: number) {
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
          throw new AppError("Tipo de relatório inválido. Valores válidos: 'periodo', 'produto', 'categoria', 'diario'.", 400);
      }
  }
}
