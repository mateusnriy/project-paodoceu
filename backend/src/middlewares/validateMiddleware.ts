// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

// Este middleware recebe um schema Zod e o aplica na requisição.
export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    // A validação acontece dentro de um try/catch.
    // Se a validação falhar, o Zod lança um erro que será capturado
    // pelo `express-async-errors` e processado pelo nosso `errorMiddleware`.
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  };
  