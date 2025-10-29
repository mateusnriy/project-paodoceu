// backend/src/routes/pedidosRoutes.ts
import { Router } from 'express';
import { PedidosController } from '../controllers/pedidosController';
import { PedidosService } from '../services/pedidosService'; // (CORREÇÃO ERRO 4) Importar
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';
import { validate } from '../middlewares/validateMiddleware';
import {
  criarPedidoSchema,
  processarPagamentoSchema,
  obterPedidoSchema,
  alterarStatusPedidoSchema,
} from '../validations/pedidoValidation';

const router = Router();

// (CORREÇÃO ERRO 4) Instanciar serviço e injetar no controller
const pedidosService = new PedidosService();
const pedidosController = new PedidosController(pedidosService);

// Rota pública para o Display de Clientes
router.get('/display', pedidosController.listarDisplay);

// Rotas abaixo exigem autenticação
router.use(authMiddleware);

router.get('/', pedidosController.listarTodos);
router.get('/prontos', pedidosController.listarPedidosProntos);

router.get(
  '/:id',
  validate(obterPedidoSchema),
  pedidosController.obterPorId,
);

// Rotas de Atendente
router.post(
  '/',
  roleMiddleware([
    PerfilUsuario.ATENDENTE,
    PerfilUsuario.ADMINISTRADOR,
    PerfilUsuario.MASTER,
  ]),
  validate(criarPedidoSchema),
  pedidosController.criar,
);

router.post(
  '/:id/pagamento',
  roleMiddleware([
    PerfilUsuario.ATENDENTE,
    PerfilUsuario.ADMINISTRADOR,
    PerfilUsuario.MASTER,
  ]),
  validate(processarPagamentoSchema),
  pedidosController.processarPagamento,
);

router.patch(
  '/:id/entregar',
  roleMiddleware([
    PerfilUsuario.ATENDENTE,
    PerfilUsuario.ADMINISTRADOR,
    PerfilUsuario.MASTER,
  ]),
  validate(alterarStatusPedidoSchema),
  pedidosController.marcarComoEntregue,
);

// Rota de Admin (Cancelar pedido)
router.patch(
  '/:id/cancelar',
  roleMiddleware([PerfilUsuario.ADMINISTRADOR, PerfilUsuario.MASTER]),
  validate(alterarStatusPedidoSchema),
  pedidosController.cancelar,
);

export default router;
