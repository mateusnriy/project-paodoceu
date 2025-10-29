import { Router } from 'express';
import { RelatoriosController } from '../controllers/relatoriosController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';

const router = Router();
const relatoriosController = new RelatoriosController();

router.use(authMiddleware);

router.use(
  roleMiddleware([PerfilUsuario.ADMINISTRADOR]),
);

router.get('/vendas', (req, res) =>
  relatoriosController.relatorioDeVendas(req, res),
);

router.get('/pedidos/:id/comprovante', (req, res) => 
  relatoriosController.gerarComprovante(req, res)
);

export default router;
