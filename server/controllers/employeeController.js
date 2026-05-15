import { SalaryRecord } from '../models/SalaryRecord.js';
import { SalaryHistory } from '../models/SalaryHistory.js';
import { asyncHandler } from '../utils/http.js';

export const getMySalary = asyncHandler(async (req, res) => {
  const record = await SalaryRecord.findOne({ employee: req.user._id }).sort({
    effectiveDate: -1,
  });
  if (!record) {
    return res.json({ salary: null });
  }
  return res.json({
    salary: {
      currentSalary: record.currentSalary,
      effectiveDate: record.effectiveDate,
      updatedAt: record.updatedAt,
    },
  });
});

export const getMySalaryHistory = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    SalaryHistory.find({ employee: req.user._id })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('proposal', 'changeType status cycle')
      .lean(),
    SalaryHistory.countDocuments({ employee: req.user._id }),
  ]);

  return res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});
