import { Usuario } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CreateUsuarioDto } from '../dtos/ICreateUsuarioDTO';
import { prisma } from '../lib/prisma';

export class AuthService {
  public async login(email: string, senhaInserida: string): Promise<{ token: string; usuario: Omit<Usuario, 'senha'> }> {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      throw new Error('Credenciais inválidas.');
    }

    const senhaValida = await bcrypt.compare(senhaInserida, usuario.senha);
    if (!senhaValida) {
      throw new Error('Credenciais inválidas.');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('Chave secreta JWT não configurada.');
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, perfil: usuario.perfil },
      jwtSecret,
      { expiresIn: '8h' } // Token expira em 8 horas
    );
    
    // Omitir a senha do objeto de usuário retornado
    const { senha, ...usuarioSemSenha } = usuario;

    return { token, usuario: usuarioSemSenha };
  }

  public async registrar(data: CreateUsuarioDto): Promise<Usuario> {
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

    return novoUsuario;
  }
}
