// backend/src/types/express/index.d.ts
import { PerfilUsuario } from '@prisma/client';

// Define a interface para os dados do usuário anexados ao objeto Request
export interface AuthUsuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean; // Pode ser útil manter, embora o middleware já valide
}

// Estende a interface global Request do Express para incluir a propriedade 'usuario'
declare global {
  namespace Express {
    export interface Request {
      // Adiciona a propriedade 'usuario' que conterá os dados do usuário autenticado
      // É opcional (?) pois rotas não autenticadas não terão essa propriedade.
      // No entanto, em rotas protegidas pelo authMiddleware, ela estará presente.
      usuario?: AuthUsuario;
    }
  }
}

// Linha necessária para que o TypeScript trate este arquivo como um módulo
export {};
