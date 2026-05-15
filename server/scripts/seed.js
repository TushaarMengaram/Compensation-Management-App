import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { SalaryRecord } from '../models/SalaryRecord.js';
import { ReviewCycle } from '../models/ReviewCycle.js';
import { Proposal } from '../models/Proposal.js';
import { SalaryHistory } from '../models/SalaryHistory.js';

const DEMO_CYCLE_TITLE = 'FY2024 Annual Review (Demo)';

const DEMO_EMPLOYEES = [
  {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    password: 'Employee123!',
    currentSalary: 58_000,
  },
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    password: 'Employee123!',
    currentSalary: 72_000,
  },
  {
    name: 'Alex Lee',
    email: 'alex.lee@example.com',
    password: 'Employee123!',
    currentSalary: 91_000,
  },
];

async function upsertAdmin({ email, password, name }) {
  if (!email || !password) return null;
  const hashed = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`Admin already exists: ${email}`);
    return existing;
  }
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: 'admin',
  });
  // eslint-disable-next-line no-console
  console.log(`Created admin: ${email}`);
  return user;
}

async function upsertEmployee({ name, email, password }) {
  const hashed = await bcrypt.hash(password, 10);
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password: hashed,
      role: 'employee',
    });
    // eslint-disable-next-line no-console
    console.log(`Created employee: ${email}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Employee already exists: ${email}`);
  }
  return user;
}

async function ensureSalaryRecord(employeeId, currentSalary, effectiveDate) {
  await SalaryRecord.findOneAndUpdate(
    { employee: employeeId },
    {
      $set: {
        employee: employeeId,
        currentSalary,
        effectiveDate,
      },
    },
    { upsert: true, new: true }
  );
}

async function seedClosedCycleWithHistory(admin1, admin2, employees) {
  const existingCycle = await ReviewCycle.findOne({ title: DEMO_CYCLE_TITLE });
  if (existingCycle) {
    // eslint-disable-next-line no-console
    console.log('Demo review cycle already seeded — skipping history');
    return;
  }

  const effectiveDate = new Date();
  effectiveDate.setMonth(effectiveDate.getMonth() - 6);

  const appliedAt = new Date(effectiveDate);
  appliedAt.setDate(appliedAt.getDate() + 7);

  const cycle = await ReviewCycle.create({
    title: DEMO_CYCLE_TITLE,
    effectiveDate,
    totalBudget: 50_000,
    status: 'Closed',
    createdBy: admin1._id,
  });

  const historyRows = [
    {
      employee: employees[0],
      changeType: 'Market Adjustment',
      previousSalary: 52_000,
      newSalary: 58_000,
      justification: 'Demo seed: aligned with market band for role.',
    },
    {
      employee: employees[1],
      changeType: 'Salary Increase',
      previousSalary: 65_000,
      newSalary: 72_000,
      justification: 'Demo seed: strong performance in prior year.',
    },
    {
      employee: employees[2],
      changeType: 'Promotion',
      previousSalary: 82_000,
      newSalary: 91_000,
      justification: 'Demo seed: promoted to senior individual contributor.',
    },
  ];

  for (const row of historyRows) {
    const costOfChange = row.newSalary - row.previousSalary;
    const proposal = await Proposal.create({
      employee: row.employee._id,
      cycle: cycle._id,
      changeType: row.changeType,
      currentSalarySnapshot: row.previousSalary,
      proposedNewSalary: row.newSalary,
      costOfChange,
      justification: row.justification,
      status: 'Approved',
      proposedBy: admin1._id,
      decidedBy: admin2._id,
      decisionNote: 'Approved (demo seed data)',
      decidedAt: appliedAt,
      employeeNameSnapshot: row.employee.name,
    });

    await SalaryHistory.create({
      employee: row.employee._id,
      proposal: proposal._id,
      changeType: row.changeType,
      previousSalary: row.previousSalary,
      newSalary: row.newSalary,
      effectiveDate,
      appliedAt,
    });

    await ensureSalaryRecord(row.employee._id, row.newSalary, effectiveDate);
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded closed cycle "${DEMO_CYCLE_TITLE}" with salary history`);
}

await connectDatabase();

const admin1 = await upsertAdmin({
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  name: process.env.ADMIN_NAME || 'Admin',
});

const admin2 = await upsertAdmin({
  email: process.env.SECOND_ADMIN_EMAIL,
  password: process.env.SECOND_ADMIN_PASSWORD,
  name: process.env.SECOND_ADMIN_NAME || 'Second Admin',
});

for (const u of [admin1, admin2].filter(Boolean)) {
  await ensureSalaryRecord(u._id, 0, new Date());
}

const seededEmployees = [];
for (const demo of DEMO_EMPLOYEES) {
  const employee = await upsertEmployee(demo);
  seededEmployees.push(employee);
  await ensureSalaryRecord(employee._id, demo.currentSalary, new Date());
}

if (admin1 && admin2 && seededEmployees.length === DEMO_EMPLOYEES.length) {
  await seedClosedCycleWithHistory(admin1, admin2, seededEmployees);
}

await mongoose.disconnect();
// eslint-disable-next-line no-console
console.log('Seed complete');
console.log('Demo employees (password Employee123!):');
for (const demo of DEMO_EMPLOYEES) {
  console.log(`  - ${demo.email} (salary $${demo.currentSalary.toLocaleString()})`);
}
