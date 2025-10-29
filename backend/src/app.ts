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


const app = express();

app.use(cors({
  origin: env.FRONTEND_ORIGIN, 
  credentials: true,
}));

app.use(helmet()); 
app.use(express.json());
app.use(cookieParser(env.COOKIE_SECRET)); 

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: 'Muitas tentativas de autenticação originadas deste IP. Tente novamente após 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Muitas requisições originadas deste IP, tente novamente após 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (req, res) => {
  res.status(200).json({ status: `API Pão do Céu v${process.env.npm_package_version || '?.?.?'} Operacional` });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiLimiter, csrfMiddleware); 

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/relatorios', relatoriosRoutes);

app.use(errorMiddleware);

export { app };
