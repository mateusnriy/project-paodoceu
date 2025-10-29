import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginDto, RegistrarDto } from '../validations/authValidation';
import { env } from '../config/env';
import crypto from 'crypto';

const COOKIE_AUTH_NAME = 'token';
const COOKIE_CSRF_NAME = 'csrf-token';

const cookieOptions = (httpOnly: boolean) => ({
  httpOnly,
  secure: env.NODE_ENV !== 'development', // 'true' em produção (HTTPS)
  sameSite: 'strict' as const, // Mitigação CSRF
  maxAge: 24 * 60 * 60 * 1000, // 1 dia
  path: '/',
});

const setAuthCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_AUTH_NAME, token, cookieOptions(true));
};

const setCsrfCookie = (res: Response) => {
  const csrfToken = crypto.randomBytes(16).toString('hex');
  res.cookie(COOKIE_CSRF_NAME, csrfToken, cookieOptions(false));
};

const clearCookies = (res: Response) => {
  res.cookie(COOKIE_AUTH_NAME, '', { ...cookieOptions(true), maxAge: -1 });
  res.cookie(COOKIE_CSRF_NAME, '', { ...cookieOptions(false), maxAge: -1 });
};

export class AuthController {
  constructor(private authService: AuthService) {}

  async checkFirst(req: Request, res: Response) {
    const { hasAdmin } = await this.authService.checkFirstUser();
    res.status(200).json({ hasAdmin });
  }

  async login(req: Request, res: Response) {
    const loginData = req.body as LoginDto;
    const { token, usuario } = await this.authService.login(loginData);

    // Definir cookies
    setAuthCookie(res, token);
    setCsrfCookie(res); 

    res.status(200).json({ usuario });
  }

  async registrar(req: Request, res: Response) {
    const registrarData = req.body as RegistrarDto;
    const { token, usuario } = await this.authService.registrar(registrarData);

    // Definir cookies
    setAuthCookie(res, token); 
    setCsrfCookie(res); 

    res.status(200).json({ usuario });
  }

  async logout(req: Request, res: Response) {
    clearCookies(res);
    res.status(200).json({ message: 'Logout realizado com sucesso.' });
  }
}

