// backend/src/middlewares/validateMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './errorMiddleware'; // Importar AppError para consistência, embora ZodError seja pego pelo errorMiddleware

/**
 * Middleware para validar dados da requisição (body, query, params) usando um schema Zod.
 * - Recebe um schema Zod.
 * - Tenta validar `req.body`, `req.query`, e `req.params` de forma assíncrona.
 * - Se a validação falhar, o ZodError será capturado pelo `errorMiddleware` global.
 * - Se a validação passar, chama `next()`.
 *
 * @param schema O schema Zod a ser usado para validação.
 */
export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // parseAsync valida e lança ZodError em caso de falha
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Validação bem-sucedida, prossegue para o próximo middleware/controller
      return next();
    } catch (error) {
      // Se o erro for ZodError, passa para o errorMiddleware tratar
      // Se for outro erro inesperado, também passa para o errorMiddleware
      next(error);
    }
  };
  