import { Usuario, PerfilUsuario } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CreateUsuarioDto } from '../dtos/ICreateUsuarioDTO';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorMiddleware';
import { env } from '../config/env'; // Importa as variáveis de ambiente validadas
import logger from '../lib/logger'; // Importa o logger

export class AuthService {
 
  public async checkFirstUser(): Promise<boolean> {
    try {
      const count = await prisma.usuario.count();
      logger.info(`Verificação de primeiro usuário: ${count} usuários encontrados.`);
      return count === 0;
    } catch (error) {
      logger.error('Erro ao verificar o primeiro usuário no banco de dados:', error);
      // Em caso de erro na contagem, assume que não é o primeiro para segurança
      // e lança um erro para indicar falha na operação.
      throw new AppError('Erro ao verificar status inicial do sistema.', 500);
    }
  }

  public async login(email: string, senhaInserida: string): Promise<{ token: string; usuario: Omit<Usuario, 'senha'> }> {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    // Verifica se o usuário existe E se está ativo
    if (!usuario || !usuario.ativo) {
      logger.warn(`Tentativa de login falhou para email: ${email} (Usuário não encontrado ou inativo)`);
      // Usa mensagem genérica para segurança
      throw new AppError('Credenciais inválidas.', 401);
    }

    // Compara a senha fornecida com o hash armazenado
    const senhaValida = await bcrypt.compare(senhaInserida, usuario.senha);
    if (!senhaValida) {
      logger.warn(`Tentativa de login falhou para email: ${email} (Senha incorreta)`);
      throw new AppError('Credenciais inválidas.', 401);
    }

    // Usa a chave secreta validada do 'env'
    const jwtSecret = env.JWT_SECRET;

    // Gera o token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, perfil: usuario.perfil },
      jwtSecret,
      { expiresIn: '8h' } // Define a expiração do token
    );

    // Remove a senha do objeto de usuário antes de retornar
    const { senha, ...usuarioSemSenha } = usuario;

    logger.info(`Usuário logado com sucesso: ${usuario.email} (ID: ${usuario.id})`);
    return { token, usuario: usuarioSemSenha };
  }

  public async registrar(data: CreateUsuarioDto): Promise<{ token: string; usuario: Omit<Usuario, 'senha'> }> {
    // Verifica se já existe um usuário com o mesmo email
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (usuarioExistente) {
      logger.warn(`Tentativa de registro falhou: Email ${data.email} já está em uso.`);
      throw new AppError('Este email já está em uso.', 409); // 409 Conflict
    }

    // Verifica se este será o primeiro usuário
    const isFirst = await this.checkFirstUser();
    const perfil = isFirst ? PerfilUsuario.ADMINISTRADOR : PerfilUsuario.ATENDENTE;
    logger.info(`Registrando novo usuário. É o primeiro? ${isFirst}. Perfil definido como: ${perfil}`);

    // Gera o hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(data.senha, salt);

    let novoUsuario: Usuario;
    try {
      // Cria o novo usuário no banco de dados
      novoUsuario = await prisma.usuario.create({
        data: {
          nome: data.nome,
          email: data.email,
          senha: senhaHash,
          perfil: perfil,
          // O campo 'ativo' já tem 'default: true' definido no schema.prisma
        },
      });
      logger.info(`Novo usuário registrado com sucesso: ${novoUsuario.email} (ID: ${novoUsuario.id}), Perfil: ${perfil}`);
    } catch (error: any) {
      logger.error('Erro ao criar usuário no Prisma durante o registro:', {
          errorMessage: error.message,
          errorCode: error.code,
          meta: error.meta, // Inclui metadados do erro do Prisma, se disponíveis
          email: data.email,
      });
      // Trata erro específico de constraint única (embora já verificado acima, como fallback)
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
           throw new AppError('Este email já está em uso (constraint falhou).', 409);
      }
      throw new AppError('Erro interno ao registrar usuário.', 500);
    }


    // Gera o token JWT para o usuário recém-criado
    const jwtSecret = env.JWT_SECRET;
    const token = jwt.sign(
      { id: novoUsuario.id, email: novoUsuario.email, perfil: novoUsuario.perfil },
      jwtSecret,
      { expiresIn: '8h' }
    );

    // Remove a senha do objeto de usuário antes de retornar
    const { senha, ...usuarioSemSenha } = novoUsuario;

    return { token, usuario: usuarioSemSenha };
  }
}
