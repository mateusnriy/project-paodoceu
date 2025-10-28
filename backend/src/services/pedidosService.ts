import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { CreatePedidoDto } from '../dtos/ICreatePedidoDTO';
import { ProcessarPagamentoDto } from '../dtos/IProcessarPagamentoDTO';
import { Pedido, StatusPedido } from '@prisma/client';
import { getIO } from '../lib/socketServer'; // <--- IMPORTAR

export class PedidosService {
  // ... (criar, listar, obterPorId - sem alteração)

  async processarPagamento(
    id: string,
    data: ProcessarPagamentoDto,
  ): Promise<Pedido> {
    const io = getIO(); // <--- OBTER INSTÂNCIA DO SOCKET

    const pedido = await prisma.$transaction(async (tx) => {
      const pedidoExistente = await tx.pedido.findUnique({
        where: { id },
        include: { itens: true },
      });

      if (!pedidoExistente) {
        throw new AppError('Pedido não encontrado.', 404);
      }

      if (pedidoExistente.status !== StatusPedido.PENDENTE) {
        throw new AppError(
          'Apenas pedidos pendentes podem ser pagos.',
          400,
        );
      }

      // 1. Atualizar estoque (RN01, RF13)
      for (const item of pedidoExistente.itens) {
        const produto = await tx.produto.findUnique({
          where: { id: item.produtoId },
        });

        if (!produto) {
          throw new AppError(`Produto ${item.produtoId} não encontrado.`, 404);
        }

        const novoEstoque = produto.estoque - item.quantidade;
        if (novoEstoque < 0) {
          throw new AppError(
            `Estoque insuficiente para ${produto.nome}.`,
            400,
          );
        }

        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: novoEstoque },
        });
      }

      // 2. Atualizar status do pedido
      const pedidoAtualizado = await tx.pedido.update({
        where: { id },
        data: {
          status: StatusPedido.PRONTO,
          tipoPagamento: data.tipoPagamento,
          atualizadoEm: new Date(),
        },
        include: {
          itens: { include: { produto: true } },
          usuario: { select: { id: true, nome: true } },
        },
      });

      return pedidoAtualizado;
    });

    // 3. Emitir eventos Socket.IO (após a transação)
    io.emit('pedido:novo', pedido); // Para a tela /fila (Orders.tsx)
    io.emit('pedido:display', pedido); // Para a tela /display (CustomerDisplay.tsx)

    return pedido;
  }

  async marcarComoEntregue(id: string): Promise<Pedido> {
    const io = getIO(); // <--- OBTER INSTÂNCIA DO SOCKET

    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404);
    }
    if (pedido.status !== StatusPedido.PRONTO) {
      throw new AppError('Apenas pedidos prontos podem ser entregues.', 400);
    }

    const pedidoAtualizado = await prisma.pedido.update({
      where: { id },
      data: {
        status: StatusPedido.ENTREGUE,
        atualizadoEm: new Date(),
      },
    });

    // Emitir evento de remoção
    io.emit('pedido:entregue', { id: pedidoAtualizado.id }); // Para a tela /fila

    return pedidoAtualizado;
  }

  // ... (cancelarPedido, listarProntos, listarDisplay - sem alteração)
}
