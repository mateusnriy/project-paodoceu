// backend/src/routes/produtosRoutes.ts
import { Router } from 'express';
import { ProdutosController } from '../controllers/produtosController';
import { ProdutosService } from '../services/produtosService';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';
import { validate } from '../middlewares/validateMiddleware';
import {
  listarProdutosSchema,
  obterProdutoSchema,
  criarProdutoSchema,
  atualizarProdutoSchema,
  ajustarEstoqueSchema,
  deletarProdutoSchema,
} from '../validations/produtoValidation';

const router = Router();

// --- Injeção de Dependência ---
// Instanciar o serviço e injetá-lo no controller
const produtosService = new ProdutosService();
const produtosController = new ProdutosController(produtosService);

// --- Middleware de Autenticação ---
// Todas as rotas de produtos exigem autenticação
router.use(authMiddleware);

// --- Definição das Rotas ---

// Listar (Paginado para Admin, Ativos para PDV/Atendente)
// O controller (listarPaginado) diferencia a lógica baseado na query 'pagina'
router.get(
  '/',
  validate(listarProdutosSchema),
  produtosController.listarPaginado,
);

// Rota específica para PDV (embora a / possa lidar com isso)
// Se a lógica fosse separada no controller:
// router.get('/pdv', produtosController.listarTodosAtivos);

// Obter por ID
router.get(
  '/:id',
  validate(obterProdutoSchema),
  produtosController.obterPorId,
);

// Rotas exclusivas de Admin (CRUD e Estoque)
router.use(roleMiddleware([PerfilUsuario.ADMINISTRADOR, PerfilUsuario.MASTER]));

router.post(
  '/',
  validate(criarProdutoSchema),
  produtosController.criar,
);

router.put(
  '/:id',
  validate(atualizarProdutoSchema),
  produtosController.atualizar,
);

// Ajuste rápido de estoque
router.patch(
  '/:id/estoque',
  validate(ajustarEstoqueSchema),
  produtosController.ajustarEstoque,
);

router.delete(
  '/:id',
  validate(deletarProdutoSchema),
  produtosController.deletar,
);

export default router;
