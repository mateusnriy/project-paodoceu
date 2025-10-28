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

// (NOVA) Rota de Logout (SEG-01)
router.post('/logout', (req, res) => authController.logout(req, res));

// (NOVA) Rota /me (Essencial para o Frontend validar a sessão)
router.get('/me', authMiddleware, (req, res) => {
  // O authMiddleware já validou o cookie e anexou req.usuario
  res.status(200).json(req.usuario);
});

export default router;

