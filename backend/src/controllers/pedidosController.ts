import { Request, Response } from 'express';
import { PedidosService } from '../services/pedidosService';
import { CreatePedidoDto } from '../dtos/ICreatePedidoDTO';
import { ProcessarPagamentoDto } from '../dtos/IProcessarPagamentoDTO';
import { AppError } from '../middlewares/errorMiddleware';

// Instanciar o serviço (em DI seria injetado)
const pedidosService = new PedidosService();

export class PedidosController {

  async criar(req: Request, res: Response) {
    const createPedidoDto: CreatePedidoDto = req.body;
    // Assumindo que req.usuario é adicionado pelo authMiddleware
    if (!req.usuario) {
        throw new AppError('Usuário não autenticado.', 401);
    }
    const atendenteId = req.usuario.id;
    const novoPedido = await pedidosService.criar(createPedidoDto, atendenteId);
    res.status(201).json(novoPedido);
  }

  async listarTodos(req: Request, res: Response) {
    const pedidos = await pedidosService.listarTodos();
    res.status(200).json(pedidos);
  }

  async listarPedidosProntos(req: Request, res: Response) {
    const pedidos = await pedidosService.listarPedidosProntos();
    res.status(200).json(pedidos);
  }

  async obterPorId(req: Request, res: Response) {
    const { id } = req.params;
    const pedido = await pedidosService.obterPorId(id);
    // Adicionar verificação se não encontrado
    if (!pedido) {
      throw new AppError('Pedido não encontrado.', 404);
    }
    res.status(200).json(pedido);
  }

  async processarPagamento(req: Request, res: Response) {
    const { id } = req.params;
    // Garantir que o DTO correto seja usado (o schema valida 'metodo' e 'valor_pago')
    const pagamentoDto = req.body as ProcessarPagamentoDto;
    const pedidoPago = await pedidosService.processarPagamento(id, pagamentoDto);
    res.status(200).json(pedidoPago);
  }

  async marcarComoEntregue(req: Request, res: Response) {
    const { id } = req.params;
    const pedidoEntregue = await pedidosService.marcarComoEntregue(id);
    res.status(200).json(pedidoEntregue);
  }

  async cancelar(req: Request, res: Response) {
    const { id } = req.params;
    const pedidoCancelado = await pedidosService.cancelar(id);
    res.status(200).json(pedidoCancelado);
  }

  // NOVO MÉTODO PARA O DISPLAY
  async listarDisplay(req: Request, res: Response) {
    const displayData = await pedidosService.listarParaDisplay();
    res.status(200).json(displayData);
  }
}
