// src/types/user.ts

export enum PerfilUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  ATENDENTE = 'ATENDENTE',
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario; // Usa o Enum
  ativo: boolean;
  criado_em: string; // Adicionado
  atualizado_em: string; // Adicionado
  // dataCriacao: string; // Remover se existir
  // dataAtualizacao: string; // Remover se existir
}

// Tipo usado no AuthContext (sem dados sensíveis)
export interface AuthUsuario extends Omit<Usuario, 'ativo' | 'senha' | 'criado_em' | 'atualizado_em'> {} // Remover senha se existir

// Tipo usado nos formulários de criação/edição
export interface UsuarioFormData {
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
}
