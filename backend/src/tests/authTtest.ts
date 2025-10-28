import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../app'; // Importa o app Express
import { prisma } from '../lib/prisma';
import { Server } from 'http';

let server: Server;
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
      senhaHash: '$2a$10$fakesenha1234567890abcde', // Senha "123456" (exemplo)
      perfil: 'ADMINISTRADOR',
      ativo: true,
    },
  });

  server = app.listen(0); // Porta aleatória
  request = supertest(server);
});

// Fechar o servidor
afterAll((done) => {
  server.close(done);
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
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
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

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.dados)).toBe(true);
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
    const clearedCookies = logoutRes.headers['set-cookie'];
    expect(clearedCookies.some((c: string) => c.includes('token=;'))).toBe(true);
    expect(clearedCookies.some((c: string) => c.includes('csrf-token=;'))).toBe(true);
    expect(clearedCookies.some((c: string) => c.includes('Expires='))).toBe(true);
  });
});
