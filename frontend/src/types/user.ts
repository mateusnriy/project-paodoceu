export enum PerfilUsuario {
  MASTER = 'MASTER',
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

export interface AuthUsuario extends Omit<Usuario, 'ativo' | 'criado_em' | 'atualizado_em'> {}

export interface UsuarioFormData {
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
}
