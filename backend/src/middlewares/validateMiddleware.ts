import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

// Este middleware recebe um schema Zod e o aplica na requisição.
export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  };
