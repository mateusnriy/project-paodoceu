import { Request, Response } from 'express';
import { CategoriasService } from '../services/categoriasService';
import { AppError } from '../middlewares/errorMiddleware';

const categoriasService = new CategoriasService();

export class CategoriasController {
  async listarTodas(req: Request, res: Response) {
    const categorias = await categoriasService.listarTodas();
    return res.status(200).json(categorias);
  }

  async obterPorId(req: Request, res: Response) {
    const { id } = req.params;
    const categoria = await categoriasService.obterPorId(id);

    if (!categoria) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    return res.status(200).json(categoria);
  }

  async criar(req: Request, res: Response) {
    const novaCategoria = await categoriasService.criar(req.body);
    return res.status(201).json(novaCategoria);
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const categoriaAtualizada = await categoriasService.atualizar(id, req.body);
    return res.status(200).json(categoriaAtualizada);
  }

  async deletar(req: Request, res: Response) {
    const { id } = req.params;
    await categoriasService.deletar(id);
    return res.status(204).send();
  }
}
