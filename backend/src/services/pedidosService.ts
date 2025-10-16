// src/services/pedidos.service.ts
import { PrismaClient, StatusPedido, MetodoPagamento } from '@prisma/client';
import { CreatePedidoDto } from '../dtos/CreatePedidoDto';
import { ProcessarPagamentoDto } from '../dtos/ProcessarPagamentoDto';
import { startOfDay } from 'date-fns';

const prisma = new PrismaClient();

export class PedidosService {

  // RN01: Geração de número sequencial diário
  private async getProximoNumeroSequencial(): Promise<number> {
    const hoje = startOfDay(new Date());

    const ultimoPedidoDeHoje = await prisma.pedido.findFirst({
      where: {
        criado_em: {
          gte: hoje,
        },
      },
      orderBy: {
        numero_sequencial_dia: 'desc',
      },
    });

    return (ultimoPedidoDeHoje?.numero_sequencial_dia || 0) + 1;
  }

  async criar(data: CreatePedidoDto) {
    const { cliente_nome, itens } = data;

    if (!itens || itens.length === 0) {
      throw new Error('Um pedido precisa ter pelo menos um item.');
    }

    let valorTotalCalculado = 0;

    // Usando uma transação para garantir a consistência da leitura dos preços e do estoque
    return prisma.$transaction(async (tx) => {
      const itensDoPedidoData = [];

      for (const item of itens) {
        const produto = await tx.produto.findUnique({ where: { id: item.produto_id } });

        if (!produto) {
          throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
        }
        if (produto.estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para o produto: ${produto.nome}.`);
        }

        const subtotal = produto.preco * item.quantidade;
        valorTotalCalculado += subtotal;
        
        itensDoPedidoData.push({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: produto.preco,
          subtotal: subtotal,
        });
      }

      const numeroSequencial = await this.getProximoNumeroSequencial();

      const novoPedido = await tx.pedido.create({
        data: {
          numero_sequencial_dia: numeroSequencial,
          valor_total: valorTotalCalculado,
          cliente_nome,
          itens: {
            create: itensDoPedidoData,
          },
        },
        include: {
          itens: {
            include: {
              produto: true,
            },
          },
        },
      });

      return novoPedido;
    });
  }

  async processarPagamento(pedidoId: string, data: ProcessarPagamentoDto) {
    // RN13 + RN02 + RN04 - Operação atômica de pagamento e baixa de estoque
    return prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: { itens: true, pagamento: true },
      });

      if (!pedido) {
        throw new Error('Pedido não encontrado.');
      }
      if (pedido.pagamento) {
        throw new Error('Este pedido já foi pago.');
      }
      if (pedido.status === 'CANCELADO') {
        throw new Error('Este pedido está cancelado.');
      }

      let troco = 0;
      if (data.metodo === MetodoPagamento.DINHEIRO) {
        if (data.valor_pago < pedido.valor_total) {
          throw new Error('Valor pago é insuficiente para cobrir o total do pedido.');
        }
        troco = data.valor_pago - pedido.valor_total;
      }

      // Baixa de estoque
      for (const item of pedido.itens) {
        await tx.produto.update({
          where: { id: item.produto_id },
          data: {
            estoque: {
              decrement: item.quantidade,
            },
          },
        });
      }

      // Registrar o pagamento
      const pagamento = await tx.pagamento.create({
        data: {
          pedido_id: pedidoId,
          metodo: data.metodo,
          valor_pago: data.valor_pago,
          troco: troco,
        },
      });

      // Atualizar o status do pedido
      await tx.pedido.update({
        where: { id: pedidoId },
        data: { status: StatusPedido.PRONTO },
      });
      
      // Simulação da geração de comprovante (RN04)
      const pedidoCompleto = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: {
          itens: { include: { produto: { select: { nome: true } } } },
          pagamento: true,
        },
      });

      return {
        mensagem: 'Pagamento processado com sucesso!',
        comprovante: pedidoCompleto,
      };
    });
  }

  async listarTodos() {
    return prisma.pedido.findMany({
      orderBy: { criado_em: 'desc' },
      include: {
        itens: { include: { produto: { select: { nome: true } } } },
        pagamento: true,
      },
    });
  }

  async listarPedidosProntos() {
    return prisma.pedido.findMany({
      where: { status: 'PRONTO' },
      orderBy: { numero_sequencial_dia: 'asc' },
    });
  }

  async obterPorId(id: string) {
    return prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: { include: { produto: { select: { nome: true } } } },
        pagamento: true,
      },
    });
  }

  async marcarComoEntregue(id: string) {
    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado.');
    if (pedido.status !== 'PRONTO') throw new Error('Apenas pedidos prontos podem ser marcados como entregues.');

    return prisma.pedido.update({
      where: { id },
      data: { status: 'ENTREGUE' },
    });
  }

  async cancelar(id: string) {
    const pedido = await prisma.pedido.findUnique({ where: { id }, include: { pagamento: true } });
    if (!pedido) throw new Error('Pedido não encontrado.');
    if (pedido.pagamento) throw new Error('Não é possível cancelar um pedido que já foi pago.');

    return prisma.pedido.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
  }
}
