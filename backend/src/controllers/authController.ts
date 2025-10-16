// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      }

      const { token, usuario } = await authService.login(email, senha);
      return res.status(200).json({ token, usuario });
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  async registrar(req: Request, res: Response) {
    try {
      const novoUsuario = await authService.registrar(req.body);
      // Omitir a senha da resposta
      const { senha, ...usuarioSemSenha } = novoUsuario;
      return res.status(201).json(usuarioSemSenha);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
