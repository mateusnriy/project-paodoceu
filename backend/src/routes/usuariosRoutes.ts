// src/routes/usuarios.routes.ts
import { Router } from 'express';
import { UsuariosController } from '../controllers/usuarios.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import { PerfilUsuario } from '@prisma/client';
import { validate } from '../middlewares/validate.middleware'; 
import { criarUsuarioSchema } from '../validations/usuario.validation'; 

const router = Router();
const usuariosController = new UsuariosController();

// Aplicando middlewares de autenticação e autorização em todas as rotas de usuários
router.use(authMiddleware);
router.use(roleMiddleware(PerfilUsuario.ADMINISTRADOR));

// GET /api/usuarios - Listar todos os usuários (Apenas Admin)
router.get('/', usuariosController.listarTodos);

// GET /api/usuarios/:id - Obter um usuário por ID (Apenas Admin)
router.get('/:id', usuariosController.obterPorId);

// POST /api/usuarios - Criar um novo usuário (Apenas Admin)
router.post('/', validate(criarUsuarioSchema), usuariosController.criar);

// PUT /api/usuarios/:id - Atualizar um usuário (Apenas Admin)
router.put('/:id', usuariosController.atualizar);

// DELETE /api/usuarios/:id - Deletar um usuário (Apenas Admin)
router.delete('/:id', usuariosController.deletar);

export default router;
