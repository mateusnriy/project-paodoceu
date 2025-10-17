import { Usuario } from '@prisma/client';

// Sobrescrevendo a interface Request do Express para adicionar nossa propriedade 'usuario'
declare global {
  namespace Express {
    export interface Request {
      usuario?: Omit<Usuario, 'senha'>;
    }
  }
}
