// mateusnriy/project-paodoceu/project-paodoceu-main/backend/src/controllers/produtosController.ts
import { Request, Response } from 'express';
import { ProdutosService } from '../services/produtosService';
import { AppError } from '../middlewares/errorMiddleware';
// <<< CORREÇÃO: Importar DTOs para tipagem >>>
import { CreateProdutoDto } from '../dtos/ICreateProdutoDTO';
import { UpdateProdutoDto } from '../dtos/IUpdateProdutoDTO';


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
    // <<< CORREÇÃO: Mapear DEPOIS da validação (Zod agora espera camelCase) >>>
    const { quantidadeEstoque, categoriaId, imagemUrl, ...rest } = req.body;

    // Monta o DTO para o service (snake_case)
    const dataForService: CreateProdutoDto = {
        ...rest,
        estoque: quantidadeEstoque, // Mapeia quantidadeEstoque -> estoque
        categoria_id: categoriaId,  // Mapeia categoriaId -> categoria_id
        imagem_url: imagemUrl || undefined // Mapeia imagemUrl -> imagem_url (trata string vazia)
    };

    const novoProduto = await produtosService.criar(dataForService);
    // O service retorna o objeto do DB (snake_case), mapeamos de volta para o frontend (camelCase)
    const { estoque, categoria_id, imagem_url, ...novoProdutoRest } = novoProduto;
    const responseProduto = {
        ...novoProdutoRest,
        quantidadeEstoque: estoque,
        categoriaId: categoria_id,
        imagemUrl: imagem_url,
        categoria: null // O service.criar não retorna a categoria inclusa, definir como null ou buscar novamente
    };
    // Idealmente, buscar o produto novamente com a categoria inclusa
    const produtoCompleto = await produtosService.obterPorId(novoProduto.id);

    return res.status(201).json(produtoCompleto ?? responseProduto); // Retorna com categoria se encontrado
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    // <<< CORREÇÃO: Mapear DEPOIS da validação (Zod agora espera camelCase) >>>
    const { quantidadeEstoque, categoriaId, imagemUrl, ...rest } = req.body;

    // Monta o DTO para o service (snake_case)
    const dataForService: UpdateProdutoDto = { ...rest };
    if (quantidadeEstoque !== undefined) dataForService.estoque = quantidadeEstoque;
    if (categoriaId !== undefined) dataForService.categoria_id = categoriaId;
    // Trata null/undefined/string vazia explicitamente para null
    dataForService.imagem_url = imagemUrl === undefined || imagemUrl === '' ? null : imagemUrl;

    const produtoAtualizado = await produtosService.atualizar(id, dataForService);
     // O service retorna o objeto do DB (snake_case), mapeamos de volta para o frontend (camelCase)
     const { estoque, categoria_id, imagem_url, ...produtoAtualizadoRest } = produtoAtualizado;
     const responseProduto = {
         ...produtoAtualizadoRest,
         quantidadeEstoque: estoque,
         categoriaId: categoria_id,
         imagemUrl: imagem_url,
         categoria: null // O service.atualizar não retorna a categoria inclusa
     };
     // Buscar novamente para incluir a categoria
     const produtoCompleto = await produtosService.obterPorId(produtoAtualizado.id);

    return res.status(200).json(produtoCompleto ?? responseProduto); // Retorna com categoria se encontrado
  }

  async ajustarEstoque(req: Request, res: Response) {
    const { id } = req.params;
    const { quantidade } = req.body;
    const produtoAtualizado = await produtosService.ajustarEstoque(id, quantidade);
     // Mapear resposta para o frontend
     const { estoque, categoria_id, imagem_url, ...produtoAtualizadoRest } = produtoAtualizado;
     const responseProduto = {
         ...produtoAtualizadoRest,
         quantidadeEstoque: estoque,
         categoriaId: categoria_id,
         imagemUrl: imagem_url,
         // Buscar categoria separadamente se necessário ou ajustar service
         categoria: null
     };
      const produtoCompleto = await produtosService.obterPorId(produtoAtualizado.id);

    return res.status(200).json(produtoCompleto ?? responseProduto);
  }

  async deletar(req: Request, res: Response) {
    const { id } = req.params;
    await produtosService.deletar(id);
    return res.status(204).send();
  }
}
