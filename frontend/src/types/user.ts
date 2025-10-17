export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMINISTRADOR' | 'ATENDENTE';
  ativo: boolean;
}

export interface AuthUser extends Omit<User, 'senha'> {}
