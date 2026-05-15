import { body, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Proposal, CHANGE_TYPES_LIST, PROPOSAL_STATUSES_LIST } from '../models/Proposal.js';
import { ReviewCycle } from '../models/ReviewCycle.js';
import { User } from '../models/User.js';
import { SalaryRecord } from '../models/SalaryRecord.js';
import { asyncHandler, sendError } from '../utils/http.js';
import { computeCostOfChange, sumApprovedCostsForCycle } from '../services/budgetService.js';

async function getEmployeeCurrentSalary(employeeId) {
  const record = await SalaryRecord.findOne({ employee: employeeId }).sort({ effectiveDate: -1 });
  return record?.currentSalary ?? 0;
}

export const createProposalValidators = [
  body('employee').isMongoId().withMessage('Valid employee id is required'),
  body('cycle').isMongoId().withMessage('Valid cycle id is required'),
  body('changeType').isIn(CHANGE_TYPES_LIST).withMessage('Invalid change type'),
  body('proposedNewSalary').isFloat({ gt: 0 }).withMessage('proposedNewSalary must be a positive number'),
  body('justification').trim().notEmpty().withMessage('Justification is required'),
];

export const updateProposalValidators = [
  body('changeType').optional().isIn(CHANGE_TYPES_LIST),
  body('proposedNewSalary').optional().isFloat({ gt: 0 }),
  body('justification').optional().trim().notEmpty(),
];

export const decisionValidators = [
  body('decisionNote').optional().isString().isLength({ max: 2000 }),
];

export const listProposalQueryValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('cycle').optional().isMongoId(),
  query('status').optional().isIn(PROPOSAL_STATUSES_LIST),
  query('changeType').optional().isIn(CHANGE_TYPES_LIST),
  query('sort').optional().isIn(['createdAt', 'cost', 'employeeName']),
  query('order').optional().isIn(['asc', 'desc']),
];

export const createProposal = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }

  const { employee: employeeId, cycle: cycleId, changeType, proposedNewSalary, justification } =
    req.body;

  const [cycle, employee] = await Promise.all([
    ReviewCycle.findById(cycleId),
    User.findById(employeeId).select('name role'),
  ]);

  if (!cycle) return sendError(res, 404, 'Review cycle not found');
  if (cycle.status !== 'Open') return sendError(res, 409, 'Cannot add proposals to a closed cycle');
  if (!employee || employee.role !== 'employee') {
    return sendError(res, 400, 'Target must be an employee user');
  }

  const currentSalarySnapshot = await getEmployeeCurrentSalary(employeeId);
  const proposedNum = Number(proposedNewSalary);
  if (proposedNum <= currentSalarySnapshot) {
    return sendError(
      res,
      400,
      'Proposed salary must be greater than the employee current salary'
    );
  }

  const costOfChange = computeCostOfChange(currentSalarySnapshot, proposedNum);

  const proposal = await Proposal.create({
    employee: employeeId,
    cycle: cycleId,
    changeType,
    currentSalarySnapshot,
    proposedNewSalary: proposedNum,
    costOfChange,
    justification: justification.trim(),
    status: 'Proposed',
    proposedBy: req.user._id,
    employeeNameSnapshot: employee.name,
  });

  const populated = await Proposal.findById(proposal._id)
    .populate('employee', 'name email')
    .populate('cycle', 'title status totalBudget')
    .populate('proposedBy', 'name email');

  return res.status(201).json({ proposal: populated });
});

export const updateProposal = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }

  const proposal = await Proposal.findById(req.params.id).populate('cycle');
  if (!proposal) return sendError(res, 404, 'Proposal not found');
  if (proposal.status !== 'Proposed') {
    return sendError(res, 409, 'Only proposals in Proposed status can be updated');
  }
  if (proposal.cycle.status !== 'Open') {
    return sendError(res, 409, 'Cannot update proposals on a closed cycle');
  }

  const { changeType, proposedNewSalary, justification } = req.body;
  if (changeType !== undefined) proposal.changeType = changeType;
  if (justification !== undefined) proposal.justification = justification.trim();

  let baseCurrent = proposal.currentSalarySnapshot;
  if (proposedNewSalary !== undefined) {
    const proposedNum = Number(proposedNewSalary);
    if (proposedNum <= baseCurrent) {
      return sendError(
        res,
        400,
        'Proposed salary must be greater than the employee current salary at proposal time'
      );
    }
    proposal.proposedNewSalary = proposedNum;
    proposal.costOfChange = computeCostOfChange(baseCurrent, proposedNum);
  } else if (changeType !== undefined || justification !== undefined) {
    proposal.costOfChange = computeCostOfChange(
      proposal.currentSalarySnapshot,
      proposal.proposedNewSalary
    );
  }

  const emp = await User.findById(proposal.employee).select('name');
  if (emp) proposal.employeeNameSnapshot = emp.name;

  await proposal.save();

  const populated = await Proposal.findById(proposal._id)
    .populate('employee', 'name email')
    .populate('cycle', 'title status totalBudget')
    .populate('proposedBy', 'name email')
    .populate('decidedBy', 'name email');

  return res.json({ proposal: populated });
});

export const deleteProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id).populate('cycle');
  if (!proposal) return sendError(res, 404, 'Proposal not found');
  if (proposal.status !== 'Proposed') {
    return sendError(res, 409, 'Only proposals in Proposed status can be deleted');
  }
  if (proposal.cycle.status !== 'Open') {
    return sendError(res, 409, 'Cannot delete proposals on a closed cycle');
  }

  await Proposal.deleteOne({ _id: proposal._id });
  return res.json({ message: 'Proposal deleted' });
});

export const approveProposal = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }

  const proposal = await Proposal.findById(req.params.id).populate('cycle');
  if (!proposal) return sendError(res, 404, 'Proposal not found');
  if (proposal.status !== 'Proposed') {
    return sendError(res, 409, 'Only proposed items can be approved');
  }
  if (proposal.cycle.status !== 'Open') {
    return sendError(res, 409, 'Cannot approve proposals on a closed cycle');
  }

  if (proposal.proposedBy.toString() === req.user._id.toString()) {
    return sendError(res, 403, 'You cannot approve a proposal you created');
  }

  const approvedSoFar = await sumApprovedCostsForCycle(proposal.cycle._id);
  const totalAfter = approvedSoFar + proposal.costOfChange;
  if (totalAfter > proposal.cycle.totalBudget) {
    return sendError(
      res,
      409,
      'Approval would exceed the review cycle budget',
      {
        totalBudget: proposal.cycle.totalBudget,
        alreadyApproved: approvedSoFar,
        thisProposalCost: proposal.costOfChange,
      }
    );
  }

  proposal.status = 'Approved';
  proposal.decidedBy = req.user._id;
  proposal.decidedAt = new Date();
  proposal.decisionNote = (req.body.decisionNote || '').trim();
  await proposal.save();

  const populated = await Proposal.findById(proposal._id)
    .populate('employee', 'name email')
    .populate('cycle', 'title status totalBudget')
    .populate('proposedBy', 'name email')
    .populate('decidedBy', 'name email');

  return res.json({ proposal: populated });
});

export const rejectProposal = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }

  const proposal = await Proposal.findById(req.params.id).populate('cycle');
  if (!proposal) return sendError(res, 404, 'Proposal not found');
  if (proposal.status !== 'Proposed') {
    return sendError(res, 409, 'Only proposed items can be rejected');
  }
  if (proposal.cycle.status !== 'Open') {
    return sendError(res, 409, 'Cannot reject proposals on a closed cycle');
  }

  if (proposal.proposedBy.toString() === req.user._id.toString()) {
    return sendError(res, 403, 'You cannot reject a proposal you created');
  }

  proposal.status = 'Rejected';
  proposal.decidedBy = req.user._id;
  proposal.decidedAt = new Date();
  proposal.decisionNote = (req.body.decisionNote || '').trim();
  await proposal.save();

  const populated = await Proposal.findById(proposal._id)
    .populate('employee', 'name email')
    .populate('cycle', 'title status totalBudget')
    .populate('proposedBy', 'name email')
    .populate('decidedBy', 'name email');

  return res.json({ proposal: populated });
});

export const listProposals = asyncHandler(async (req, res) => {
  const v = validationResult(req);
  if (!v.isEmpty()) {
    return sendError(res, 400, 'Invalid query parameters', v.array());
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.cycle) filter.cycle = new mongoose.Types.ObjectId(req.query.cycle);
  if (req.query.status) filter.status = req.query.status;
  if (req.query.changeType) filter.changeType = req.query.changeType;

  const sortField = req.query.sort || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;
  const sort = {};
  if (sortField === 'cost') sort.costOfChange = order;
  else if (sortField === 'employeeName') sort.employeeNameSnapshot = order;
  else sort.createdAt = order;

  const [items, total] = await Promise.all([
    Proposal.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('employee', 'name email')
      .populate('cycle', 'title status totalBudget')
      .populate('proposedBy', 'name email')
      .populate('decidedBy', 'name email')
      .lean(),
    Proposal.countDocuments(filter),
  ]);

  return res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});
