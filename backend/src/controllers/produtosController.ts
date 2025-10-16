import { Request, Response } from 'express';
import { ProdutosService } from '../services/produtosService';
import { AppError } from '../middlewares/errorMiddleware';

const produtosService = new ProdutosService();

export class ProdutosController {
  async listarTodos(req: Request, res: Response) {
    const produtos = await produtosService.listarTodos();
    return res.status(200).json(produtos);
  }

  async obterPorId(req: Request, res: Response) {
    const { id } = req.params;
    const produto = await produtosService.obterPorId(id);

    if (!produto) {
      throw new AppError('Produto não encontrado.', 404);
    }

    return res.status(200).json(produto);
  }

  async criar(req: Request, res: Response) {
    const novoProduto = await produtosService.criar(req.body);
    return res.status(201).json(novoProduto);
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const produtoAtualizado = await produtosService.atualizar(id, req.body);
    return res.status(200).json(produtoAtualizado);
  }

  async ajustarEstoque(req: Request, res: Response) {
    const { id } = req.params;
    const { quantidade } = req.body;

    const produtoAtualizado = await produtosService.ajustarEstoque(id, quantidade);
    return res.status(200).json(produtoAtualizado);
  }

  async deletar(req: Request, res: Response) {
    const { id } = req.params;
    await produtosService.deletar(id);
    return res.status(204).send();
  }
}
