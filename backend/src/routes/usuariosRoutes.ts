import { Router } from 'express';
import { UsuariosController } from '../controllers/usuariosController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { PerfilUsuario } from '@prisma/client';
import { validate } from '../middlewares/validateMiddleware';
import { criarUsuarioSchema, atualizarUsuarioSchema } from '../validations/usuarioValidation';

const router = Router();
const usuariosController = new UsuariosController();

router.use(authMiddleware);
router.use(roleMiddleware([PerfilUsuario.ADMINISTRADOR]));

router.get('/', usuariosController.listarTodos);

router.get('/:id', usuariosController.obterPorId);

router.post('/', validate(criarUsuarioSchema), usuariosController.criar);

router.put('/:id', validate(atualizarUsuarioSchema), usuariosController.atualizar);

router.delete('/:id', usuariosController.deletar);

export default router;
