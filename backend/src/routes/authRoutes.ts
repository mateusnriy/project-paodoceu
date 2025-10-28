import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../middlewares/validateMiddleware'; // Importa o middleware de validação
import { loginSchema, registrarSchema } from '../validations/authValidation'; // Importa os schemas de validação

const router = Router();
const authController = new AuthController();

router.get('/check-first', authController.checkFirst);

router.post('/login', validate(loginSchema), authController.login);

router.post('/register', validate(registrarSchema), authController.registrar);

export default router;
