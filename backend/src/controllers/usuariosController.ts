import { Request, Response } from 'express';
import { UsuariosService } from '../services/usuariosService';
import { AppError } from '../middlewares/errorMiddleware';

const usuariosService = new UsuariosService();

export class UsuariosController {
  async listarTodos(req: Request, res: Response) {
    const usuarios = await usuariosService.listarTodos();
    return res.status(200).json(usuarios);
  }

  async obterPorId(req: Request, res: Response) {
    const { id } = req.params;
    const usuario = await usuariosService.obterPorId(id);
    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404);
    }
    return res.status(200).json(usuario);
  }

  async criar(req: Request, res: Response) {
    const novoUsuario = await usuariosService.criar(req.body);
    return res.status(201).json(novoUsuario);
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const usuarioAtualizado = await usuariosService.atualizar(id, req.body);
    return res.status(200).json(usuarioAtualizado);
  }

  async deletar(req: Request, res: Response) {
    const { id } = req.params;
    await usuariosService.deletar(id);
    return res.status(204).send();
  }
}
