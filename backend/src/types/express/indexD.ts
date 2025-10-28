// (O arquivo original pode ter 'Usuario' do prisma client)
// import { Usuario } from '@prisma/client';

// Correção: Definir o tipo exato anexado pelo authMiddleware
interface AuthUsuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMINISTRADOR' | 'ATENDENTE'; // Usar o Enum PerfilUsuario se importado
  ativo: boolean;
}

declare global {
  namespace Express {
    export interface Request {
      usuario: AuthUsuario;
    }
  }
}
