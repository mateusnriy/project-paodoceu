import { Request, Response } from 'express';
import { ProdutosService } from '../services/produtosService';
import { CreateProdutoDto } from '../dtos/ICreateProdutoDTO';
import { UpdateProdutoDto } from '../dtos/IUpdateProdutoDTO';

const produtosService = new ProdutosService();

export class ProdutosController {

  async listar(req: Request, res: Response) {
    const page = Number(req.query.pagina) || 1;
    const limit = Number(req.query.limite) || 10;
    const nomeQuery = req.query.termo as string | undefined;
    const produtosPaginados = await produtosService.listarPaginado(page, limit, nomeQuery);
    res.status(200).json(produtosPaginados);
  }

  async obter(req: Request, res: Response) {
    const { id } = req.params;
    const produto = await produtosService.obterPorId(id);
    res.status(200).json(produto);
  }

  async criar(req: Request, res: Response) {
    const createProdutoDto: CreateProdutoDto = req.body;
    const novoProduto = await produtosService.criar(createProdutoDto);
    const produtoCompleto = await produtosService.obterPorId(novoProduto.id);
    res.status(201).json(produtoCompleto);
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const updateProdutoDto: UpdateProdutoDto = req.body;
    const produtoAtualizado = await produtosService.atualizar(id, updateProdutoDto);
    const produtoCompleto = await produtosService.obterPorId(produtoAtualizado.id);
    res.status(200).json(produtoCompleto);
  }

  async ajustarEstoque(req: Request, res: Response) {
    const { id } = req.params;
    const { quantidade } = req.body;
    const produtoAtualizado = await produtosService.ajustarEstoque(id, quantidade);
    const produtoCompleto = await produtosService.obterPorId(produtoAtualizado.id);
    res.status(200).json(produtoCompleto);
  }

  async deletar(req: Request, res: Response) {
    const { id } = req.params;
    await produtosService.deletar(id);
    res.status(204).send();
  }
}
