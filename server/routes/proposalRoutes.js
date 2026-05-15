import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  createProposal,
  updateProposal,
  deleteProposal,
  approveProposal,
  rejectProposal,
  listProposals,
  createProposalValidators,
  updateProposalValidators,
  decisionValidators,
  listProposalQueryValidators,
} from '../controllers/proposalController.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', listProposalQueryValidators, listProposals);
router.post('/', createProposalValidators, createProposal);
router.patch('/:id', updateProposalValidators, updateProposal);
router.delete('/:id', deleteProposal);
router.post('/:id/approve', decisionValidators, approveProposal);
router.post('/:id/reject', decisionValidators, rejectProposal);

export default router;
