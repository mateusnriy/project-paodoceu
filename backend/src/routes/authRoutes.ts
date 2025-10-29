// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';
import { validate } from '../middlewares/validateMiddleware';
import {
  loginSchema,
  registrarSchema,
  // REMOVIDO: requestPasswordResetSchema, resetPasswordSchema
  updateOwnProfileSchema,
} from '../validations/authValidation';
import { authMiddleware } from '../middlewares/authMiddleware';
import { csrfMiddleware } from '../middlewares/csrfMiddleware';

const router = Router();

const authService = new AuthService();
const authController = new AuthController(authService);

// Rotas públicas
router.get('/check-first', (req, res) => authController.checkFirst(req, res));
router.post('/login', validate(loginSchema), (req, res) =>
  authController.login(req, res),
);
router.post('/register', validate(registrarSchema), (req, res) =>
  authController.registrar(req, res),
);

// REMOVIDO: Rotas de Recuperação de Senha (RF16)

// Rotas abaixo exigem autenticação
router.post('/logout', authMiddleware, csrfMiddleware, (req, res) =>
  authController.logout(req, res),
);

router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json(req.usuario);
});

router.put(
  '/profile',
  authMiddleware,
  csrfMiddleware,
  validate(updateOwnProfileSchema),
  (req, res) => authController.updateOwnProfile(req, res),
);

export default router;
