import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import {
  ItemPedido,
  MetodoPagamento,
  Pagamento,
  Pedido,
  StatusPedido,
  Prisma,
} from '@prisma/client';
import { CriarPedidoBody, ItemPedidoDto } from '../validations/pedidoValidation';
import { getSocketServer } from '../lib/socketServer';
import { logger } from '../lib/logger';
import { ProcessarPagamentoDto } from '../dtos/IProcessarPagamentoDTO';

// Definir tipo para o retorno parcial de listarDisplay
type PedidoDisplay = {
  id: string;
  numero_sequencial_dia: number;
  cliente_nome: string | null;
  status: StatusPedido;
};

export class PedidosService {
  // (CORREÇÃO) REMOVIDA A PROPRIEDADE 'private io = getSocketServer();'
  // Isso estava sendo chamado ANTES do 'initSocketServer' em 'server.ts'.

  /**
   * Emite atualizações de pedidos via WebSocket.
   */
  private async emitirAtualizacaoPedidos() {
    try {
      // (CORREÇÃO) Chamar 'getSocketServer()' AQUI, no momento do uso.
      // Neste ponto, o 'server.ts' já terá inicializado o 'io'.
      const io = getSocketServer();

      const pedidosPendentes = await this.listarPendentes();
      const pedidosProntos = await this.listarPedidosProntos();
      io.to('pdv').emit('pedidos_pendentes', pedidosPendentes);
      io.to('display').emit('pedidos_prontos', pedidosProntos);
    } catch (error) {
      logger.error('Erro ao emitir atualização de WebSockets:', error);
    }
  }

  /**
   * Obtém o próximo número sequencial do dia para um pedido. (RF10)
   */
  private async getProximoNumeroDia(): Promise<number> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Início do dia (local)

    const ultimoPedido = await prisma.pedido.findFirst({
      where: { criado_em: { gte: hoje } },
      orderBy: { numero_sequencial_dia: 'desc' },
      select: { numero_sequencial_dia: true },
    });

    return (ultimoPedido?.numero_sequencial_dia ?? 0) + 1;
  }

  async criar(
    data: CriarPedidoBody,
    atendenteId: string,
  ): Promise<Pedido & { itens: ItemPedido[] }> {
    const { cliente_nome, itens } = data;

    const idsProdutos = itens.map((item: ItemPedidoDto) => item.produto_id);
    const produtos = await prisma.produto.findMany({
      where: {
        id: { in: idsProdutos },
        ativo: true, // (RN05)
      },
    });

    const produtosMap = new Map(produtos.map((p) => [p.id, p]));

    let valorTotalPedido = new Prisma.Decimal(0);

    // O tipo 'ItemPedidoCreateWithoutPedidoInput' é o correto para 'itens: { create: [...] }'
    const itensParaCriar: Prisma.ItemPedidoCreateWithoutPedidoInput[] = [];

    const consumoEstoque = new Map<string, number>();

    for (const itemDto of itens) {
      const produto = produtosMap.get(itemDto.produto_id);

      if (!produto) {
        throw new AppError(
          `Produto com ID ${itemDto.produto_id} não encontrado ou inativo.`,
          404,
        );
      }

      const consumoAtual =
        (consumoEstoque.get(produto.id) ?? 0) + itemDto.quantidade;
      consumoEstoque.set(produto.id, consumoAtual);

      if (produto.estoque < consumoAtual) {
        throw new AppError(
          `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}, Pedido: ${consumoAtual}`,
          400,
        );
      }

      const subtotal = new Prisma.Decimal(produto.preco).times(
        itemDto.quantidade,
      );

      valorTotalPedido = valorTotalPedido.plus(subtotal);

      // (CORREÇÃO ERRO 1) O tipo 'ItemPedidoCreateWithoutPedidoInput'
      // espera a sintaxe 'produto: { connect: ... }' em vez de 'produto_id'.
      itensParaCriar.push({
        produto: {
          connect: { id: produto.id },
        },
        quantidade: itemDto.quantidade,
        preco_unitario: produto.preco,
        subtotal: subtotal,
      });
    }

    const numeroSequencial = await this.getProximoNumeroDia();

    const transactionResult = await prisma.$transaction(async (tx) => {
      const novoPedido = await tx.pedido.create({
        data: {
          numero_sequencial_dia: numeroSequencial,
          valor_total: valorTotalPedido,
          cliente_nome,
          status: StatusPedido.PENDENTE,
          atendente_id: atendenteId,
          itens: {
            create: itensParaCriar, // 'create' aceita 'ItemPedidoCreateWithoutPedidoInput[]'
          },
        },
        include: {
          itens: true, // Garante que 'itens' esteja no retorno
        },
      });

      for (const [produtoId, quantidadeConsumida] of consumoEstoque.entries()) {
        await tx.produto.update({
          where: { id: produtoId },
          data: {
            estoque: {
              decrement: quantidadeConsumida,
            },
          },
        });
      }

      return novoPedido;
    });

    this.emitirAtualizacaoPedidos();

    return transactionResult;
  }

  async processarPagamento(
    pedidoId: string,
    data: ProcessarPagamentoDto,
  ): Promise<Pagamento> {
    const { metodo, valor_pago } = data;

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404);
    }
    if (pedido.status !== StatusPedido.PENDENTE) {
      throw new AppError(
        `Pagamento não permitido para pedido com status ${pedido.status}.`,
        400,
      );
    }

    const valorPagoDecimal = new Prisma.Decimal(valor_pago);

    if (valorPagoDecimal.lt(pedido.valor_total)) {
      throw new AppError('Valor pago é menor que o total do pedido.', 400);
    }

    let trocoDecimal = new Prisma.Decimal(0);
    if (valorPagoDecimal.gt(pedido.valor_total)) {
      trocoDecimal = valorPagoDecimal.minus(pedido.valor_total);
    }

    const pagamento = await prisma.$transaction(async (tx) => {
      const novoPagamento = await tx.pagamento.create({
        data: {
          pedido_id: pedidoId,
          metodo,
          valor_pago: valorPagoDecimal,
          troco: trocoDecimal,
        },
      });

      await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          status: StatusPedido.PRONTO,
          pagamento: {
            connect: { id: novoPagamento.id },
          },
        },
      });

      return novoPagamento;
    });

    this.emitirAtualizacaoPedidos();

    return pagamento;
  }

  async listarTodos(): Promise<Pedido[]> {
    return prisma.pedido.findMany({
      orderBy: { criado_em: 'desc' },
      include: {
        atendente: { select: { nome: true } },
        itens: { include: { produto: true } },
      },
    });
  }

  async obterPorId(id: string): Promise<Pedido | null> {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        atendente: { select: { nome: true } },
        itens: { include: { produto: true } },
        pagamento: true,
      },
    });

    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404);
    }
    return pedido;
  }

  async listarPendentes(): Promise<Pedido[]> {
    return prisma.pedido.findMany({
      where: { status: StatusPedido.PENDENTE },
      orderBy: { criado_em: 'asc' },
    });
  }

  async listarPedidosProntos(): Promise<Pedido[]> {
    return prisma.pedido.findMany({
      where: { status: StatusPedido.PRONTO },
      orderBy: { atualizado_em: 'asc' },
    });
  }

  async listarDisplay(): Promise<PedidoDisplay[]> {
    return prisma.pedido.findMany({
      where: {
        status: { in: [StatusPedido.PRONTO] },
      },
      select: {
        id: true,
        numero_sequencial_dia: true,
        cliente_nome: true,
        status: true,
      },
      orderBy: { numero_sequencial_dia: 'asc' },
      take: 20,
    });
  }

  async marcarComoEntregue(pedidoId: string): Promise<Pedido> {
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404);
    }
    if (pedido.status !== StatusPedido.PRONTO) {
      throw new AppError(
        'Apenas pedidos com status "PRONTO" podem ser entregues.',
        400,
      );
    }

    const pedidoAtualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { status: StatusPedido.ENTREGUE },
    });

    this.emitirAtualizacaoPedidos();
    return pedidoAtualizado;
  }

  async cancelar(pedidoId: string): Promise<Pedido> {
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { itens: true },
    });

    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404);
    }

    if (pedido.status !== StatusPedido.PENDENTE) {
      throw new AppError(
        'Apenas pedidos "PENDENTES" podem ser cancelados.',
        400,
      );
    }

    const pedidoCancelado = await prisma.$transaction(async (tx) => {
      for (const item of pedido.itens) {
        await tx.produto.update({
          where: { id: item.produto_id },
          data: {
            estoque: {
              increment: item.quantidade,
            },
          },
        });
      }

      const pedidoAtualizado = await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: StatusPedido.CANCELADO },
      });

      return pedidoAtualizado;
    });

    this.emitirAtualizacaoPedidos();
    return pedidoCancelado;
  }
}
