// src/routes/pedidos.routes.ts
import { Router } from 'express';
import { PedidosController } from '../controllers/pedidosController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const pedidosController = new PedidosController();

// Todas as rotas de pedidos exigem autenticação
router.use(authMiddleware);

// GET /api/pedidos - Listar todos os pedidos
router.get('/', pedidosController.listarTodos);

// GET /api/pedidos/prontos - Listar pedidos prontos para retirada
router.get('/prontos', pedidosController.listarPedidosProntos);

// GET /api/pedidos/:id - Obter um pedido por ID
router.get('/:id', pedidosController.obterPorId);

// POST /api/pedidos - Criar um novo pedido
router.post('/', pedidosController.criar);

// POST /api/pedidos/:id/pagar - Processar o pagamento de um pedido
router.post('/:id/pagar', pedidosController.processarPagamento);

// PATCH /api/pedidos/:id/entregar - Marcar um pedido como entregue
router.patch('/:id/entregar', pedidosController.marcarComoEntregue);

// PATCH /api/pedidos/:id/cancelar - Cancelar um pedido
router.patch('/:id/cancelar', pedidosController.cancelar);


export default router;
