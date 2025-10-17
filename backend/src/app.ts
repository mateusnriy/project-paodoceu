import 'express-async-errors';
import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/usuariosRoutes';
import categoriasRoutes from './routes/categoriasRoutes';
import produtosRoutes from './routes/produtosRoutes';
import pedidosRoutes from './routes/pedidosRoutes';
import relatoriosRoutes from './routes/relatoriosRoutes';
import { errorMiddleware } from './middlewares/errorMiddleware'; 

const app: Application = express();

app.use(cors());
app.use(express.json());

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

app.use(errorMiddleware);

export default app;
