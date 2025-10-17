import { Router } from 'express';
import { RelatoriosController } from '../controllers/relatoriosController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';

const router = Router();
const relatoriosController = new RelatoriosController();

router.use(roleMiddleware([PerfilUsuario.ADMINISTRADOR]));

router.get('/pedidos/:id/comprovante', relatoriosController.gerarComprovante);

router.get('/vendas', relatoriosController.relatorioDeVendas);

export default router;
