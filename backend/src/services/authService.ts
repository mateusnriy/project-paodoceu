import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { compare, hash } from 'bcryptjs'; 
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { LoginDto, RegistrarDto } from '../validations/authValidation';
import { PerfilUsuario } from '@prisma/client';

export class AuthService {

  public async checkFirstUser(): Promise<{ hasAdmin: boolean }> {
    const adminCount = await prisma.usuario.count({
      where: { perfil: PerfilUsuario.ADMINISTRADOR },
    });
    return { hasAdmin: adminCount > 0 };
  }

  public async login(
    loginData: LoginDto,
  ): Promise<{ token: string; usuario: any }> {
    const { email, senha } = loginData;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      logger.warn(`Tentativa de login falhou (email não encontrado): ${email}`);
      throw new AppError('Email ou senha inválidos.', 401);
    }

    const senhaCorreta = await compare(senha, usuario.senha);
    if (!senhaCorreta) {
      logger.warn(`Tentativa de login falhou (senha incorreta): ${email}`);
      throw new AppError('Email ou senha inválidos.', 401);
    }

    if (!usuario.ativo) {
      logger.warn(`Tentativa de login falhou (usuário inativo): ${email}`);
      throw new AppError('Usuário inativo. Contate o administrador.', 403);
    }

    const token = jwt.sign({ id: usuario.id }, env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const { senha: _, ...usuarioSemSenha } = usuario;
    return { token, usuario: usuarioSemSenha };
  }

  public async registrar(
    registrarData: RegistrarDto,
  ): Promise<{ token: string; usuario: any }> {
    const { email, nome, senha } = registrarData;

    const { hasAdmin } = await this.checkFirstUser();
    let perfil: PerfilUsuario = PerfilUsuario.MASTER; 
    let ativo = false; 

    if (!hasAdmin) {
    
      perfil = PerfilUsuario.MASTER;
      ativo = true;
    } else {
      if (registrarData.perfil) {
        perfil = registrarData.perfil;
      }
    }

    const emailJaExiste = await prisma.usuario.findUnique({
      where: { email },
    });
    if (emailJaExiste) {
      throw new AppError('Email já cadastrado.', 409);
    }

    const senhaHash = await hash(senha, 10);

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        perfil,
        ativo: perfil === PerfilUsuario.MASTER,
      },
    });

    if (!ativo) {
       throw new AppError('Usuário registrado com sucesso. Aguarde ativação do administrador.', 201);
    }
    
    const token = jwt.sign({ id: novoUsuario.id }, env.JWT_SECRET, {
      expiresIn: '1d',
    });
    
    const { senha: _, ...usuarioSemSenha } = novoUsuario;
    return { token, usuario: usuarioSemSenha };
  }
}
