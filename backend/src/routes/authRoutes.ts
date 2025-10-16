// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// POST /api/auth/login - Autenticar um usuário e retornar um token JWT
router.post('/login', authController.login);

// POST /api/auth/register - Registrar um novo usuário (atendente)
router.post('/register', authController.registrar);

export default router;
