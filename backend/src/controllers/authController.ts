import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const { token, usuario } = await authService.login(email, senha);
    return res.status(200).json({ token, usuario });
  }

  async registrar(req: Request, res: Response, next: NextFunction) {
    const novoUsuario = await authService.registrar(req.body);
    // Omitir a senha da resposta
    const { senha, ...usuarioSemSenha } = novoUsuario;
    return res.status(201).json(usuarioSemSenha);
  }
}
