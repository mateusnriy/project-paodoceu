import { Request, Response } from 'express';
import { PedidosService } from '../services/pedidosService';
import { AppError } from '../middlewares/errorMiddleware';
import { AuthUsuario } from '../types/express';
import { StatusPedido } from '@prisma/client';
import { CriarPedidoBody } from '../validations/pedidoValidation';
import { ProcessarPagamentoDto } from '../dtos/IProcessarPagamentoDTO';

// Injeção de dependência (o serviço é instanciado na ROTA)
export class PedidosController {
  private pedidosService: PedidosService;

  constructor(pedidosService: PedidosService) {
    this.pedidosService = pedidosService;
  }

  // --- Métodos de handler (arrow functions para manter o 'this') ---

  listarTodos = async (req: Request, res: Response) => {
    // (CORREÇÃO ERRO 1) 'listarTodos' agora existe no service
    const pedidos = await this.pedidosService.listarTodos();
    res.status(200).json(pedidos);
  };

  listarPedidosProntos = async (req: Request, res: Response) => {
    const pedidos = await this.pedidosService.listarPedidosProntos();
    res.status(200).json(pedidos);
  };

  obterPorId = async (req: Request, res: Response) => {
    const { id } = req.params;
    // (CORREÇÃO ERRO 2) 'obterPorId' agora existe no service
    const pedido = await this.pedidosService.obterPorId(id);
    res.status(200).json(pedido);
  };

  criar = async (req: Request, res: Response) => {
    const dadosPedido = req.body as CriarPedidoBody;
    const atendente = req.usuario as AuthUsuario; // Vem do authMiddleware

    const novoPedido = await this.pedidosService.criar(
      dadosPedido,
      atendente.id,
    );
    res.status(201).json(novoPedido);
  };

  processarPagamento = async (req: Request, res: Response) => {
    const { id } = req.params;
    const dadosPagamento = req.body as ProcessarPagamentoDto;

    const pagamento = await this.pedidosService.processarPagamento(
      id,
      dadosPagamento,
    );
    res.status(201).json(pagamento);
  };

  listarDisplay = async (req: Request, res: Response) => {
    // (CORREÇÃO ERRO 3) Corrigir nome do método
    const displayData = await this.pedidosService.listarDisplay();
    res.status(200).json(displayData);
  };

  marcarComoEntregue = async (req: Request, res: Response) => {
    const { id } = req.params;
    const pedido = await this.pedidosService.marcarComoEntregue(id);
    res.status(200).json(pedido);
  };

  cancelar = async (req: Request, res: Response) => {
    const { id } = req.params;
    const pedido = await this.pedidosService.cancelar(id);
    res.status(200).json(pedido);
  };
}
