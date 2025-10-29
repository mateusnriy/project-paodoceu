// frontend/src/types/user.ts
// Correção A.1: snake_case

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
  // --- Correção A.1 ---
  criado_em: string;
  atualizado_em: string;
  // --- Fim Correção A.1 ---
}

// Usuário autenticado (sem campos sensíveis ou desnecessários)
export interface AuthUsuario extends Omit<Usuario, 'ativo' | 'criado_em' | 'atualizado_em'> {}

// FormData para criação/atualização via Admin
// Mantém snake_case para consistência com ProdutoFormData
export interface UsuarioFormData {
  nome: string;
  email: string;
  senha?: string; // Opcional na atualização
  perfil: PerfilUsuario;
  ativo?: boolean; // Para permitir ativar/desativar
}

// Payloads específicos para API de autenticação (mantêm camelCase por convenção externa)
export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload extends Omit<UsuarioFormData, 'perfil' | 'ativo' | 'senha'> {
    senha: string; // Senha é obrigatória no registro
}
