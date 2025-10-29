import { Router } from 'express';
import { RelatoriosController } from '../controllers/relatoriosController';
import { RelatoriosService } from '../services/relatoriosService'; // (CORREÇÃO ERRO 7) Importar
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';

const router = Router();

// (CORREÇÃO ERRO 7) Instanciar serviço e injetar no controller
const relatoriosService = new RelatoriosService();
const relatoriosController = new RelatoriosController(relatoriosService);

router.use(authMiddleware);

router.use(
  roleMiddleware([PerfilUsuario.ADMINISTRADOR, PerfilUsuario.MASTER]), // Apenas Admin/Master
);

router.get('/vendas', (req, res) =>
  // (CORREÇÃO ERRO 8) Usar o nome correto do método
  relatoriosController.obterRelatorioVendas(req, res),
);

router.get('/pedidos/:id/comprovante', (req, res) =>
  // (CORREÇÃO ERRO 9) Usar o método implementado no controller
  relatoriosController.gerarComprovante(req, res),
);

export default router;
