// src/dtos/CreateUsuarioDto.ts
import { PerfilUsuario } from '@prisma/client';

// Este DTO (Data Transfer Object) define a estrutura de dados
// esperada ao criar um novo usuário.
export type CreateUsuarioDto = {
  nome: string;
  email: string;
  senha: string;
  perfil?: PerfilUsuario; // O perfil é opcional no registro, default é ATENDENTE
};
