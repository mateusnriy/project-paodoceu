// mateusnriy/project-paodoceu/project-paodoceu-main/backend/src/controllers/usuariosController.ts
import { Request, Response } from 'express';
import { UsuariosService } from '../services/usuariosService';
import { AppError } from '../middlewares/errorMiddleware';

const usuariosService = new UsuariosService();

export class UsuariosController {
  async listarTodos(req: Request, res: Response) {
    // <<< CORREÇÃO: Implementar lógica de paginação >>>
    const { pagina, limite, nome } = req.query;

    // Definir padrões de paginação
    const page = parseInt(pagina as string, 10) || 1;
    const limit = parseInt(limite as string, 10) || 10;
    const nomeQuery = nome as string | undefined;

    const usuariosPaginados = await usuariosService.listarPaginado(page, limit, nomeQuery);
    return res.status(200).json(usuariosPaginados);
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
