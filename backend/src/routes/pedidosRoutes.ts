import { Router } from 'express';
import { PedidosController } from '../controllers/pedidosController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';
import { validate } from '../middlewares/validateMiddleware';
import { criarPedidoSchema, processarPagamentoSchema } from '../validations/pedidoValidation';

const router = Router();
const pedidosController = new PedidosController();

router.get('/display', pedidosController.listarDisplay);
router.get('/', authMiddleware, pedidosController.listarTodos);
router.get('/prontos', authMiddleware, pedidosController.listarPedidosProntos);
router.get('/:id', authMiddleware, pedidosController.obterPorId);
router.post('/', authMiddleware, roleMiddleware([PerfilUsuario.ATENDENTE, PerfilUsuario.ADMINISTRADOR]), validate(criarPedidoSchema), pedidosController.criar);
router.post('/:id/pagamento', authMiddleware, roleMiddleware([PerfilUsuario.ATENDENTE, PerfilUsuario.ADMINISTRADOR]), validate(processarPagamentoSchema), pedidosController.processarPagamento);
router.patch('/:id/entregar', authMiddleware, roleMiddleware([PerfilUsuario.ATENDENTE, PerfilUsuario.ADMINISTRADOR]), pedidosController.marcarComoEntregue);
router.patch('/:id/cancelar', authMiddleware, roleMiddleware([PerfilUsuario.ADMINISTRADOR]), pedidosController.cancelar);

export default router;
