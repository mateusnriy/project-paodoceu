// src/controllers/produtos.controller.ts
import { Request, Response } from 'express';
import { ProdutosService } from '../services/produtos.service';

const produtosService = new ProdutosService();

export class ProdutosController {
  async listarTodos(req: Request, res: Response) {
    try {
      const produtos = await produtosService.listarTodos();
      return res.status(200).json(produtos);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
  }

  async obterPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const produto = await produtosService.obterPorId(id);
      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado.' });
      }
      return res.status(200).json(produto);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const novoProduto = await produtosService.criar(req.body);
      return res.status(201).json(novoProduto);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
    
  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const produtoAtualizado = await produtosService.atualizar(id, req.body);
      return res.status(200).json(produtoAtualizado);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  async ajustarEstoque(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { quantidade } = req.body;

      if (typeof quantidade !== 'number') {
        return res.status(400).json({ message: 'O campo "quantidade" é obrigatório e deve ser um número.' });
      }

      const produtoAtualizado = await produtosService.ajustarEstoque(id, quantidade);
      return res.status(200).json(produtoAtualizado);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await produtosService.deletar(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }
}
