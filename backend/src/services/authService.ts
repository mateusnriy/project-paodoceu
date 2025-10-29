// backend/src/services/authService.ts
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import {
  LoginDto,
  RegistrarDto,
  // REMOVIDO: RequestPasswordResetDto, ResetPasswordDto
  UpdateOwnProfileDto,
} from '../validations/authValidation';
import { PerfilUsuario, Usuario, Prisma } from '@prisma/client';
// REMOVIDO: crypto, EmailService, addHours

// Tipo para o retorno dos métodos que expõem dados do usuário (sem senha)
type UserOutputDto = Omit<Usuario, 'senha'>;

export class AuthService {
  // REMOVIDO: emailService

  /**
   * Remove a senha do objeto de usuário.
   */
  private omitPassword(user: Usuario): UserOutputDto {
    const { senha, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Verifica se já existe um usuário MASTER no sistema. (RF15)
   */
  public async checkFirstUser(): Promise<{ hasMaster: boolean }> {
    const masterCount = await prisma.usuario.count({
      where: { perfil: PerfilUsuario.MASTER },
    });
    return { hasMaster: masterCount > 0 };
  }

  /**
   * Autentica um usuário. (RF01)
   */
  public async login(
    loginData: LoginDto,
  ): Promise<{ token: string; usuario: UserOutputDto }> {
    const { email, senha } = loginData;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      logger.warn(`Tentativa de login falhou (email não encontrado): ${email}`); // RF25
      throw new AppError('Email ou senha inválidos.', 401);
    }

    const senhaCorreta = await compare(senha, usuario.senha);
    if (!senhaCorreta) {
      logger.warn(`Tentativa de login falhou (senha incorreta): ${email}`); // RF25
      throw new AppError('Email ou senha inválidos.', 401);
    }

    if (!usuario.ativo) {
      logger.warn(`Tentativa de login falhou (usuário inativo): ${email}`); // RF25
      throw new AppError('Usuário inativo. Contate o administrador.', 403);
    }

    // Gera o token JWT
    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      env.JWT_SECRET,
      { expiresIn: '1d' }, // Expiração de 1 dia
    );

    logger.info(`Usuário logado com sucesso: ${email}`);
    return { token, usuario: this.omitPassword(usuario) };
  }

  /**
   * Registra um novo usuário. (RF15)
   */
  public async registrar(
    registrarData: RegistrarDto,
  ): Promise<{
    message: string | null;
    usuario: UserOutputDto | null;
    token?: string;
  }> {
    const { email, nome, senha } = registrarData;

    const { hasMaster } = await this.checkFirstUser();
    let perfil: PerfilUsuario;
    let ativo: boolean;

    if (!hasMaster) {
      perfil = PerfilUsuario.MASTER;
      ativo = true;
      logger.info(`Registrando primeiro usuário (MASTER): ${email}`);
    } else {
      perfil = PerfilUsuario.ATENDENTE;
      ativo = false; // Inativo por padrão
      logger.info(`Registrando novo usuário (ATENDENTE - inativo): ${email}`);
    }

    const emailJaExiste = await prisma.usuario.findUnique({
      where: { email },
    });
    if (emailJaExiste) {
      logger.warn(`Tentativa de registro falhou (email já existe): ${email}`);
      throw new AppError('Email já cadastrado.', 409);
    }

    const senhaHash = await hash(senha, 10);

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        perfil,
        ativo,
      },
    });

    const usuarioSemSenha = this.omitPassword(novoUsuario);

    if (ativo) {
      const token = jwt.sign(
        { id: novoUsuario.id, perfil: novoUsuario.perfil },
        env.JWT_SECRET,
        { expiresIn: '1d' },
      );
      return {
        message: 'Administrador Master criado com sucesso!',
        usuario: usuarioSemSenha,
        token,
      };
    } else {
      return {
        message:
          'Usuário registrado com sucesso. Aguarde ativação do administrador.',
        usuario: usuarioSemSenha,
        token: undefined,
      };
    }
  }

  // REMOVIDO: Método requestPasswordReset

  // REMOVIDO: Método resetPassword

  /**
   * Atualiza o perfil do próprio usuário autenticado. (RF18)
   */
  public async updateOwnProfile(
    userId: string,
    data: UpdateOwnProfileDto,
  ): Promise<UserOutputDto> {
    const { nome, currentPassword, newPassword } = data;

    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    if (!currentPassword) {
      throw new AppError(
        'Senha atual é obrigatória para atualizar o perfil.',
        400,
      );
    }
    const isCurrentPasswordCorrect = await compare(
      currentPassword,
      usuario.senha,
    );
    if (!isCurrentPasswordCorrect) {
      throw new AppError('Senha atual incorreta.', 403); // Forbidden
    }

    const dataToUpdate: Prisma.UsuarioUpdateInput = {};

    if (nome && nome !== usuario.nome) {
      dataToUpdate.nome = nome;
    }

    if (newPassword) {
      if (await compare(newPassword, usuario.senha)) {
        throw new AppError(
          'A nova senha não pode ser igual à senha atual.',
          400,
        );
      }
      dataToUpdate.senha = await hash(newPassword, 10);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return this.omitPassword(usuario);
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    logger.info(`Perfil atualizado para o usuário: ${usuario.email}`);
    return this.omitPassword(updatedUser);
  }
}
