import mongoose from 'mongoose';

const salaryRecordSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currentSalary: { type: Number, required: true, min: 0 },
    effectiveDate: { type: Date, required: true },
  },
  { timestamps: true }
);

salaryRecordSchema.index({ employee: 1, effectiveDate: -1 });

export const SalaryRecord = mongoose.model('SalaryRecord', salaryRecordSchema);
