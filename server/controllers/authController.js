import bcrypt from 'bcryptjs';
import { validationResult, body } from 'express-validator';
import { User } from '../models/User.js';
import { SalaryRecord } from '../models/SalaryRecord.js';
import { signToken } from '../utils/token.js';
import { asyncHandler, sendError } from '../utils/http.js';

export const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return sendError(res, 409, 'Email is already registered');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: 'employee',
  });

  await SalaryRecord.create({
    employee: user._id,
    currentSalary: 0,
    effectiveDate: new Date(),
  });

  const token = signToken({ sub: user._id.toString(), role: user.role });

  return res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return sendError(res, 401, 'Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return sendError(res, 401, 'Invalid email or password');
  }

  const token = signToken({ sub: user._id.toString(), role: user.role });

  return res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});
