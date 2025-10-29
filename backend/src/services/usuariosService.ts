import { Usuario, PerfilUsuario, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/errorMiddleware';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { AuthUsuario } from '../types/express';
import { PaginatedResponse } from '../types/pagination'; // (CORREÇÃO ERRO 9) Importação agora funciona

// DTOs locais para clareza
type CreateUsuarioAdminDto = {
  nome: string;
  email: string;
  senha?: string; // Senha obrigatória na criação (validado no serviço)
  perfil: PerfilUsuario;
  ativo?: boolean;
};

type UpdateUsuarioDto = {
  nome?: string;
  email?: string;
  senha?: string; // Senha opcional na atualização
  perfil?: PerfilUsuario;
  ativo?: boolean;
};

export class UsuariosService {
  // Remove a senha de um único objeto de usuário
  private omitirSenha(usuario: Usuario): Omit<Usuario, 'senha'> {
    const { senha, ...resto } = usuario;
    return resto;
  }

  // Remove a senha de um array de usuários
  private omitirSenhaDeArray(usuarios: Usuario[]): Omit<Usuario, 'senha'>[] {
    return usuarios.map((u) => this.omitirSenha(u));
  }

  /**
   * Valida se o Ator (Admin) tem permissão para gerenciar o Alvo (usuário).
   * CORREÇÃO P2.2 (RF04, RN03)
   */
  private validarPermissao(
    ator: AuthUsuario,
    alvoPerfil: PerfilUsuario | null, // Perfil do usuário sendo modificado (ou null se criando)
    dadosPerfil?: PerfilUsuario, // Perfil que está sendo atribuído (opcional)
  ) {
    // 1. MASTER pode tudo.
    if (ator.perfil === PerfilUsuario.MASTER) {
      return;
    }

    // 2. ADMINISTRADOR (Comum)
    if (ator.perfil === PerfilUsuario.ADMINISTRADOR) {
      // A. Não pode criar/definir perfil MASTER ou ADMINISTRADOR
      if (dadosPerfil) {
        if (
          dadosPerfil === PerfilUsuario.MASTER ||
          dadosPerfil === PerfilUsuario.ADMINISTRADOR
        ) {
          throw new AppError(
            'Administradores podem criar apenas Atendentes.',
            403,
          );
        }
      }

      // B. Não pode editar/deletar um MASTER ou outro ADMINISTRADOR
      if (alvoPerfil) {
        if (
          alvoPerfil === PerfilUsuario.MASTER ||
          alvoPerfil === PerfilUsuario.ADMINISTRADOR
        ) {
          throw new AppError(
            'Administradores podem gerenciar apenas Atendentes.',
            403,
          );
        }
      }

      return;
    }

    // 3. ATENDENTE (Segurança extra, embora o roleMiddleware deva barrar)
    throw new AppError('Acesso negado.', 403);
  }

  async listarPaginado(
    pagina: number,
    limite: number,
    nome?: string,
  ): Promise<PaginatedResponse<Omit<Usuario, 'senha'>>> {
    const where: Prisma.UsuarioWhereInput = {};
    if (nome) {
      // Busca por nome ou email
      where.OR = [
        { nome: { contains: nome, mode: 'insensitive' } },
        { email: { contains: nome, mode: 'insensitive' } },
      ];
    }

    const [totalItens, usuarios] = await prisma.$transaction([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        orderBy: { nome: 'asc' },
        take: limite,
        skip: (pagina - 1) * limite,
      }),
    ]);

    const totalPaginas = Math.ceil(totalItens / limite);

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

  async criar(
    data: CreateUsuarioAdminDto,
    ator: AuthUsuario, // CORREÇÃO P2.2
  ): Promise<Omit<Usuario, 'senha'>> {
    // CORREÇÃO P2.2: Valida permissão de criação
    this.validarPermissao(ator, null, data.perfil);

    if (!data.senha) {
      throw new AppError(
        "O campo 'senha' é obrigatório para criar um usuário.",
        400,
      );
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: data.email },
    });
    if (usuarioExistente) {
      throw new AppError('Este email já está em uso.', 409); // 409 Conflict
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);

    try {
      const novoUsuario = await prisma.usuario.create({
        data: {
          ...data,
          senha: senhaHash,
        },
      });
      return this.omitirSenha(novoUsuario);
    } catch (error: any) {
      logger.error('Erro ao criar usuário:', {
        error: error.message,
        code: error.code,
      });
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new AppError('Este email já está em uso (constraint falhou).', 409);
      }
      throw new AppError('Erro interno ao criar usuário.', 500);
    }
  }

  async atualizar(
    id: string,
    data: UpdateUsuarioDto,
    ator: AuthUsuario, // CORREÇÃO P2.2
  ): Promise<Omit<Usuario, 'senha'>> {
    // Busca o usuário alvo primeiro para checar permissão e auto-atualização
    const usuarioAlvo = await prisma.usuario.findUnique({ where: { id } });
    if (!usuarioAlvo) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // CORREÇÃO P2.2: Valida permissão de atualização
    // Não pode atualizar a si mesmo (deve usar /api/auth/profile)
    if (ator.id === id) {
      throw new AppError(
        'Não é possível atualizar o próprio perfil por esta rota. Use "Meu Perfil".',
        400,
      );
    }
    // Valida hierarquia
    this.validarPermissao(ator, usuarioAlvo.perfil, data.perfil);

    const dadosParaAtualizar: Prisma.UsuarioUpdateInput = { ...data };

    // Se a senha foi fornecida (e não é string vazia), faz o hash
    if (data.senha && data.senha.length > 0) {
      dadosParaAtualizar.senha = await bcrypt.hash(data.senha, 10);
    } else {
      delete dadosParaAtualizar.senha; // Não atualiza a senha se estiver vazia ou ausente
    }

    // Verifica conflito de email
    if (data.email) {
      const emailExistente = await prisma.usuario.findFirst({
        where: {
          email: { equals: data.email, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (emailExistente) {
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
      logger.error('Erro ao atualizar usuário:', {
        error: error.message,
        code: error.code,
      });
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new AppError('Este email já está em uso.', 409);
      }
      if (error.code === 'P2025') {
        throw new AppError('Usuário não encontrado (concorrência).', 404);
      }
      throw new AppError('Erro interno ao atualizar usuário.', 500);
    }
  }

  async deletar(
    id: string,
    ator: AuthUsuario, // CORREÇÃO P2.2
  ): Promise<void> {
    const usuarioAlvo = await prisma.usuario.findUnique({ where: { id } });
    if (!usuarioAlvo) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // CORREÇÃO P2.2: Valida permissão de deleção
    // Não pode deletar a si mesmo
    if (ator.id === id) {
      throw new AppError('Não é possível deletar a si mesmo.', 400);
    }
    // Valida hierarquia
    this.validarPermissao(ator, usuarioAlvo.perfil);

    try {
      await prisma.usuario.delete({ where: { id } });
    } catch (error: any) {
      logger.error('Erro ao deletar usuário:', {
        error: error.message,
        code: error.code,
      });
      if (error.code === 'P2025') {
        throw new AppError('Usuário não encontrado.', 404);
      }
      // P2003 = Foreign key constraint failed (ex: usuário tem pedidos)
      if (error.code === 'P2003') {
        throw new AppError(
          'Não é possível deletar o usuário pois ele está associado a pedidos.',
          400,
        );
      }
      throw new AppError('Erro interno ao deletar usuário.', 500);
    }
  }
}

