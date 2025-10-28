import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
// AppError não é mais necessário aqui, pois os erros são tratados pelo middleware global

const authService = new AuthService();

export class AuthController {
 
  async checkFirst(req: Request, res: Response, next: NextFunction) {
    // Chama o serviço para verificar
    const isFirst = await authService.checkFirstUser();
    // Retorna a resposta em JSON
    return res.status(200).json({ isFirst });
  }

  async login(req: Request, res: Response, next: NextFunction) {
    // Os dados (email, senha) já foram validados pelo middleware 'validate'
    const { email, senha } = req.body;

    // Chama o serviço de login
    const result = await authService.login(email, senha);

    // Retorna o token e os dados do usuário
    return res.status(200).json(result);
  }

  async registrar(req: Request, res: Response, next: NextFunction) {
    // Os dados (nome, email, senha) já foram validados pelo middleware 'validate'
    // O DTO esperado pelo serviço (CreateUsuarioDto) corresponde ao req.body validado

    // Chama o serviço de registro
    const result = await authService.registrar(req.body);

    // Retorna o token e os dados do novo usuário (sem senha)
    return res.status(201).json(result);
  }
}
