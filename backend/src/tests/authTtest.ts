import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../app'; // Importa o app Express
import { prisma } from '../lib/prisma';
import { Server } from 'http';
import { PerfilUsuario } from '@prisma/client';

let server: Server;
// <<< CORREÇÃO 1: O tipo correto da variável é 'TestAgent' conforme o log de erro
let request: supertest.TestAgent<supertest.Test>;

// <<< CORREÇÃO 2: A função agora aceita o tipo 'string[]'
function getCsrfToken(cookiesHeader: string[]): string | null {
  if (!cookiesHeader || cookiesHeader.length === 0) return null; // Adicionado verificação de array vazio

  // cookiesHeader já é um array
  const csrfCookie = cookiesHeader.find(cookie => cookie.startsWith('csrf-token='));
  
  if (!csrfCookie) return null;

  // Ex: "csrf-token=abcde12345; Path=/;..."
  return csrfCookie.split(';')[0].split('=')[1];
}

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
  request = supertest(server); // <<< Esta linha agora é válida com o tipo TestAgent
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
    expect(response.status).toBe(401); // 401 Unauthorized
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
    // Garante que é um array para a verificação com .some()
    const cookies = Array.isArray(cookiesHeader) ? cookiesHeader : [cookiesHeader];

    expect(cookies.some((cookie: string) => cookie.startsWith('token='))).toBe(true);
    expect(cookies.some((cookie: string) => cookie.includes('HttpOnly'))).toBe(true);
    expect(cookies.some((cookie: string) => cookie.startsWith('csrf-token='))).toBe(true);
  });

  it('deve acessar rota protegida (GET) após login (com cookie)', async () => {
    // 1. Login para obter o cookie
    const loginRes = await request.post('/api/auth/login').send({
      email: 'admin@teste.com',
      senha: '123456',
    });
    
    const cookieHeader = loginRes.headers['set-cookie'];
    // <<< CORREÇÃO 3: Garante que 'cookieArray' é sempre 'string[]'
    const cookieArray = Array.isArray(cookieHeader) ? cookieHeader : (cookieHeader ? [cookieHeader] : []);


    // 2. Acessar rota protegida (GET é isento de CSRF)
    const response = await request.get('/api/usuarios')
      .set('Cookie', cookieArray); // <<< Passa o array garantido

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true); // O service retorna { data: [], meta: {} }
  });

  it('deve deslogar e limpar os cookies', async () => {
    // 1. Login
    const loginRes = await request.post('/api/auth/login').send({
      email: 'admin@teste.com',
      senha: '123456',
    });
    const cookieHeader = loginRes.headers['set-cookie'];
    const cookieArray = Array.isArray(cookieHeader) ? cookieHeader : (cookieHeader ? [cookieHeader] : []);


    // 2. Logout
    const logoutRes = await request.post('/api/auth/logout')
      .set('Cookie', cookieArray); // <<< Passa o array garantido
    
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

describe('Fluxo de Segurança CSRF (CHANGE-SEG-02)', () => {

  // <<< CORREÇÃO 4: 'adminCookies' deve ser 'string[]' e inicializado
  let adminCookies: string[] = [];
  let csrfTokenValue: string | null;

  // 1. Fazer login uma vez para obter os cookies
  beforeAll(async () => {
    const loginRes = await request.post('/api/auth/login').send({
      email: 'admin@teste.com',
      senha: '123456',
    });
    // <<< CORREÇÃO 5: Garante que 'adminCookies' seja sempre 'string[]'
    const cookiesHeader = loginRes.headers['set-cookie'];
    adminCookies = Array.isArray(cookiesHeader) ? cookiesHeader : (cookiesHeader ? [cookiesHeader] : []);
    
    csrfTokenValue = getCsrfToken(adminCookies); // Passa o array garantido
  });

  it('deve falhar ao tentar POST (método inseguro) sem o header X-CSRF-Token', async () => {
    const novoUsuarioPayload = {
      nome: 'CSRF Test User 1',
      email: 'csrf1@teste.com',
      senha: 'password123',
      perfil: PerfilUsuario.ATENDENTE
    };

    // <<< CORREÇÃO 6: 'adminCookies' agora é 'string[]' e corresponde à assinatura .set()
    const response = await request.post('/api/usuarios')
      .set('Cookie', adminCookies) // 1. Autenticado (passa authMiddleware)
      // 2. Sem o header X-CSRF-Token (falha csrfMiddleware)
      .send(novoUsuarioPayload);

    expect(response.status).toBe(403); // 403 Forbidden
    expect(response.body.message).toBe('Token CSRF ausente. Requisição bloqueada.');
  });

  it('deve falhar ao tentar POST (método inseguro) com X-CSRF-Token inválido', async () => {
    const novoUsuarioPayload = {
      nome: 'CSRF Test User 2',
      email: 'csrf2@teste.com',
      senha: 'password123',
      perfil: PerfilUsuario.ATENDENTE
    };

    // <<< CORREÇÃO 6: 'adminCookies' agora é 'string[]'
    const response = await request.post('/api/usuarios')
      .set('Cookie', adminCookies) // 1. Autenticado
      .set('X-CSRF-Token', 'token-falsificado-abc') // 2. Header CSRF inválido
      .send(novoUsuarioPayload);

    expect(response.status).toBe(403); // 403 Forbidden
    expect(response.body.message).toBe('Token CSRF inválido. Requisição bloqueada.');
  });
  
  it('deve ter sucesso ao fazer POST (método inseguro) com o cookie e o header X-CSRF-Token corretos', async () => {
    const novoUsuarioPayload = {
      nome: 'CSRF Test User 3',
      email: 'csrf3@teste.com',
      senha: 'password123',
      perfil: PerfilUsuario.ATENDENTE
    };
    
    // Garantir que o token foi extraído no beforeAll
    expect(csrfTokenValue).toBeTypeOf('string');

    // <<< CORREÇÃO 6: 'adminCookies' agora é 'string[]'
    const response = await request.post('/api/usuarios')
      .set('Cookie', adminCookies) // 1. Autenticado (passa authMiddleware)
      .set('X-CSRF-Token', csrfTokenValue as string) // 2. Header CSRF correto (passa csrfMiddleware)
      .send(novoUsuarioPayload);

    // 201 Created significa que a segurança foi aprovada
    expect(response.status).toBe(201); 
    expect(response.body.email).toBe('csrf3@teste.com');
  });

});
