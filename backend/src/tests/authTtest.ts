import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../app'; // Importa o app Express
import { prisma } from '../lib/prisma';
import { Server } from 'http';

let server: Server;
// <<< CORREÇÃO: Tipo correto é SuperTest<Test>
let request: supertest.SuperTest<supertest.Test>;

// Iniciar o servidor de teste
beforeAll(async () => {
  // Limpar o banco (apenas em ambiente de teste!)
  if (process.env.NODE_ENV === 'test') {
    await prisma.usuario.deleteMany();
  } else {
    throw new Error('Testes devem rodar com NODE_ENV=test');
  }

  // Criar usuário admin para o seed (RF15)
  await prisma.usuario.create({
    data: {
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      senha: '$2a$10$fakesenha1234567890abcde', // Senha "123456" (exemplo)
      perfil: 'ADMINISTRADOR',
      ativo: true,
    },
  });

  server = app.listen(0); // Porta aleatória
  request = supertest(server);
});

// Fechar o servidor
afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe('Fluxo de Autenticação (CHANGE-SEG-01)', () => {
  
  it('deve falhar ao acessar rota protegida sem cookie', async () => {
    const response = await request.get('/api/usuarios');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token de autenticação não fornecido.');
  });

  it('deve falhar ao logar com credenciais erradas', async () => {
    const response = await request.post('/api/auth/login').send({
      email: 'admin@teste.com',
      senha: 'senhaerrada',
    });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Email ou senha inválidos.');
  });

  it('deve autenticar, definir cookies (auth e csrf) e retornar usuário', async () => {
    const response = await request.post('/api/auth/login').send({
      email: 'admin@teste.com',
      senha: '123456', // Assumindo que a senha do seed é esta
    });

    expect(response.status).toBe(200);
    expect(response.body.usuario.email).toBe('admin@teste.com');
    
    // Verificar cookies (CHANGE-SEG-01 e SEG-02)
    const cookiesHeader = response.headers['set-cookie'];
    expect(cookiesHeader).toBeDefined();
    const cookies = Array.isArray(cookiesHeader) ? cookiesHeader : [cookiesHeader];

    expect(cookies.some((cookie: string) => cookie.startsWith('token='))).toBe(true);
    expect(cookies.some((cookie: string) => cookie.includes('HttpOnly'))).toBe(true);
    expect(cookies.some((cookie: string) => cookie.startsWith('csrf-token='))).toBe(true);
  });

  it('deve acessar rota protegida após login (com cookie)', async () => {
    // 1. Login para obter o cookie
    const loginRes = await request.post('/api/auth/login').send({
      email: 'admin@teste.com',
      senha: '123456',
    });
    
    const cookie = loginRes.headers['set-cookie'];

    // 2. Acessar rota protegida
    const response = await request.get('/api/usuarios').set('Cookie', cookie);

    // NOTA: O controller de usuários 'listarTodos' retorna um objeto paginado.
    // O teste original (response.body.dados) estava correto, assumindo a 
    // implementação de 'usuariosService.listarPaginado'.
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true); // O service retorna { data: [], meta: {} }
  });

  it('deve deslogar e limpar os cookies', async () => {
    // 1. Login
    const loginRes = await request.post('/api/auth/login').send({
      email: 'admin@teste.com',
      senha: '123456',
    });
    const cookie = loginRes.headers['set-cookie'];

    // 2. Logout
    const logoutRes = await request.post('/api/auth/logout').set('Cookie', cookie);
    
    expect(logoutRes.status).toBe(200);
    
    // Verificar se os cookies foram expirados
    const clearedCookiesHeader = logoutRes.headers['set-cookie'];
    expect(clearedCookiesHeader).toBeDefined();
    const clearedCookies = Array.isArray(clearedCookiesHeader) ? clearedCookiesHeader : [clearedCookiesHeader];

    expect(clearedCookies.some((c: string) => c.includes('token=;'))).toBe(true);
    expect(clearedCookies.some((c: string) => c.includes('csrf-token=;'))).toBe(true);
    expect(clearedCookies.some((c: string) => c.includes('Expires='))).toBe(true);
  });
});
