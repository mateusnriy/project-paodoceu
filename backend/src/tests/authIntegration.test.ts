// backend/src/tests/authIntegration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../app'; // Importa o app Express
import { prisma } from '../lib/prisma';
import { Server } from 'http';
import { hash } from 'bcryptjs';
import { PerfilUsuario } from '@prisma/client';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

const testUser = {
  email: 'admin.seguranca@teste.com',
  senha: 'Password@123',
};
let createdUserId: string;

// Iniciar o servidor de teste
beforeAll(async () => {
  // Criar usuário admin para os testes
  const senhaHash = await hash(testUser.senha, 10);
  const user = await prisma.usuario.create({
    data: {
      nome: 'Admin Teste Seguranca',
      email: testUser.email,
      senha: senhaHash,
      // (P4.1) Usar ADMINISTRADOR é correto para testar o login de um admin padrão
      perfil: PerfilUsuario.ADMINISTRADOR,
      ativo: true,
    },
  });
  createdUserId = user.id;

  server = app.listen(0); // Porta aleatória
  request = supertest(server);
});

// Fechar o servidor e limpar usuário
afterAll(async () => {
  if (createdUserId) {
    await prisma.usuario.deleteMany({ where: { id: createdUserId } });
  }
  if (server) {
    server.close();
  }
});

/**
 * Helper para extrair cookies da resposta
 */
const getCookies = (response: supertest.Response): string[] => {
  const cookies = response.headers['set-cookie'];
  if (!cookies) return [];
  return Array.isArray(cookies) ? cookies : [cookies];
};

/**
 * Helper para extrair o valor do cookie CSRF
 */
const getCsrfToken = (cookies: string[]): string | null => {
  const csrfCookie = cookies.find((c) => c.startsWith('csrf-token='));
  if (!csrfCookie) return null;
  return csrfCookie.split(';')[0].split('=')[1];
};

describe('Fluxo de Autenticação e Segurança (RNF06)', () => {
  it('(RNF06) [Falha] Deve falhar (401) ao acessar rota protegida sem cookie', async () => {
    const response = await request.get('/api/usuarios');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token de autenticação não fornecido.');
  });

  it('(RNF06) [Sucesso] Deve autenticar, definir cookies (auth HttpOnly e csrf)', async () => {
    const response = await request.post('/api/auth/login').send(testUser);

    expect(response.status).toBe(200);
    expect(response.body.usuario.email).toBe(testUser.email);

    const cookies = getCookies(response);

    // (RNF06) Verifica cookie HttpOnly 'token'
    const authToken = cookies.find((cookie: string) =>
      cookie.startsWith('token='),
    );
    expect(authToken).toBeDefined();
    expect(authToken).include('HttpOnly');
    expect(authToken).include('SameSite=Strict');

    // (RNF06) Verifica cookie Não-HttpOnly 'csrf-token'
    const csrfToken = cookies.find((c) => c.startsWith('csrf-token='));
    expect(csrfToken).toBeDefined();
    expect(csrfToken).not.include('HttpOnly');
    expect(csrfToken).include('SameSite=Strict');
  });

  it('(RNF06) [Sucesso] Deve acessar rota protegida (GET) após login (com cookie)', async () => {
    // 1. Login para obter o cookie
    const loginRes = await request.post('/api/auth/login').send(testUser);
    const cookies = getCookies(loginRes);

    // 2. Acessar rota protegida
    const response = await request.get('/api/usuarios').set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('(RNF06 - CSRF) [Falha] Deve falhar (403) ao acessar rota (POST) sem header CSRF', async () => {
    // 1. Login
    const loginRes = await request.post('/api/auth/login').send(testUser);
    const cookies = getCookies(loginRes);

    // 2. Tentar POST (rota protegida) apenas com cookie de auth
    const response = await request
      .post('/api/categorias')
      .set('Cookie', cookies)
      .send({ nome: 'Categoria CSRF Fail' });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Token CSRF ausente');
  });

  it('(RNF06 - CSRF) [Sucesso] Deve acessar rota (POST) com cookie de auth e header CSRF', async () => {
    // 1. Login
    const loginRes = await request.post('/api/auth/login').send(testUser);
    const cookies = getCookies(loginRes);
    const csrfToken = getCsrfToken(cookies);

    expect(csrfToken).toBeDefined();

    // 2. Tentar POST (rota protegida) com auth E header CSRF
    const response = await request
      .post('/api/categorias')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken!) // Envia o header
      .send({ nome: 'Categoria CSRF Success' });

    expect(response.status).toBe(201); // 201 Created
    expect(response.body.nome).toBe('Categoria CSRF Success');

    // Limpeza
    await prisma.categoria.delete({ where: { id: response.body.id } });
  });

  it('(RNF06) [Sucesso] Deve deslogar e limpar (expirar) os cookies', async () => {
    // 1. Login
    const loginRes = await request.post('/api/auth/login').send(testUser);
    const cookies = getCookies(loginRes);
    const csrfToken = getCsrfToken(cookies);

    // 2. Logout (requer auth e csrf)
    const logoutRes = await request
      .post('/api/auth/logout')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken!);

    expect(logoutRes.status).toBe(200);

    // Verificar se os cookies foram expirados
    const clearedCookies = getCookies(logoutRes);
    expect(
      clearedCookies.some((c: string) => c.includes('token=;')),
    ).toBe(true);
    expect(
      clearedCookies.some((c: string) => c.includes('csrf-token=;')),
    ).toBe(true);
    // Max-Age=-1 ou Expires no passado
    expect(
      clearedCookies.some(
        (c: string) => c.includes('Max-Age=-1') || c.includes('Expires='),
      ),
    ).toBe(true);
  });

  it('(RNF06 - Helmet) [Sucesso] Deve incluir headers de segurança (Helmet)', async () => {
    const response = await request.get('/'); // Rota pública

    expect(response.status).toBe(200);
    expect(response.headers['x-dns-prefetch-control']).toBe('off');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-download-options']).toBe('noopen');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['strict-transport-security']).toBeDefined();
  });
});
