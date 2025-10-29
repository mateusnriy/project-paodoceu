import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorMiddleware';

export const csrfMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {

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
