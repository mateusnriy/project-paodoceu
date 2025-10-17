import { PrismaClient, Usuario, PerfilUsuario } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type CreateUsuarioAdminDto = {
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
}

type UpdateUsuarioDto = Partial<CreateUsuarioAdminDto>;

export class UsuariosService {
  private omitirSenha(usuario: Usuario): Omit<Usuario, 'senha'> {
    const { senha, ...resto } = usuario;
    return resto;
  }
  
  private omitirSenhaDeArray(usuarios: Usuario[]): Omit<Usuario, 'senha'>[] {
    return usuarios.map(u => this.omitirSenha(u));
  }
  
  async listarTodos(): Promise<Omit<Usuario, 'senha'>[]> {
    const usuarios = await prisma.usuario.findMany();
    return this.omitirSenhaDeArray(usuarios);
  }

  async obterPorId(id: string): Promise<Omit<Usuario, 'senha'> | null> {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return null;
    return this.omitirSenha(usuario);
  }

  async criar(data: CreateUsuarioAdminDto): Promise<Omit<Usuario, 'senha'>> {
    if (!data.senha) {
      throw new Error("O campo 'senha' é obrigatório para criar um usuário.");
    }
    
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (usuarioExistente) {
      throw new Error('Este email já está em uso.');
    }
    
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(data.senha, salt);

    const novoUsuario = await prisma.usuario.create({
      data: {
        ...data,
        senha: senhaHash,
      },
    });

    return this.omitirSenha(novoUsuario);
  }

  async atualizar(id: string, data: UpdateUsuarioDto): Promise<Omit<Usuario, 'senha'>> {
    const dadosParaAtualizar: any = { ...data };

    if (data.senha) {
      const salt = await bcrypt.genSalt(10);
      dadosParaAtualizar.senha = await bcrypt.hash(data.senha, salt);
    }
    
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: dadosParaAtualizar,
    });
    
    return this.omitirSenha(usuarioAtualizado);
  }

  async deletar(id: string): Promise<void> {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }
    await prisma.usuario.delete({ where: { id } });
  }
}
