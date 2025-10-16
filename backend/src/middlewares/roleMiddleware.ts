// src/middlewares/role.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PerfilUsuario } from '@prisma/client';

export const roleMiddleware = (perfilRequerido: PerfilUsuario) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.usuario é adicionado pelo authMiddleware
    const usuario = req.usuario;

    if (!usuario || usuario.perfil !== perfilRequerido) {
      return res.status(403).json({ 
        message: 'Acesso negado. Você não tem permissão para acessar este recurso.' 
      });
    }

    next();
  };
};
