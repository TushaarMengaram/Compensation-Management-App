import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { SalaryRecord } from '../models/SalaryRecord.js';
import { ReviewCycle } from '../models/ReviewCycle.js';
import { asyncHandler, sendError } from '../utils/http.js';
import { sumApprovedCostsForCycle, sumPendingCostsForCycle } from '../services/budgetService.js';
import { closeReviewCycle } from '../services/cycleCloseService.js';

export const createCycleValidators = [
  body('title').trim().notEmpty().withMessage('Cycle title is required'),
  body('effectiveDate').isISO8601().withMessage('effectiveDate must be a valid date'),
  body('totalBudget').isFloat({ gt: 0 }).withMessage('totalBudget must be greater than 0'),
];

export const listEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find({ role: 'employee' })
    .select('name email createdAt')
    .sort({ name: 1 })
    .lean();

  const ids = employees.map((e) => e._id);
  const salaries = await SalaryRecord.find({ employee: { $in: ids } })
    .sort({ effectiveDate: -1 })
    .lean();

  const latestByEmployee = new Map();
  for (const s of salaries) {
    const key = s.employee.toString();
    if (!latestByEmployee.has(key)) {
      latestByEmployee.set(key, s);
    }
  }

  const payload = employees.map((e) => {
    const s = latestByEmployee.get(e._id.toString());
    return {
      id: e._id,
      name: e.name,
      email: e.email,
      createdAt: e.createdAt,
      currentSalary: s?.currentSalary ?? null,
      salaryEffectiveDate: s?.effectiveDate ?? null,
    };
  });

  return res.json({ employees: payload });
});

export const createReviewCycle = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }
  const { title, effectiveDate, totalBudget } = req.body;

  const cycle = await ReviewCycle.create({
    title,
    effectiveDate: new Date(effectiveDate),
    totalBudget: Number(totalBudget),
    status: 'Open',
    createdBy: req.user._id,
  });

  return res.status(201).json({ cycle });
});

export const listReviewCycles = asyncHandler(async (req, res) => {
  const cycles = await ReviewCycle.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .lean();
  return res.json({ cycles });
});

export const closeReviewCycleHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const result = await closeReviewCycle(id);
    if (result.alreadyClosed) {
      return res.json({ message: 'Cycle was already closed', cycle: result.cycle });
    }
    return res.json({
      message: 'Cycle closed and approved changes applied',
      cycle: result.cycle,
      appliedCount: result.appliedCount,
    });
  } catch (e) {
    const status = e.statusCode || 500;
    return sendError(res, status, e.message);
  }
});

export const adminDashboardStats = asyncHandler(async (req, res) => {
  const cycleId = req.query.cycleId;
  if (!cycleId) {
    return sendError(res, 400, 'cycleId query parameter is required');
  }

  const cycle = await ReviewCycle.findById(cycleId);
  if (!cycle) {
    return sendError(res, 404, 'Review cycle not found');
  }

  const [approvedAmount, pendingAmount] = await Promise.all([
    sumApprovedCostsForCycle(cycle._id),
    sumPendingCostsForCycle(cycle._id),
  ]);

  const remaining = cycle.totalBudget - approvedAmount;

  return res.json({
    cycleId: cycle._id,
    title: cycle.title,
    status: cycle.status,
    totalBudget: cycle.totalBudget,
    approvedAmount,
    pendingAmount,
    remainingBudget: remaining,
  });
});
