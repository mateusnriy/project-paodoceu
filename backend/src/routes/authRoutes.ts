import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);

router.post('/register', authController.registrar);

export default router;
