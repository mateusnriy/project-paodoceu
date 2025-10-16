import { Request, Response } from 'express';
import { PedidosService } from '../services/pedidosService';
import { AppError } from '../middlewares/errorMiddleware';

const pedidosService = new PedidosService();

export class PedidosController {
  async criar(req: Request, res: Response) {
    const atendenteId = req.usuario?.id;
    if (!atendenteId) {
      throw new AppError('Atendente não identificado.', 401);
    }

    const novoPedido = await pedidosService.criar(req.body, atendenteId);
    return res.status(201).json(novoPedido);
  }

  async listarTodos(req: Request, res: Response) {
    const pedidos = await pedidosService.listarTodos();
    return res.status(200).json(pedidos);
  }

  async listarPedidosProntos(req: Request, res: Response) {
    const pedidos = await pedidosService.listarPedidosProntos();
    return res.status(200).json(pedidos);
  }

  async obterPorId(req: Request, res: Response) {
    const { id } = req.params;
    const pedido = await pedidosService.obterPorId(id);

    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404);
    }

    return res.status(200).json(pedido);
  }

  async processarPagamento(req: Request, res: Response) {
    const { id } = req.params;
    const comprovante = await pedidosService.processarPagamento(id, req.body);
    return res.status(200).json(comprovante);
  }

  async marcarComoEntregue(req: Request, res: Response) {
    const { id } = req.params;
    const pedidoAtualizado = await pedidosService.marcarComoEntregue(id);
    return res.status(200).json(pedidoAtualizado);
  }

  async cancelar(req: Request, res: Response) {
    const { id } = req.params;
    const pedidoCancelado = await pedidosService.cancelar(id);
    return res.status(200).json(pedidoCancelado);
  }
}
