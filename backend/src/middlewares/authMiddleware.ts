import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorMiddleware';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AuthUsuario } from '../types/express/indexD';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token;

  if (!token) {
    throw new AppError('Token de autenticação não fornecido.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (!decoded || !decoded.id) {
      throw new AppError('Token JWT inválido ou expirado.', 401);
    }

    //Buscar o usuário no banco
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });

    if (!usuario) {
      throw new AppError('Usuário associado ao token não encontrado.', 401);
    }
    if (!usuario.ativo) {
      throw new AppError('Usuário inativo. Contate o administrador.', 403);
    }

    req.usuario = usuario;

    next();
  } catch (error) {
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(`Token inválido: ${error.message}`, 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expirado.', 401);
    }
    next(error);
  }
};
