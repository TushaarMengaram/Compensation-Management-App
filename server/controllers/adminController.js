import { body, param, query, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { SalaryRecord } from '../models/SalaryRecord.js';
import { SalaryHistory } from '../models/SalaryHistory.js';
import { ReviewCycle } from '../models/ReviewCycle.js';
import { asyncHandler, sendError } from '../utils/http.js';
import { sumApprovedCostsForCycle, sumPendingCostsForCycle } from '../services/budgetService.js';
import { closeReviewCycle } from '../services/cycleCloseService.js';
import { isEffectiveDateInPast } from '../utils/dates.js';

export const createCycleValidators = [
  body('title').trim().notEmpty().withMessage('Cycle title is required'),
  body('effectiveDate')
    .isISO8601()
    .withMessage('effectiveDate must be a valid date')
    .custom((value) => {
      if (isEffectiveDateInPast(value)) {
        throw new Error('Effective date cannot be before today');
      }
      return true;
    }),
  body('totalBudget').isFloat({ gt: 0 }).withMessage('totalBudget must be greater than 0'),
];

export const listEmployeesQueryValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().isLength({ max: 100 }),
];

export const employeeIdParamValidator = [param('id').isMongoId().withMessage('Valid employee id is required')];

export const employeeHistoryQueryValidators = [
  param('id').isMongoId().withMessage('Valid employee id is required'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const listEmployees = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Invalid query parameters', errors.array());
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const search = (req.query.search || '').trim();

  const filter = { role: 'employee' };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [employees, total] = await Promise.all([
    User.find(filter).select('name email createdAt').sort({ name: 1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const ids = employees.map((e) => e._id);
  const salaries =
    ids.length > 0
      ? await SalaryRecord.find({ employee: { $in: ids } })
          .sort({ effectiveDate: -1 })
          .lean()
      : [];

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

  return res.json({
    employees: payload,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

async function findEmployeeOr404(employeeId, res) {
  const employee = await User.findOne({ _id: employeeId, role: 'employee' }).select('name email');
  if (!employee) {
    sendError(res, 404, 'Employee not found');
    return null;
  }
  return employee;
}

export const getEmployeeSalary = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Invalid employee id', errors.array());
  }

  const employee = await findEmployeeOr404(req.params.id, res);
  if (!employee) return;

  const record = await SalaryRecord.findOne({ employee: employee._id }).sort({ effectiveDate: -1 });
  return res.json({
    employee: { id: employee._id, name: employee.name, email: employee.email },
    salary: record
      ? {
          currentSalary: record.currentSalary,
          effectiveDate: record.effectiveDate,
          updatedAt: record.updatedAt,
        }
      : null,
  });
});

export const getEmployeeSalaryHistory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Invalid query parameters', errors.array());
  }

  const employee = await findEmployeeOr404(req.params.id, res);
  if (!employee) return;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    SalaryHistory.find({ employee: employee._id })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('proposal', 'changeType status cycle')
      .lean(),
    SalaryHistory.countDocuments({ employee: employee._id }),
  ]);

  return res.json({
    employee: { id: employee._id, name: employee.name, email: employee.email },
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

export const createReviewCycle = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }
  const { title, effectiveDate, totalBudget } = req.body;

  if (isEffectiveDateInPast(effectiveDate)) {
    return sendError(res, 400, 'Effective date cannot be before today');
  }

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
    return sendError(res, status, e.message, e.details);
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
