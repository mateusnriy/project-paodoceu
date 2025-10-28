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
    
    // Correção (Erro 19): Usar 'listarPaginado'
    const produtosPaginados = await produtosService.listarPaginado(page, limit, nomeQuery);
    res.status(200).json(produtosPaginados);
  }

  async obter(req: Request, res: Response) {
    const { id } = req.params;
    // Correção (Erro 20): Usar 'obterPorId'
    const produto = await produtosService.obterPorId(id);
    res.status(200).json(produto);
  }

  async criar(req: Request, res: Response) {
    // (O Zod já deve ter validado para camelCase 'categoriaId')
    const createProdutoDto: CreateProdutoDto = req.body;
    
    // (Assumindo que o Zod em produtoValidation.ts foi corrigido
    // para esperar 'categoriaId' e não 'categoria_id')
    
    const novoProduto = await produtosService.criar(createProdutoDto);
    
    // Correção (Erro 21): Usar 'obterPorId'
    const produtoCompleto = await produtosService.obterPorId(novoProduto.id);
    res.status(201).json(produtoCompleto);
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    // Correção (Erro 22, 23): DTO deve ser 'categoriaId'
    // O 'imagem_url' não existe no DTO ou Schema, será ignorado.
    const updateProdutoDto: UpdateProdutoDto = req.body;

    const produtoAtualizado = await produtosService.atualizar(id, updateProdutoDto);
    
    // Correção (Erro 24): Usar 'obterPorId'
    const produtoCompleto = await produtosService.obterPorId(produtoAtualizado.id);
    res.status(200).json(produtoCompleto);
  }

  async ajustarEstoque(req: Request, res: Response) {
    const { id } = req.params;
    const { quantidade } = req.body; // (Validado pelo Zod)

    // Correção (Erro 25): Usar 'ajustarEstoque'
    const produtoAtualizado = await produtosService.ajustarEstoque(id, quantidade);
    
    // Correção (Erro 26): Usar 'obterPorId'
    const produtoCompleto = await produtosService.obterPorId(produtoAtualizado.id);
    res.status(200).json(produtoCompleto);
  }

  async deletar(req: Request, res: Response) {
    const { id } = req.params;
    // Correção (Erro 27): Usar 'deletar'
    await produtosService.deletar(id);
    res.status(204).send();
  }
}
