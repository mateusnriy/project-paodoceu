// src/routes/produtos.routes.ts
import { Router } from 'express';
import { ProdutosController } from '../controllers/produtos.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { PerfilUsuario } from '@prisma/client';

const router = Router();
const produtosController = new ProdutosController();

// Todas as rotas de produtos exigem que o usuário esteja autenticado.
router.use(authMiddleware);

// Listar e obter por ID são acessíveis para todos os usuários autenticados.
router.get('/', produtosController.listarTodos);
router.get('/:id', produtosController.obterPorId);

// Apenas administradores podem criar, editar, deletar e ajustar estoque.
router.post('/', roleMiddleware(PerfilUsuario.ADMINISTRADOR), produtosController.criar);
router.put('/:id', roleMiddleware(PerfilUsuario.ADMINISTRADOR), produtosController.atualizar);
router.patch('/:id/estoque', roleMiddleware(PerfilUsuario.ADMINISTRADOR), produtosController.ajustarEstoque);
router.delete('/:id', roleMiddleware(PerfilUsuario.ADMINISTRADOR), produtosController.deletar);

export default router;
