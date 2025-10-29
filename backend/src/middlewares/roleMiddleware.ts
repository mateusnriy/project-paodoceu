import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorMiddleware';
import { PerfilUsuario } from '@prisma/client';

export const roleMiddleware = (perfisRequeridos: PerfilUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = req.usuario;

    if (!usuario || !perfisRequeridos.includes(usuario.perfil)) {
      throw new AppError(
        'Acesso negado. Você não tem permissão para este recurso.',
        403,
      );
    }
    next();
  };
};
