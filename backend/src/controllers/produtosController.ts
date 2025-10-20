// mateusnriy/project-paodoceu/project-paodoceu-main/backend/src/controllers/produtosController.ts
import { Request, Response } from 'express';
import { ProdutosService } from '../services/produtosService';
import { AppError } from '../middlewares/errorMiddleware';

const produtosService = new ProdutosService();

export class ProdutosController {
  async listarTodos(req: Request, res: Response) {
    const { pagina, limite, nome } = req.query;
    const page = parseInt(pagina as string, 10) || 1;
    const limit = parseInt(limite as string, 10) || 10;
    const nomeQuery = nome as string | undefined;
    const produtosPaginados = await produtosService.listarPaginado(page, limit, nomeQuery);
    return res.status(200).json(produtosPaginados);
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
    // <<< CORREÇÃO: Mapear DEPOIS da validação (que espera camelCase) >>>
    const { quantidadeEstoque, categoriaId, imagemUrl, ...rest } = req.body;
    
    // Monta o DTO para o service (snake_case)
    const dataForService = {
        ...rest,
        estoque: quantidadeEstoque, // Mapeia quantidadeEstoque -> estoque
        categoria_id: categoriaId,  // Mapeia categoriaId -> categoria_id
        imagem_url: imagemUrl || null // Mapeia imagemUrl -> imagem_url (trata string vazia como null)
    };
    
    const novoProduto = await produtosService.criar(dataForService);
    return res.status(201).json(novoProduto);
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    // <<< CORREÇÃO: Mapear DEPOIS da validação (que espera camelCase) >>>
    const { quantidadeEstoque, categoriaId, imagemUrl, ...rest } = req.body;
    
    // Monta o DTO para o service (snake_case)
    const dataForService: any = { ...rest };
    if (quantidadeEstoque !== undefined) dataForService.estoque = quantidadeEstoque;
    if (categoriaId !== undefined) dataForService.categoria_id = categoriaId;
     // Trata null/undefined/string vazia
    dataForService.imagem_url = imagemUrl ? imagemUrl : null; 
    
    const produtoAtualizado = await produtosService.atualizar(id, dataForService);
    return res.status(200).json(produtoAtualizado);
  }

  async ajustarEstoque(req: Request, res: Response) {
    const { id } = req.params;
    const { quantidade } = req.body; // Validação já espera 'quantidade'
    const produtoAtualizado = await produtosService.ajustarEstoque(id, quantidade);
    return res.status(200).json(produtoAtualizado);
  }

  async deletar(req: Request, res: Response) {
    const { id } = req.params;
    await produtosService.deletar(id);
    return res.status(204).send();
  }
}
