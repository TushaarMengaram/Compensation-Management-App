import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  listEmployees,
  createReviewCycle,
  listReviewCycles,
  closeReviewCycleHandler,
  createCycleValidators,
  adminDashboardStats,
} from '../controllers/adminController.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/employees', listEmployees);
router.get('/dashboard', adminDashboardStats);
router.post('/review-cycles', createCycleValidators, createReviewCycle);
router.get('/review-cycles', listReviewCycles);
router.post('/review-cycles/:id/close', closeReviewCycleHandler);

export default router;
