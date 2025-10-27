// src/types/user.ts

export enum PerfilUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  ATENDENTE = 'ATENDENTE',
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  criado_em: string; // Corrigido de dataCriacao
  atualizado_em: string; // Corrigido de dataAtualizacao
}

// Tipo usado no AuthContext (removido campos que não vêm da API de login)
export interface AuthUsuario extends Omit<Usuario, 'ativo' | 'criado_em' | 'atualizado_em'> {}

// Tipo usado nos formulários de criação/edição
export interface UsuarioFormData {
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
}
