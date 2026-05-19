import express, { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';

const router: Router = express.Router();

router.post('/register', optionalAuthenticate, authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/logout', authenticate, authController.logout);
router.get('/clients', authenticate, authController.listClients);

// Staff-only user management
router.get('/users', authenticate, authorize('staff'), authController.listUsers);
router.put('/users/:id', authenticate, authorize('staff'), authController.updateUser);
router.delete('/users/:id', authenticate, authorize('staff'), authController.deleteUser);

export default router;
