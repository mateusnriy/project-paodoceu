import { Router } from 'express';
import { CategoriasController } from '../controllers/categoriasController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';
import { validate } from '../middlewares/validateMiddleware';
import { criarCategoriaSchema, atualizarCategoriaSchema } from '../validations/categoriaValidation';

const router = Router();
const categoriasController = new CategoriasController();

router.use(authMiddleware);
router.get('/', categoriasController.listarTodas); 
router.get('/:id', categoriasController.obterPorId);
router.post('/', roleMiddleware([PerfilUsuario.ADMINISTRADOR]), validate(criarCategoriaSchema), categoriasController.criar);
router.put('/:id', roleMiddleware([PerfilUsuario.ADMINISTRADOR]), validate(atualizarCategoriaSchema), categoriasController.atualizar);
router.delete('/:id', roleMiddleware([PerfilUsuario.ADMINISTRADOR]), categoriasController.deletar);

export default router;
