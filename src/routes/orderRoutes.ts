import express, { Router } from 'express';
import * as ordersController from '../controllers/ordersController';
import { authenticate, authorize } from '../middleware/auth';

const router: Router = express.Router();

router.use(authenticate);

router.get('/', ordersController.getOrders);
router.post('/', authorize('owner'), ordersController.createOrder);
router.get('/:id', ordersController.getOrderById);
router.put('/:id', ordersController.updateOrder);
router.patch('/:id/status', ordersController.updateOrderStatus);
router.post('/:id/assign-driver', authorize('staff'), ordersController.assignDriver);
router.post('/:id/clarifications', ordersController.requestClarification);
router.post('/:id/clarifications/:clarificationId/respond', ordersController.respondToClarification);

export default router;
