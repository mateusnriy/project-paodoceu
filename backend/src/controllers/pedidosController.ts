// src/controllers/pedidos.controller.ts
import { Request, Response } from 'express';
import { PedidosService } from '../services/pedidosService';

const pedidosService = new PedidosService();

export class PedidosController {
  async criar(req: Request, res: Response) {
    try {
      const atendenteId = req.usuario?.id;
      if (!atendenteId) {
        return res.status(401).json({ message: 'Atendente não identificado.' });
      }

      const novoPedido = await pedidosService.criar(req.body, atendenteId);
      return res.status(201).json(novoPedido);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async listarTodos(req: Request, res: Response) {
    try {
      const pedidos = await pedidosService.listarTodos();
      return res.status(200).json(pedidos);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
  
  async listarPedidosProntos(req: Request, res: Response) {
    try {
      const pedidos = await pedidosService.listarPedidosProntos();
      return res.status(200).json(pedidos);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async obterPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pedido = await pedidosService.obterPorId(id);
      if (!pedido) {
        return res.status(404).json({ message: 'Pedido não encontrado.' });
      }
      return res.status(200).json(pedido);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async processarPagamento(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const comprovante = await pedidosService.processarPagamento(id, req.body);
      return res.status(200).json(comprovante);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async marcarComoEntregue(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pedidoAtualizado = await pedidosService.marcarComoEntregue(id);
      return res.status(200).json(pedidoAtualizado);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  async cancelar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pedidoCancelado = await pedidosService.cancelar(id);
      return res.status(200).json(pedidoCancelado);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }
}
