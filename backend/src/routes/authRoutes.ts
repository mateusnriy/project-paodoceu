import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';
import { validate } from '../middlewares/validateMiddleware';
import { loginSchema, registrarSchema } from '../validations/authValidation';
import { authMiddleware } from '../middlewares/authMiddleware'; // Importar

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.get('/check-first', (req, res) => authController.checkFirst(req, res));
router.post('/login', validate(loginSchema), (req, res) => authController.login(req, res));
router.post('/register', validate(registrarSchema), (req, res) => authController.registrar(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

router.get('/me', authMiddleware, (req, res) => {
  res.status(200).json(req.usuario);
});

export default router;

