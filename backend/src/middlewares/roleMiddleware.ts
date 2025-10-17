import { Request, Response, NextFunction } from 'express';
import { PerfilUsuario } from '@prisma/client';

export const roleMiddleware = (perfisRequeridos: PerfilUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = req.usuario;

    if (!usuario || !perfisRequeridos.includes(usuario.perfil)) {
      return res.status(403).json({
        message: 'Acesso negado.'
      });
    }
    next();
  };
};
