import express, { Router } from 'express';
import * as petsController from '../controllers/petsController';
import { authenticate, authorize } from '../middleware/auth';

const router: Router = express.Router();

router.use(authenticate);

router.get('/', petsController.getPets);
router.post('/', authorize('owner', 'staff'), petsController.createPet);
router.get('/:id', petsController.getPetById);
router.put('/:id', authorize('owner', 'staff'), petsController.updatePet);
router.delete('/:id', authorize('owner', 'staff'), petsController.deletePet);

export default router;
