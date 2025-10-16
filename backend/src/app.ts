// src/app.ts
import 'express-async-errors'; // Importa para capturar erros em rotas assíncronas
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/usuarios.routes';
import categoriasRoutes from './routes/categorias.routes';
import produtosRoutes from './routes/produtos.routes';
import pedidosRoutes from './routes/pedidos.routes';
import relatoriosRoutes from './routes/relatoriosRoutes';
import { errorMiddleware } from './middlewares/error.middleware'; // Importa o novo middleware

// Cria a instância do aplicativo Express
const app: Application = express();

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Rota raiz para verificação de status
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'API do sistema Pão do Céu está no ar!',
    status: 'OK',
  });
});

// Definindo as rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// Middleware de Erro (deve ser o último a ser adicionado)
app.use(errorMiddleware);

export default app;
