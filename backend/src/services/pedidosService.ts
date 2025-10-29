import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { CreatePedidoDto } from '../dtos/ICreatePedidoDTO';
import { ProcessarPagamentoDto } from '../dtos/IProcessarPagamentoDTO';
import { Pedido, Prisma, StatusPedido, Produto } from '@prisma/client';
import { getIO } from '../lib/socketServer';
import { logger } from '../lib/logger';

interface DisplayData {
  emPreparacao: { id: string; numero_sequencial_dia: number; status: StatusPedido }[];
  prontos: { id: string; numero_sequencial_dia: number; status: StatusPedido }[];
}

export class PedidosService {

  // Função auxiliar para gerar número sequencial diário
  private async gerarNumeroSequencialDia(): Promise<number> {
    const hoje = new Date();
    const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);

    const ultimoPedidoDoDia = await prisma.pedido.findFirst({
      where: {
        criado_em: {
          gte: inicioDoDia,
          lt: fimDoDia,
        },
      },
      orderBy: {
        numero_sequencial_dia: 'desc',
      },
    });

    return (ultimoPedidoDoDia?.numero_sequencial_dia ?? 0) + 1;
  }

  async criar(data: CreatePedidoDto, atendenteId: string): Promise<Pedido> {
    const { cliente_nome, itens } = data;

    if (!itens || itens.length === 0) {
      throw new AppError('O pedido deve conter pelo menos um item.', 400);
    }

    const numeroSequencial = await this.gerarNumeroSequencialDia();
    let valorTotalPedido = 0;

    const novoPedido = await prisma.$transaction(async (tx) => {
      // Validar produtos e calcular subtotal/total dentro da transação
      const itensPedidoCreateData: Prisma.ItemPedidoCreateManyPedidoInput[] = [];
      const produtoIds = itens.map(item => item.produto_id);
      
      const produtos = await tx.produto.findMany({
        where: { id: { in: produtoIds } },
        select: { id: true, preco: true, ativo: true, nome: true }
      });
      const produtosMap = new Map(produtos.map(p => [p.id, p]));

      for (const itemDto of itens) {
        const produto = produtosMap.get(itemDto.produto_id);
        if (!produto) {
          throw new AppError(`Produto com ID ${itemDto.produto_id} não encontrado.`, 404);
        }
        if (!produto.ativo) { 
            throw new AppError(`Produto "${produto.nome}" está inativo e não pode ser adicionado ao pedido.`, 400);
        }
        if (itemDto.quantidade <= 0) {
           throw new AppError(`A quantidade para o produto "${produto.nome}" deve ser maior que zero.`, 400);
        }

        const subtotal = produto.preco * itemDto.quantidade;
        valorTotalPedido += subtotal;

        itensPedidoCreateData.push({
          produto_id: itemDto.produto_id,
          quantidade: itemDto.quantidade,
          preco_unitario: produto.preco, 
          subtotal: subtotal,
        });
      }

      const pedidoCriado = await tx.pedido.create({
        data: {
          numero_sequencial_dia: numeroSequencial,
          valor_total: valorTotalPedido,
          cliente_nome: cliente_nome,
          atendente_id: atendenteId,
          status: StatusPedido.PENDENTE,
          itens: {
            createMany: {
              data: itensPedidoCreateData,
            },
          },
        },
        include: { 
          itens: {
            include: { produto: true }
          },
          atendente: { 
            select: { id: true, nome: true }
          }
        }
      });

      return pedidoCriado;
    });

    logger.info(`Pedido #${numeroSequencial} (ID: ${novoPedido.id}) criado por Atendente ID: ${atendenteId}. Valor: ${valorTotalPedido.toFixed(2)}`);
    return novoPedido;
  }

  async listarTodos(): Promise<Pedido[]> {
    return prisma.pedido.findMany({
      orderBy: { criado_em: 'desc' },
      include: {
        itens: { include: { produto: true } },
        atendente: { select: { id: true, nome: true } }, 
        pagamento: true,
      },
    });
  }

  async listarPedidosProntos(): Promise<Pedido[]> {
    return prisma.pedido.findMany({
      where: { status: StatusPedido.PRONTO },
      orderBy: { atualizado_em: 'asc' }, 
      include: {
        itens: { include: { produto: true } },
        atendente: { select: { id: true, nome: true } },
      },
    });
  }

  async obterPorId(id: string): Promise<Pedido | null> {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: { include: { produto: true } },
        atendente: { select: { id: true, nome: true } },
        pagamento: true,
      },
    });
    return pedido;
  }

  async processarPagamento(
    id: string,
    data: ProcessarPagamentoDto,
  ): Promise<Pedido> {
    const io = getIO();

    const pedidoAtualizado = await prisma.$transaction(async (tx) => {
      const pedidoExistente = await tx.pedido.findUnique({
        where: { id },
        include: { itens: true, pagamento: true },
      });

      if (!pedidoExistente) {
        throw new AppError('Pedido não encontrado.', 404);
      }

      if (pedidoExistente.status !== StatusPedido.PENDENTE) {
        throw new AppError(
          `Apenas pedidos pendentes podem ser pagos. Status atual: ${pedidoExistente.status}`,
          400,
        );
      }

      if (pedidoExistente.pagamento) {
        throw new AppError('Este pedido já possui um pagamento registrado.', 409);
      }

      const { metodo, valor_pago } = data; 
      const valorTotalPedido = pedidoExistente.valor_total;
      let troco = 0;

      if (valor_pago < valorTotalPedido) {
        throw new AppError(
          `Valor pago (R$ ${valor_pago.toFixed(2)}) é insuficiente para o total do pedido (R$ ${valorTotalPedido.toFixed(2)}).`,
          400,
        );
      }

      if (metodo === 'DINHEIRO') {
        troco = valor_pago - valorTotalPedido;
      } else if (valor_pago > valorTotalPedido) {
         throw new AppError(`Valor pago (R$ ${valor_pago.toFixed(2)}) difere do total do pedido (R$ ${valorTotalPedido.toFixed(2)}) para o método ${metodo}.`, 400);
      }

      for (const item of pedidoExistente.itens) {
        const produto = await tx.produto.findUniqueOrThrow({
          where: { id: item.produto_id },
        }).catch(() => { throw new AppError(`Produto com ID ${item.produto_id} não encontrado durante o pagamento.`, 404); });

        const novoEstoque = produto.estoque - item.quantidade;
        if (novoEstoque < 0) {
          throw new AppError(
            `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}, Tentativa de baixa: ${item.quantidade}`,
            409,
          );
        }

        await tx.produto.update({
          where: { id: item.produto_id }, 
          data: { estoque: novoEstoque },
        });
      }

      await tx.pagamento.create({
        data: {
          pedido_id: id, 
          metodo: metodo,
          valor_pago: valor_pago,
          troco: troco,
        },
      });

      const pedidoFinalizado = await tx.pedido.update({
        where: { id },
        data: {
          status: StatusPedido.PRONTO,
          atualizado_em: new Date(),
        },
        include: {
          itens: { include: { produto: true } },
          atendente: { select: { id: true, nome: true } },
          pagamento: true,
        },
      });

      logger.info(`Pedido #${pedidoFinalizado.numero_sequencial_dia} (ID: ${id}) pago. Método: ${metodo}, Valor: ${valor_pago.toFixed(2)}, Troco: ${troco.toFixed(2)}`);
      return pedidoFinalizado;
    });

    io.emit('pedido:novo', pedidoAtualizado); 
    io.emit('pedido:display', pedidoAtualizado);

    return pedidoAtualizado;
  }

  async marcarComoEntregue(id: string): Promise<Pedido> {
    const io = getIO();

    const pedido = await prisma.pedido.findUniqueOrThrow({
      where: { id },
      select: { status: true, numero_sequencial_dia: true }
    }).catch(() => { throw new AppError('Pedido não encontrado.', 404); });


    if (pedido.status !== StatusPedido.PRONTO) {
      throw new AppError(`Apenas pedidos prontos podem ser entregues. Status atual: ${pedido.status}`, 400);
    }

    const pedidoAtualizado = await prisma.pedido.update({
      where: { id },
      data: {
        status: StatusPedido.ENTREGUE,
        atualizado_em: new Date(),
      },
    });

    io.emit('pedido:entregue', { id: pedidoAtualizado.id });

    logger.info(`Pedido #${pedido.numero_sequencial_dia} (ID: ${id}) marcado como entregue.`);
    return pedidoAtualizado;
  }

  async cancelar(id: string): Promise<Pedido> {
    const io = getIO();
    let statusOriginal: StatusPedido | null = null;

     const pedidoCancelado = await prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.findUnique({
          where: { id },
          include: { itens: true, pagamento: true }, 
        });

        if (!pedido) {
          throw new AppError('Pedido não encontrado.', 404);
        }
        statusOriginal = pedido.status; 

        if (pedido.status !== StatusPedido.PENDENTE && pedido.status !== StatusPedido.PRONTO) {
          throw new AppError(`Não é possível cancelar um pedido com status ${pedido.status}.`, 400);
        }

        if (pedido.status === StatusPedido.PRONTO) {
            logger.info(`Cancelando pedido PRONTO #${pedido.numero_sequencial_dia} (ID: ${id}). Revertendo estoque...`);
            for (const item of pedido.itens) {
              await tx.produto.update({
                where: { id: item.produto_id }, 
                data: { estoque: { increment: item.quantidade } },
              });
            }
            logger.info(`Estoque revertido para pedido #${pedido.numero_sequencial_dia}.`);
        }

        const pedidoAtualizado = await tx.pedido.update({
          where: { id },
          data: {
            status: StatusPedido.CANCELADO,
            atualizado_em: new Date(), 
          },
        });

         logger.info(`Pedido #${pedido.numero_sequencial_dia} (ID: ${id}) cancelado.`);
         return pedidoAtualizado;
     });

     if (statusOriginal === StatusPedido.PRONTO) {
        io.emit('pedido:cancelado', { id: pedidoCancelado.id });
     }

    return pedidoCancelado;
  }

  async listarParaDisplay(): Promise<DisplayData> {
    const [prontos, emPreparacao] = await Promise.all([
      prisma.pedido.findMany({
        where: { status: StatusPedido.PRONTO },
        orderBy: { atualizado_em: 'desc' },
        take: 5,
         select: {
           id: true,
           numero_sequencial_dia: true,
           status: true,
         }
      }),
      prisma.pedido.findMany({
        where: { status: StatusPedido.PENDENTE },
        orderBy: { criado_em: 'asc' },
        take: 15, 
         select: {
           id: true,
           numero_sequencial_dia: true,
           status: true,
         }
      })
    ]);

    return { prontos, emPreparacao };
  }
}
