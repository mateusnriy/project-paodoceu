import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../app'; // Importa o app Express
import { prisma } from '../lib/prisma';
import { Server } from 'http';
import { hash } from 'bcryptjs';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

const testUser = {
  email: 'admin.seguranca@teste.com',
  senha: 'Password@123',
};

// Iniciar o servidor de teste
beforeAll(async () => {
  // Criar usuário admin para os testes
  const senhaHash = await hash(testUser.senha, 10);
  await prisma.usuario.create({
    data: {
      nome: 'Admin Teste Seguranca',
      email: testUser.email,
      senha: senhaHash, // Correção (Erro 32)
      perfil: 'ADMINISTRADOR',
      ativo: true,
    },
  });

  server = app.listen(0); // Porta aleatória
  request = supertest(server); // Correção (Erro 33)
});

// Fechar o servidor e limpar usuário
afterAll(async () => {
  await prisma.usuario.deleteMany({ where: { email: testUser.email } });
  await server.close(); // Correção (Erro 34)
});

/**
 * Helper para extrair cookies da resposta
 */
const getCookies = (response: supertest.Response): string[] => {
  // Correção (Erro 35-40): Garantir que 'set-cookie' é tratado como array
  const cookies = response.headers['set-cookie'];
  if (!cookies) return [];
  return Array.isArray(cookies) ? cookies : [cookies];
};

/**
 * Helper para extrair o valor do cookie CSRF
 */
const getCsrfToken = (cookies: string[]): string | null => {
  const csrfCookie = cookies.find(c => c.startsWith('csrf-token='));
  if (!csrfCookie) return null;
  return csrfCookie.split(';')[0].split('=')[1];
};


describe('Fluxo de Autenticação e Segurança (SEG-01, SEG-02, SEG-03)', () => {
  
  it('(SEG-01) [Falha] Deve falhar (401) ao acessar rota protegida sem cookie', async () => {
    const response = await request.get('/api/usuarios');
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token de autenticação não fornecido.');
  });

  it('(SEG-01) [Sucesso] Deve autenticar, definir cookies (auth e csrf)', async () => {
    const response = await request.post('/api/auth/login').send(testUser);

    expect(response.status).toBe(200);
    expect(response.body.usuario.email).toBe(testUser.email);
    
    const cookies = getCookies(response);
    
    // (SEG-01) Verifica cookie HttpOnly 'token'
    expect(cookies.some((cookie: string) => cookie.startsWith('token='))).toBe(true);
    expect(cookies.some((cookie: string) => cookie.includes('HttpOnly'))).toBe(true);
    expect(cookies.some((cookie: string) => cookie.includes('SameSite=Strict'))).toBe(true);
    
    // (SEG-02) Verifica cookie Não-HttpOnly 'csrf-token'
    const csrfToken = cookies.find(c => c.startsWith('csrf-token='));
    expect(csrfToken).toBeDefined();
    expect(csrfToken).not.toContain('HttpOnly');
    expect(csrfToken).toContain('SameSite=Strict');
  });

  it('(SEG-01) [Sucesso] Deve acessar rota protegida (GET) após login (com cookie)', async () => {
    // 1. Login para obter o cookie
    const loginRes = await request.post('/api/auth/login').send(testUser);
    const cookies = getCookies(loginRes);

    // 2. Acessar rota protegida
    const response = await request.get('/api/usuarios').set('Cookie', cookies);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.dados)).toBe(true);
  });

  it('(SEG-02) [Falha] Deve falhar (403) ao acessar rota (POST) sem header CSRF', async () => {
    // 1. Login
    const loginRes = await request.post('/api/auth/login').send(testUser);
    const cookies = getCookies(loginRes);

    // 2. Tentar POST (rota protegida) apenas com cookie de auth
    const response = await request.post('/api/categorias')
      .set('Cookie', cookies)
      .send({ nome: 'Categoria CSRF Fail' });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Token CSRF ausente');
  });

  it('(SEG-02) [Sucesso] Deve acessar rota (POST) com cookie de auth e header CSRF', async () => {
    // 1. Login
    const loginRes = await request.post('/api/auth/login').send(testUser);
    const cookies = getCookies(loginRes);
    const csrfToken = getCsrfToken(cookies);

    expect(csrfToken).toBeDefined();

    // 2. Tentar POST (rota protegida) com auth E header CSRF
    const response = await request.post('/api/categorias')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken!) // Envia o header (SEG-02)
      .send({ nome: 'Categoria CSRF Success' });

    expect(response.status).toBe(201); // 201 Created
    expect(response.body.nome).toBe('Categoria CSRF Success');
    
    // Limpeza
    await prisma.categoria.delete({ where: { id: response.body.id } });
  });

  it('(SEG-01) [Sucesso] Deve deslogar e limpar os cookies', async () => {
    // 1. Login
    const loginRes = await request.post('/api/auth/login').send(testUser);
    const cookie = getCookies(loginRes);

    // 2. Logout
    const logoutRes = await request.post('/api/auth/logout').set('Cookie', cookie);
    
    expect(logoutRes.status).toBe(200);
    
    // Verificar se os cookies foram expirados
    const clearedCookies = getCookies(logoutRes);
    expect(clearedCookies.some((c: string) => c.includes('token=;'))).toBe(true);
    expect(clearedCookies.some((c: string) => c.includes('csrf-token=;'))).toBe(true);
    expect(clearedCookies.some((c: string) => c.includes('Max-Age=-1'))).toBe(true);
  });
  
  it('(SEG-03) [Sucesso] Deve incluir headers de segurança (Helmet)', async () => {
    const response = await request.get('/');
    
    expect(response.status).toBe(200);
    expect(response.headers['x-dns-prefetch-control']).toBe('off');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-download-options']).toBe('noopen');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['x-xss-protection']).toBe('0'); // (Correto, CSP substitui)
    expect(response.headers['strict-transport-security']).toBeDefined();
  });
});

