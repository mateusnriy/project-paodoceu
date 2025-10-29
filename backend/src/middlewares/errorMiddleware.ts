// backend/src/middlewares/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { env } from '../config/env';

// Classe de erro customizada para erros da aplicação
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    // Garante que o nome do erro seja 'AppError'
    this.name = 'AppError';
    // Mantém o stack trace correto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// Middleware de tratamento de erros global
export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction // next é necessário para a assinatura do middleware de erro do Express
) => {
  let statusCode = 500;
  let responseBody: { message: string; errors?: any } = {
    message: 'Erro interno no servidor.',
  };

  // Coleta metadados para logging
  const errorMeta = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    errorName: error.name,
    errorMessage: error.message,
    // Incluir stack trace apenas em desenvolvimento ou debug para não expor detalhes em produção
    ...(env.NODE_ENV !== 'production' || env.LOG_LEVEL === 'debug') && { stack: error.stack },
  };

  // Tratamento específico para AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    responseBody.message = error.message;
    logger.warn('AppError Tratado:', { ...errorMeta, statusCode }); // Log como aviso
  }
  // Tratamento específico para ZodError (erros de validação)
  else if (error instanceof ZodError) {
    statusCode = 400; // Bad Request
    responseBody.message = 'Erro de validação.';
    // Formata os erros de validação do Zod para uma melhor resposta
    responseBody.errors = error.flatten().fieldErrors;
    logger.warn('Erro de Validação Zod:', { ...errorMeta, statusCode, details: responseBody.errors }); // Log como aviso
  }
  // Tratamento para outros erros (inesperados)
  else {
    logger.error('Erro Interno Não Tratado:', { ...errorMeta, statusCode }); // Log como erro grave
    // Em produção, não expor detalhes do erro interno
    if (env.NODE_ENV === 'production') {
      responseBody.message = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
    } else {
        // Em desenvolvimento, pode incluir a mensagem original para facilitar debug
        responseBody.message = error.message || responseBody.message;
    }
  }

  // Envia a resposta de erro
  return res.status(statusCode).json(responseBody);
};
