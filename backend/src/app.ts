// backend/src/app.ts
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/errorMiddleware';
import { csrfMiddleware } from './middlewares/csrfMiddleware'; // Proteção CSRF

// Importar rotas
import authRoutes from './routes/authRoutes';
import usuariosRoutes from './routes/usuariosRoutes';
import categoriasRoutes from './routes/categoriasRoutes';
import produtosRoutes from './routes/produtosRoutes';
import pedidosRoutes from './routes/pedidosRoutes';
import relatoriosRoutes from './routes/relatoriosRoutes';
// Adicionar rota para perfil do usuário (UX-03)
// import profileRoutes from './routes/profileRoutes'; // Exemplo, precisa ser criado

const app = express();

// --- Configuração de CORS (Atualizada) ---
app.use(cors({
  origin: env.FRONTEND_ORIGIN, // Usa a variável de ambiente
  credentials: true, // Permite envio de cookies (SEG-01)
}));

// --- Middlewares Globais ---
app.use(helmet()); // Headers de segurança (SEG-03)
app.use(express.json());
app.use(cookieParser(env.COOKIE_SECRET)); // Usa secret para cookies assinados se necessário (SEG-01/SEG-02)

// --- Rate Limiting (PERF-04) ---
// Limiter mais rigoroso para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limite de 10 requisições por IP para /auth
  message: 'Muitas tentativas de autenticação originadas deste IP. Tente novamente após 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter padrão para o resto da API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: 'Muitas requisições originadas deste IP, tente novamente após 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Rotas da API ---
app.get('/', (req, res) => {
  res.status(200).json({ status: `API Pão do Céu v${process.env.npm_package_version || '?.?.?'} Operacional` });
});

// Rotas de Autenticação (NÃO usam CSRF, usam limiter específico)
app.use('/api/auth', authLimiter, authRoutes);

// Aplicar limiter geral e proteção CSRF a todas as outras rotas da API
app.use('/api', apiLimiter, csrfMiddleware); // Proteção CSRF (SEG-02)

// Rotas protegidas (CSRF + Auth + Rate Limit geral)
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/relatorios', relatoriosRoutes);
// Adicionar rota para perfil do usuário (UX-03)
// app.use('/api/profile', profileRoutes); // Exemplo, precisa ser criado

// --- Error Handling ---
// Deve vir depois de todas as rotas
app.use(errorMiddleware);

export { app };
