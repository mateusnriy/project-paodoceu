import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet'; // <--- (SEG-03)
import cookieParser from 'cookie-parser'; // <--- (SEG-01)
import { env } from './config/env';
import { errorMiddleware } from './middlewares/errorMiddleware';
import { csrfMiddleware } from './middlewares/csrfMiddleware'; // <--- (SEG-02)

// Importar rotas
import authRoutes from './routes/authRoutes';
import usuariosRoutes from './routes/usuariosRoutes';
import categoriasRoutes from './routes/categoriasRoutes';
import produtosRoutes from './routes/produtosRoutes';
import pedidosRoutes from './routes/pedidosRoutes';
import relatoriosRoutes from './routes/relatoriosRoutes';

const app = express();

// --- Configuração de CORS (Atualizada) ---
// Deve permitir credenciais (cookies) da origem do frontend
app.use(cors({
  origin: env.NODE_ENV === 'development'
    ? 'http://localhost:5173' // Origem do Vite
    : 'https://seu-dominio-de-producao.com', // TODO: Atualizar em produção
  credentials: true, // <--- (SEG-01) Permite envio de cookies
}));

// --- Middlewares Globais (Atualizados) ---
app.use(helmet()); // <--- (SEG-03) Adiciona headers de segurança
app.use(express.json());
app.use(cookieParser()); // <--- (SEG-01) Habilita parse de cookies

// Rate limiting (RN09 - já existia, mantido)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: 'Muitas requisições originadas deste IP, tente novamente após 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Rotas da API ---
app.get('/', (req, res) => {
  res.status(200).json({ status: 'API Pão do Céu v2.2 Operacional' });
});

// Rotas de Autenticação (NÃO usam CSRF, pois elas *definem* os tokens)
app.use('/api/auth', authRoutes);

// Aplicar proteção CSRF a todas as outras rotas da API
app.use('/api', csrfMiddleware); // <--- (SEG-02)

// Rotas protegidas (CSRF + Auth)
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// --- Error Handling ---
// Deve vir depois das rotas
app.use(errorMiddleware);

export { app };

