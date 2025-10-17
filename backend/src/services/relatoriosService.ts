import { PrismaClient, Pedido, ItemPedido, Produto, Categoria } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

export class RelatoriosService {

  private getDateRange(dataInicio?: Date, dataFim?: Date) {
    const inicio = dataInicio ? startOfDay(dataInicio) : undefined;
    const fim = dataFim ? endOfDay(dataFim) : undefined;
    return { gte: inicio, lte: fim };
  }
  
  // Relatório de vendas geral por período
  async vendasPorPeriodo(dataInicio?: Date, dataFim?: Date) {
    const range = this.getDateRange(dataInicio, dataFim);

    const pedidosPagos = await prisma.pedido.findMany({
      where: {
        pagamento: { isNot: null },
        criado_em: range,
      },
      include: {
        pagamento: true,
      }
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
      detalhes: pedidosPagos,
    };
  }

  // Relatório de vendas agrupado por produto
  async vendasPorProduto(dataInicio?: Date, dataFim?: Date) {
    const range = this.getDateRange(dataInicio, dataFim);
    
    const itensVendidos = await prisma.itemPedido.findMany({
      where: {
        pedido: {
          pagamento: { isNot: null },
          criado_em: range,
        }
      },
      include: {
        produto: { select: { nome: true } }
      }
    });

    // Define um tipo para o acumulador do reduce
    type RelatorioProduto = Record<string, { quantidade: number, valor: number }>;
    // Define um tipo para o item do reduce
    type ItemComNomeProduto = ItemPedido & { produto: { nome: string } };

    const relatorio = itensVendidos.reduce((acc: RelatorioProduto, item: ItemComNomeProduto) => {
      if (!acc[item.produto.nome]) {
        acc[item.produto.nome] = { quantidade: 0, valor: 0 };
      }
      acc[item.produto.nome].quantidade += item.quantidade;
      acc[item.produto.nome].valor += item.subtotal;
      return acc;
    }, {} as RelatorioProduto);
    
    return relatorio;
  }
  
  // Relatório de vendas agrupado por categoria
  async vendasPorCategoria(dataInicio?: Date, dataFim?: Date) {
    const range = this.getDateRange(dataInicio, dataFim);

    const itensVendidos = await prisma.itemPedido.findMany({
        where: {
            pedido: {
                pagamento: { isNot: null },
                criado_em: range,
            }
        },
        include: {
            produto: { include: { categoria: true } }
        }
    });

    // Define um tipo para o acumulador do reduce
    type RelatorioCategoria = Record<string, { quantidade: number, valor: number }>;
    // Define um tipo para o item do reduce
    type ItemComProdutoCategoria = ItemPedido & { produto: Produto & { categoria: Categoria } };

    const relatorio = itensVendidos.reduce((acc: RelatorioCategoria, item: ItemComProdutoCategoria) => {
        const nomeCategoria = item.produto.categoria.nome;
        if (!acc[nomeCategoria]) {
            acc[nomeCategoria] = { quantidade: 0, valor: 0 };
        }
        acc[nomeCategoria].quantidade += item.quantidade;
        acc[nomeCategoria].valor += item.subtotal;
        return acc;
    }, {} as RelatorioCategoria);

    return relatorio;
  }
}
