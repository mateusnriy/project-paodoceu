// src/routes/categorias.routes.ts
import { Router } from 'express';
import { CategoriasController } from '../controllers/categorias.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { PerfilUsuario } from '@prisma/client';

const router = Router();
const categoriasController = new CategoriasController();

// Todas as rotas de categorias exigem que o usuário esteja autenticado.
router.use(authMiddleware);

// Listar todas as categorias (acessível para Admin e Atendente)
router.get('/', categoriasController.listarTodas);

// Obter uma categoria por ID (acessível para Admin e Atendente)
router.get('/:id', categoriasController.obterPorId);

// As rotas de criação, atualização e deleção só podem ser acessadas por Administradores.
router.post('/', roleMiddleware(PerfilUsuario.ADMINISTRADOR), categoriasController.criar);
router.put('/:id', roleMiddleware(PerfilUsuario.ADMINISTRADOR), categoriasController.atualizar);
router.delete('/:id', roleMiddleware(PerfilUsuario.ADMINISTRADOR), categoriasController.deletar);

export default router;
