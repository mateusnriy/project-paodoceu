import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { compare, hash } from 'bcryptjs'; 
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { LoginDto, RegistrarDto } from '../validations/authValidation';
import { PerfilUsuario } from '@prisma/client';

export class AuthService {
  // Retorna { hasAdmin: boolean }
  public async checkFirstUser(): Promise<{ hasAdmin: boolean }> {
    const adminCount = await prisma.usuario.count({
      where: { perfil: PerfilUsuario.ADMINISTRADOR },
    });
    return { hasAdmin: adminCount > 0 };
  }

  // (Correção Erro 4): Aceita LoginDto (objeto)
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

    // Omitir senha do retorno
    const { senha: _, ...usuarioSemSenha } = usuario;
    return { token, usuario: usuarioSemSenha };
  }

  public async registrar(
    registrarData: RegistrarDto,
  ): Promise<{ token: string; usuario: any }> {
    const { email, nome, senha } = registrarData;

    const { hasAdmin } = await this.checkFirstUser();
    let perfil: PerfilUsuario = PerfilUsuario.ATENDENTE; // <<< CORREÇÃO (Adicionado tipo explícito)
    let ativo = false; // (DRS RF15: Novos atendentes devem ser ativados)

    if (!hasAdmin) {
      perfil = PerfilUsuario.ADMINISTRADOR; // (Agora compila)
      ativo = true; // Primeiro admin é ativo
    } else {
      // Se for registro público, verificar se o perfil foi enviado
      // (a lógica original permitia registro público de ATENDENTE)
      if (registrarData.perfil) {
        perfil = registrarData.perfil; // (Agora compila)
      }
    }
    
    // (O schema original tem default=true, o que viola RF15)
    // (Vamos seguir o RF15)

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
        ativo: perfil === 'ADMINISTRADOR', // (Agora compila)
      },
    });

    // Logar (se for o primeiro admin, não precisa logar)
    if (!ativo) {
       throw new AppError('Usuário registrado com sucesso. Aguarde ativação do administrador.', 201);
    }
    
    // Logar o primeiro admin
    const token = jwt.sign({ id: novoUsuario.id }, env.JWT_SECRET, {
      expiresIn: '1d',
    });
    
    const { senha: _, ...usuarioSemSenha } = novoUsuario;
    return { token, usuario: usuarioSemSenha };
  }
}
