// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Classe base para erros customizados da aplicação
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Se o erro for uma instância da nossa classe de erro customizada
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  // Se o erro for do Zod (validação de dados)
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Erro de validação.',
      errors: error.flatten().fieldErrors,
    });
  }

  // Para erros não esperados, loga no console e retorna um erro genérico
  console.error(error);
  return res.status(500).json({ message: 'Erro interno no servidor.' });
};
