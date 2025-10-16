// src/controllers/usuarios.controller.ts
import { Request, Response } from 'express';
import { UsuariosService } from '../services/usuarios.service';

const usuariosService = new UsuariosService();

export class UsuariosController {
  async listarTodos(req: Request, res: Response) {
    try {
      const usuarios = await usuariosService.listarTodos();
      return res.status(200).json(usuarios);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async obterPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuario = await usuariosService.obterPorId(id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      return res.status(200).json(usuario);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const novoUsuario = await usuariosService.criar(req.body);
      return res.status(201).json(novoUsuario);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
    
  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuarioAtualizado = await usuariosService.atualizar(id, req.body);
      return res.status(200).json(usuarioAtualizado);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await usuariosService.deletar(id);
      return res.status(204).send(); // 204 No Content
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }
}
