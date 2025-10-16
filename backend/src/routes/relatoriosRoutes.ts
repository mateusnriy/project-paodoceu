// src/routes/relatorios.routes.ts
import { Router } from 'express';
import { RelatoriosController } from '../controllers/relatorios.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { PerfilUsuario } from '@prisma/client';

const router = Router();
const relatoriosController = new RelatoriosController();

// Todas as rotas de relatórios exigem autenticação e perfil de ADMINISTRADOR
router.use(authMiddleware);
router.use(roleMiddleware(PerfilUsuario.ADMINISTRADOR));

// Rota para gerar o comprovante de um pedido para impressão
router.get('/pedidos/:id/comprovante', relatoriosController.gerarComprovante);

// Rota para o relatório de vendas
router.get('/vendas', relatoriosController.relatorioDeVendas);

export default router;
