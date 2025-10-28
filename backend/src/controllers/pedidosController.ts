import { Request, Response } from 'express';
import { PedidosService } from '../services/pedidosService';
import { CreatePedidoDto } from '../dtos/ICreatePedidoDTO';
import { ProcessarPagamentoDto } from '../dtos/IProcessarPagamentoDTO';

// Instanciar o serviço (em DI seria injetado)
const pedidosService = new PedidosService();

export class PedidosController {
  
  async criar(req: Request, res: Response) {
    const createPedidoDto: CreatePedidoDto = req.body;
    const atendenteId = req.usuario.id; // Do authMiddleware

    // Correção (Erro 14): Método 'criar' existe no serviço corrigido
    const novoPedido = await pedidosService.criar(createPedidoDto, atendenteId);
    res.status(201).json(novoPedido);
  }

  async listar(req: Request, res: Response) {
    // Correção (Erro 15): Usar 'listarTodos'
    const pedidos = await pedidosService.listarTodos();
    res.status(200).json(pedidos);
  }

  async listarProntos(req: Request, res: Response) {
    // Correção (Erro 16): Usar 'listarPedidosProntos'
    const pedidos = await pedidosService.listarPedidosProntos();
    res.status(200).json(pedidos);
  }

  async obter(req: Request, res: Response) {
    const { id } = req.params;
    // Correção (Erro 17): Usar 'obterPorId'
    const pedido = await pedidosService.obterPorId(id);
    res.status(200).json(pedido);
  }

  async pagar(req: Request, res: Response) {
    const { id } = req.params;
    const pagamentoDto: ProcessarPagamentoDto = req.body;
    
    const pedidoPago = await pedidosService.processarPagamento(id, pagamentoDto);
    res.status(200).json(pedidoPago);
  }

  async entregar(req: Request, res: Response) {
    const { id } = req.params;
    const pedidoEntregue = await pedidosService.marcarComoEntregue(id);
    res.status(200).json(pedidoEntregue);
  }

  async cancelar(req: Request, res: Response) {
    const { id } = req.params;
    // Correção (Erro 18): Usar 'cancelar'
    const pedidoCancelado = await pedidosService.cancelar(id);
    res.status(200).json(pedidoCancelado);
  }
}
