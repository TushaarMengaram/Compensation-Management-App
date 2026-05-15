import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { getMySalary, getMySalaryHistory } from '../controllers/employeeController.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('employee'));

router.get('/me/salary', getMySalary);
router.get('/me/salary-history', getMySalaryHistory);

export default router;
