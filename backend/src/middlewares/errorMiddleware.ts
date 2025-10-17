import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../lib/logger'; // <<< Importar o logger

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
  next: NextFunction // Embora não usado, é necessário para a assinatura do middleware de erro
) => {
  // Logar o erro com metadados da requisição
  const errorMeta = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    statusCode: (error instanceof AppError) ? error.statusCode : (error instanceof ZodError ? 400 : 500),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack, // Inclui o stack trace no log
      ...(error instanceof ZodError && { details: error.flatten().fieldErrors }), // Detalhes de validação Zod
    }
  };

  if (error instanceof AppError) {
    logger.warn('AppError handled:', errorMeta); // Logar como aviso
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof ZodError) {
    logger.warn('Zod validation error:', errorMeta); // Logar como aviso
    return res.status(400).json({
      message: 'Erro de validação.',
      errors: error.flatten().fieldErrors,
    });
  }

  // Para erros inesperados (status 500), logar como erro
  logger.error('Internal Server Error:', errorMeta); // <<< ALTERADO (era console.error)
  return res.status(500).json({ message: 'Erro interno no servidor.' });
};
