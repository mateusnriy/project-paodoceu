import { PerfilUsuario } from '@prisma/client';

export interface AuthUsuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

declare global {
  namespace Express {
    export interface Request {
      usuario: AuthUsuario;
    }
  }
}

export {};
