// backend/src/middlewares/csrfMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorMiddleware';
import { logger } from '../lib/logger';

/**
 * Middleware de proteção contra CSRF (Cross-Site Request Forgery).
 * - Verifica se métodos HTTP inseguros (POST, PUT, PATCH, DELETE) possuem
 * o header 'X-CSRF-Token' e se ele corresponde ao valor do cookie 'csrf-token'.
 * - Ignora métodos seguros (GET, HEAD, OPTIONS).
 * - Lança AppError (403 Forbidden) se a validação falhar.
 */
export const csrfMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Ignorar métodos seguros que não alteram estado
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Obter o token do header (enviado pelo frontend)
  const csrfTokenHeader = req.header('X-CSRF-Token');
  // Obter o token do cookie (definido no login/registro, não HttpOnly)
  const csrfTokenCookie = req.cookies['csrf-token'];

  // Validar a presença de ambos os tokens
  if (!csrfTokenHeader || !csrfTokenCookie) {
    logger.warn('Tentativa de requisição insegura sem token CSRF (header ou cookie ausente).', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        hasHeader: !!csrfTokenHeader,
        hasCookie: !!csrfTokenCookie
    });
    return next(new AppError('Token CSRF ausente. Requisição bloqueada.', 403));
  }

  // Validar se os tokens coincidem
  if (csrfTokenHeader !== csrfTokenCookie) {
    logger.warn('Tentativa de requisição insegura com token CSRF inválido (header e cookie não coincidem).', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        // Não logar os tokens em si por segurança
    });
    return next(new AppError('Token CSRF inválido. Requisição bloqueada.', 403));
  }

  // Tokens válidos e presentes, prosseguir com a requisição
  next();
};
