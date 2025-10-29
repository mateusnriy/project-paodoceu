// backend/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AppError } from './errorMiddleware';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AuthUsuario } from '../types/express'; // Importar tipo local
import { logger } from '../lib/logger';

/**
 * Middleware para verificar a autenticação do usuário via Cookie JWT HttpOnly.
 * - Extrai o token do cookie 'token'.
 * - Verifica a validade e expiração do token usando JWT_SECRET.
 * - Busca o usuário correspondente no banco de dados.
 * - Verifica se o usuário está ativo.
 * - Anexa os dados do usuário (sem senha) ao objeto `req.usuario`.
 * - Lança AppError (401 ou 403) em caso de falha.
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // 1. Extrair token do cookie HttpOnly 'token'
  const token = req.cookies.token;

  if (!token) {
    logger.warn('Tentativa de acesso sem token de autenticação.', { path: req.path });
    return next(new AppError('Token de autenticação não fornecido.', 401));
  }

  try {
    // 2. Verificar token JWT
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Verificar se o payload decodificado contém o ID do usuário
    if (!decoded || typeof decoded !== 'object' || !decoded.id) {
      logger.warn('Token JWT inválido ou malformado recebido.');
      clearAuthCookies(res); // Limpa cookies inválidos
      return next(new AppError('Token inválido.', 401));
    }

    // 3. Buscar usuário no banco de dados
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      // Selecionar apenas os campos necessários para `AuthUsuario`
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
      },
    });

    // 4. Validar se usuário existe
    if (!usuario) {
      logger.warn(`Usuário não encontrado para o token ID: ${decoded.id}`);
      clearAuthCookies(res); // Limpa cookies de usuário inexistente
      return next(new AppError('Usuário não encontrado.', 401));
    }

    // 5. Validar se usuário está ativo (RF01 exige usuário ativo)
    if (!usuario.ativo) {
      logger.warn(`Tentativa de acesso por usuário inativo: ${usuario.email}`);
      clearAuthCookies(res); // Limpa cookies de usuário inativo
      return next(new AppError('Usuário inativo. Contate o administrador.', 403)); // 403 Forbidden
    }

    // 6. Anexar dados do usuário à requisição
    req.usuario = usuario as AuthUsuario; // Garante a tipagem correta

    // 7. Passar para o próximo middleware/rota
    next();

  } catch (error) {
    // Tratamento específico para erros do JWT
    if (error instanceof jwt.TokenExpiredError) {
      logger.info('Token JWT expirado.'); // Log informativo, não necessariamente um erro grave
      clearAuthCookies(res); // Limpa o cookie expirado
      return next(new AppError('Sessão expirada. Faça login novamente.', 401));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`Erro na verificação do token JWT: ${error.message}`);
      clearAuthCookies(res); // Limpa o cookie inválido
      return next(new AppError('Token inválido.', 401));
    }

    // Para outros erros inesperados, passa para o errorMiddleware global
    logger.error('Erro inesperado no authMiddleware:', error);
    next(error);
  }
};

// Função auxiliar para limpar cookies de autenticação
const clearAuthCookies = (res: Response) => {
   // Define opções para expirar o cookie imediatamente
   const expiryOptions = {
     httpOnly: true,
     secure: env.NODE_ENV !== 'development',
     sameSite: 'strict' as const,
     path: '/',
     expires: new Date(0), // Data no passado expira o cookie
   };
   res.cookie('token', '', expiryOptions);
   res.cookie('csrf-token', '', {...expiryOptions, httpOnly: false }); // CSRF não é HttpOnly
};
