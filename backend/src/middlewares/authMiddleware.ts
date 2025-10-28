import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorMiddleware';
import { prisma } from '../lib/prisma';

interface JwtPayload {
  id: string;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1. Ler o token do cookie (CHANGE-SEG-01)
  const { token } = req.cookies;

  if (!token) {
    throw new AppError('Token de autenticação não fornecido.', 401);
  }

  try {
    // 2. Verificar o token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // 3. Verificar se o usuário existe no banco
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, // ID é necessário para controle granular (RF23)
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });

    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 401);
    }

    if (!usuario.ativo) {
      throw new AppError('Usuário inativo.', 401);
    }

    // 4. Anexar usuário ao objeto Request
    req.usuario = usuario;
    next();
  } catch (error) {
    // Limpar cookie inválido
    res.cookie('token', '', {
      httpOnly: true,
      secure: env.NODE_ENV !== 'development',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Token inválido.', 401);
    }
    
    // Propagar outros erros (ex: AppError de usuário inativo/não encontrado)
    throw error;
  }
};
