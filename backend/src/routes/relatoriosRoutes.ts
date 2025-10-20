import { Router } from 'express';
import { RelatoriosController } from '../controllers/relatoriosController';
import { authMiddleware } from '../middlewares/authMiddleware'; // <<< Importar authMiddleware
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';

const router = Router();
const relatoriosController = new RelatoriosController();

// <<< CORREÇÃO: Aplicar authMiddleware ANTES de roleMiddleware >>>
router.use(authMiddleware);
router.use(roleMiddleware([PerfilUsuario.ADMINISTRADOR]));

// As rotas agora terão req.usuario definido antes da verificação de role
router.get('/pedidos/:id/comprovante', relatoriosController.gerarComprovante);
router.get('/vendas', relatoriosController.relatorioDeVendas);

export default router;
