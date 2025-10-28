import { Router } from 'express';
import { PedidosController } from '../controllers/pedidosController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { criarPedidoSchema, processarPagamentoSchema } from '../validations/pedidoValidation';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';

const router = Router();
const pedidosController = new PedidosController();

// Rota pública para o display do cliente - NÃO requer auth nem CSRF
router.get('/display', (req, res) => pedidosController.listarDisplay(req, res)); // <<< ADICIONADO E CORRIGIDO CHAMADA

// --- Middlewares para rotas protegidas abaixo ---
router.use(authMiddleware);

// --- Rotas autenticadas ---
router.get('/', (req, res) => pedidosController.listarTodos(req, res));
router.get('/prontos', (req, res) => pedidosController.listarPedidosProntos(req, res));
router.get('/:id', (req, res) => pedidosController.obterPorId(req, res));

router.post('/', validate(criarPedidoSchema), (req, res) => pedidosController.criar(req, res));

// A rota /pagar agora é POST e valida o schema
router.post('/:id/pagar', validate(processarPagamentoSchema), (req, res) => pedidosController.processarPagamento(req, res));

router.patch('/:id/entregar', (req, res) => pedidosController.marcarComoEntregue(req, res));

// Cancelar pedido requer perfil de ADMINISTRADOR
router.patch('/:id/cancelar', roleMiddleware([PerfilUsuario.ADMINISTRADOR]), (req, res) => pedidosController.cancelar(req, res));

export default router;