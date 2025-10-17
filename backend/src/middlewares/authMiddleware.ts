import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
  id: string;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const [, token] = authorization.split(' ');

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('Chave secreta JWT não configurada.');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.id } });

    if (!usuario) {
      return res.status(401).json({ message: 'Token inválido.' });
    }

    const { senha, ...usuarioLogado } = usuario;

    req.usuario = usuarioLogado;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};
