// backend/src/middlewares/roleMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorMiddleware';
import { PerfilUsuario } from '@prisma/client';
import { logger } from '../lib/logger'; // Importar logger

/**
 * Middleware para verificar se o usuário autenticado possui um dos perfis requeridos.
 * - Assume que o `authMiddleware` já foi executado e `req.usuario` existe.
 * - Recebe um array de `PerfilUsuario` permitidos.
 * - Lança AppError (403 Forbidden) se o usuário não tiver o perfil necessário.
 *
 * @param perfisRequeridos Array com os perfis de usuário permitidos para acessar a rota.
 */
export const roleMiddleware = (perfisRequeridos: PerfilUsuario[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Garante que o authMiddleware foi executado
    const usuario = req.usuario;
    if (!usuario) {
       // Log de erro crítico, pois o authMiddleware deveria ter barrado antes
       logger.error('Erro crítico: roleMiddleware executado sem req.usuario definido.');
       return next(new AppError('Erro interno de autenticação.', 500));
    }

    // Verifica se o perfil do usuário está na lista de perfis requeridos
    if (!perfisRequeridos.includes(usuario.perfil)) {
      // Log de tentativa de acesso não autorizado
      logger.warn(`Acesso negado para usuário ${usuario.email} (Perfil: ${usuario.perfil}) à rota ${req.method} ${req.path}. Perfis requeridos: ${perfisRequeridos.join(', ')}`);
      return next(new AppError(
        'Acesso negado. Você não tem permissão para este recurso.',
        403, // 403 Forbidden
      ));
    }

    // Usuário tem permissão, prosseguir
    next();
  };
};
