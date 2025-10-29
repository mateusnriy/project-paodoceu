// backend/src/controllers/produtosController.ts
import { Request, Response } from 'express';
import { ProdutosService } from '../services/produtosService';
import { CreateProdutoDto } from '../dtos/ICreateProdutoDTO';
import { UpdateProdutoDto } from '../dtos/IUpdateProdutoDTO';
// CORREÇÃO: Importar tipos do local correto
import {
  AjustarEstoqueBody,
  ListarProdutosQuery,
} from '../validations/produtoValidation';

export class ProdutosController {
  private produtosService: ProdutosService;

  /**
   * (CORREÇÃO) Aceitar o serviço via injeção de dependência
   */
  constructor(produtosService: ProdutosService) {
    this.produtosService = produtosService;
  }

  /**
   * Handler para listar paginado (Admin)
   */
  listarPaginado = async (req: Request, res: Response) => {
    // Validado pelo Zod (listarProdutosSchema)
    const { pagina, limite, nome } =
      req.query as unknown as ListarProdutosQuery;

    const resultado = await this.produtosService.listarPaginado(
      pagina || 1, // Garantir valores padrão
      limite || 10,
      nome,
    );
    res.status(200).json(resultado);
  };

  /**
   * Handler para listar ativos (PDV)
   */
  listarTodosAtivos = async (req: Request, res: Response) => {
    const produtos = await this.produtosService.listarTodosAtivos();
    res.status(200).json(produtos);
  };

  /**
   * Handler para obter por ID (Admin)
   */
  obterPorId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const produto = await this.produtosService.obterPorId(id);
    res.status(200).json(produto);
  };

  criar = async (req: Request, res: Response) => {
    const data = req.body as CreateProdutoDto;
    const produto = await this.produtosService.criar(data);
    res.status(201).json(produto);
  };

  atualizar = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateProdutoDto;
    const produto = await this.produtosService.atualizar(id, data);
    res.status(200).json(produto);
  };

  /**
   * Handler para ajuste rápido de estoque
   */
  ajustarEstoque = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantidade } = req.body as AjustarEstoqueBody;
    const produto = await this.produtosService.ajustarEstoque(id, quantidade);
    res.status(200).json(produto);
  };

  deletar = async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.produtosService.deletar(id);
    res.status(204).send(); // 204 No Content
  };
}
