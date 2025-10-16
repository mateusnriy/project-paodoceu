// src/routes/produtos.routes.ts
import { Router } from 'express';
import { ProdutosController } from '../controllers/produtosController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';
import { validate } from '../middlewares/validateMiddleware';
import { criarProdutoSchema, atualizarProdutoSchema, ajustarEstoqueSchema } from '../validations/produtoValidation';

const router = Router();
const produtosController = new ProdutosController();

router.use(authMiddleware);

router.get('/', produtosController.listarTodos);

router.get('/:id', produtosController.obterPorId);

router.post('/', roleMiddleware([PerfilUsuario.ADMINISTRADOR]), validate(criarProdutoSchema), produtosController.criar);

router.put('/:id', roleMiddleware([PerfilUsuario.ADMINISTRADOR]), validate(atualizarProdutoSchema), produtosController.atualizar);

router.patch('/:id/estoque', roleMiddleware([PerfilUsuario.ADMINISTRADOR]), validate(ajustarEstoqueSchema), produtosController.ajustarEstoque);

router.delete('/:id', roleMiddleware([PerfilUsuario.ADMINISTRADOR]), produtosController.deletar);

export default router;
