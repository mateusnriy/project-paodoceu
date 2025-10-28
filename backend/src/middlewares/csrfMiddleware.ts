import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorMiddleware';

/**
 * Middleware de proteção CSRF (Double Submit Cookie Pattern).
 * Conforme RNF06 e CHANGE-SEG-02.
 *
 * O frontend deve ler o cookie 'csrf-token' (não-HttpOnly)
 * e enviá-lo de volta no header 'X-CSRF-Token'.
 */
export const csrfMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Pular verificação para métodos seguros (leitura)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfTokenHeader = req.header('X-CSRF-Token');
  const csrfTokenCookie = req.cookies['csrf-token'];

  if (!csrfTokenHeader || !csrfTokenCookie) {
    throw new AppError(
      'Token CSRF ausente. Requisição bloqueada.',
      403, // 403 Forbidden
    );
  }

  if (csrfTokenHeader !== csrfTokenCookie) {
    throw new AppError(
      'Token CSRF inválido. Requisição bloqueada.',
      403,
    );
  }

  next();
};

