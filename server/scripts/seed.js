import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { SalaryRecord } from '../models/SalaryRecord.js';

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
  const hasSalary = await SalaryRecord.exists({ employee: u._id });
  if (!hasSalary) {
    await SalaryRecord.create({
      employee: u._id,
      currentSalary: 0,
      effectiveDate: new Date(),
    });
  }
}

await mongoose.disconnect();
// eslint-disable-next-line no-console
console.log('Seed complete');
