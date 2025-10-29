import { PrismaClient, Usuario, PerfilUsuario, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/errorMiddleware';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger'; 

type CreateUsuarioAdminDto = {
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
  ativo?: boolean;
}

type UpdateUsuarioDto = Partial<CreateUsuarioAdminDto>;

// Interface para a resposta paginada
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

export class UsuariosService {
  private omitirSenha(usuario: Usuario): Omit<Usuario, 'senha'> {
    const { senha, ...resto } = usuario;
    return resto;
  }
  
  private omitirSenhaDeArray(usuarios: Usuario[]): Omit<Usuario, 'senha'>[] {
    return usuarios.map(u => this.omitirSenha(u));
  }
  
  async listarPaginado(
    pagina: number,
    limite: number,
    nome?: string
  ): Promise<PaginatedResponse<Omit<Usuario, 'senha'>>> {
    
    const where: Prisma.UsuarioWhereInput = {};
    if (nome) {
      where.OR = [
        { nome: { contains: nome, mode: 'insensitive' } },
        { email: { contains: nome, mode: 'insensitive' } },
      ];
    }

    const totalItens = await prisma.usuario.count({ where });
    const totalPaginas = Math.ceil(totalItens / limite);
    const skip = (pagina - 1) * limite;

    const usuarios = await prisma.usuario.findMany({
      where,
      orderBy: {
        nome: 'asc',
      },
      take: limite,
      skip: skip,
    });

    return {
      data: this.omitirSenhaDeArray(usuarios),
      meta: {
        total: totalItens,
        pagina,
        limite,
        totalPaginas,
      },
    };
  }

  async obterPorId(id: string): Promise<Omit<Usuario, 'senha'> | null> {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return null;
    return this.omitirSenha(usuario);
  }

  async criar(data: CreateUsuarioAdminDto): Promise<Omit<Usuario, 'senha'>> {
    if (!data.senha) {
      throw new AppError("O campo 'senha' é obrigatório para criar um usuário.", 400);
    }
    
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (usuarioExistente) {
      throw new AppError('Este email já está em uso.', 409); // 409 Conflict
    }
    
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(data.senha, salt);

    try {
        const novoUsuario = await prisma.usuario.create({
          data: {
            ...data,
            senha: senhaHash,
          },
        });
        return this.omitirSenha(novoUsuario);
    } catch (error: any) {
        logger.error('Error creating user in Prisma:', { error: error.message, code: error.code });
         if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
             throw new AppError('Este email já está em uso (constraint falhou).', 409);
         }
        throw new AppError('Erro interno ao criar usuário.', 500);
    }
  }

  async atualizar(id: string, data: UpdateUsuarioDto): Promise<Omit<Usuario, 'senha'>> {
    const dadosParaAtualizar: any = { ...data };

    if (data.senha && data.senha.length > 0) {
      const salt = await bcrypt.genSalt(10);
      dadosParaAtualizar.senha = await bcrypt.hash(data.senha, salt);
    } else {
      delete dadosParaAtualizar.senha; 
    }

     if (data.email) {
         const existingEmail = await prisma.usuario.findFirst({
             where: {
                 email: { equals: data.email, mode: 'insensitive' },
                 id: { not: id }
             }
         });
         if (existingEmail) {
             throw new AppError('Já existe outro usuário com este email.', 409);
         }
     }
  
    try {
        const usuarioAtualizado = await prisma.usuario.update({
          where: { id },
          data: dadosParaAtualizar,
        });
        return this.omitirSenha(usuarioAtualizado);
    } catch (error: any) {
         logger.error('Error updating user in Prisma:', { error: error.message, code: error.code });
         if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
             throw new AppError('Este email já está em uso.', 409);
         }
         if (error.code === 'P2025') {
              throw new AppError('Usuário não encontrado.', 404);
         }
         throw new AppError('Erro interno ao atualizar usuário.', 500);
    }
  }
  
  async deletar(id: string): Promise<void> {
    try {
        await prisma.usuario.delete({ where: { id } });
    } catch (error: any) {
         logger.error('Error deleting user in Prisma:', { error: error.message, code: error.code });
         if (error.code === 'P2025') { // "Record to delete does not exist"
              throw new AppError('Usuário não encontrado.', 404);
         }
         if (error.code === 'P2003') { 
              throw new AppError('Não é possível deletar o usuário pois ele está associado a pedidos.', 400);
         }
         throw new AppError('Erro interno ao deletar usuário.', 500);
    }
  }
}
