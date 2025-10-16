import { Router } from 'express';
import { PedidosController } from '../controllers/pedidosController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { criarPedidoSchema, processarPagamentoSchema } from '../validations/pedidoValidation';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';

const router = Router();
const pedidosController = new PedidosController();

router.use(authMiddleware);

router.get('/', pedidosController.listarTodos);
router.get('/prontos', pedidosController.listarPedidosProntos);
router.get('/:id', pedidosController.obterPorId);

router.post('/', validate(criarPedidoSchema), pedidosController.criar);

router.post('/:id/pagar', validate(processarPagamentoSchema), pedidosController.processarPagamento);

// Ações que podem ser feitas por qualquer perfil logado
router.patch('/:id/entregar', pedidosController.marcarComoEntregue);

// Apenas administradores podem cancelar um pedido
router.patch('/:id/cancelar', roleMiddleware([PerfilUsuario.ADMINISTRADOR]), pedidosController.cancelar);

export default router;
