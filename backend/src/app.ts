import 'express-async-errors';
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit'; // <<< Importar
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/usuariosRoutes';
import categoriasRoutes from './routes/categoriasRoutes';
import produtosRoutes from './routes/produtosRoutes';
import pedidosRoutes from './routes/pedidosRoutes';
import relatoriosRoutes from './routes/relatoriosRoutes';
import { errorMiddleware } from './middlewares/errorMiddleware';
import logger from './lib/logger'; // Importar logger para o handler

const app: Application = express();

// --- Middlewares Essenciais ---
app.use(cors()); // Habilita CORS para todas as origens (ajustar em produção se necessário)
app.use(express.json()); // Parser para JSON bodies

// --- Rate Limiter ---
// Aplicar um limite geral mais flexível a todas as rotas
const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // Janela de 15 minutos
	max: 200, // Limite de 200 requisições por IP por janela
	message: 'Muitas requisições originadas deste IP, tente novamente após 15 minutos.',
  standardHeaders: true, // Retorna info do limite nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  handler: (req, res, next, options) => { // Logar quando o limite for atingido
      logger.warn(`Rate limit excedido para IP ${req.ip}`, { limit: options.max, windowMs: options.windowMs, path: req.path });
      res.status(options.statusCode).send(options.message);
  },
});
app.use(generalLimiter); // Aplicar a todas as rotas

// Aplicar um limite mais estrito especificamente para rotas de autenticação
const authLimiter = rateLimit({
	windowMs: 10 * 60 * 1000, // Janela de 10 minutos
	max: 10, // Limite de 10 tentativas por IP por janela
	message: 'Muitas tentativas de login/registro deste IP, tente novamente após 10 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => { // Logar quando o limite for atingido
      logger.warn(`Auth Rate limit excedido para IP ${req.ip}`, { limit: options.max, windowMs: options.windowMs, path: req.path });
      res.status(options.statusCode).send(options.message);
  },
});
// Aplicar antes das rotas de autenticação
app.use('/api/auth', authLimiter);

// --- Rotas da API ---
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'API do sistema Pão do Céu está no ar!',
    status: 'OK',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// --- Middleware de Erro (Deve ser o último) ---
app.use(errorMiddleware);

export default app;
