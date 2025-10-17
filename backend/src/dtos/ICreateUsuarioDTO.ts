import { PerfilUsuario } from '@prisma/client';

export type CreateUsuarioDto = {
  nome: string;
  email: string;
  senha: string;
  perfil?: PerfilUsuario; // O perfil é opcional no registro, default é ATENDENTE
};
