// src/controllers/categorias.controller.ts
import { Request, Response } from 'express';
import { CategoriasService } from '../services/categoriasService';

const categoriasService = new CategoriasService();

export class CategoriasController {
  async listarTodas(req: Request, res: Response) {
    try {
      const categorias = await categoriasService.listarTodas();
      return res.status(200).json(categorias);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
  }

  async obterPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const categoria = await categoriasService.obterPorId(id);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoria não encontrada.' });
      }
      return res.status(200).json(categoria);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const novaCategoria = await categoriasService.criar(req.body);
      return res.status(201).json(novaCategoria);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const categoriaAtualizada = await categoriasService.atualizar(id, req.body);
      return res.status(200).json(categoriaAtualizada);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await categoriasService.deletar(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }
}
