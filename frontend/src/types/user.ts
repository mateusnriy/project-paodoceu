
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
  dataCriacao: string;
  dataAtualizacao: string;
}

// Tipo usado no AuthContext (sem dados sensíveis)
export interface AuthUsuario extends Omit<Usuario, 'ativo'> {}

// Tipo usado nos formulários de criação/edição
export interface UsuarioFormData {
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
}