import mongoose from 'mongoose';

const salaryHistorySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
    },
    changeType: { type: String, required: true },
    previousSalary: { type: Number, required: true, min: 0 },
    newSalary: { type: Number, required: true, min: 0 },
    effectiveDate: { type: Date, required: true },
    appliedAt: { type: Date, required: true },
  },
  { timestamps: false }
);

function blockMutation(next) {
  const err = new Error('Salary history records are immutable');
  err.statusCode = 403;
  next(err);
}

salaryHistorySchema.pre('findOneAndUpdate', blockMutation);
salaryHistorySchema.pre('updateOne', blockMutation);
salaryHistorySchema.pre('updateMany', blockMutation);
salaryHistorySchema.pre('replaceOne', blockMutation);
salaryHistorySchema.pre('deleteOne', blockMutation);
salaryHistorySchema.pre('deleteMany', blockMutation);
salaryHistorySchema.pre('remove', blockMutation);

export const SalaryHistory = mongoose.model('SalaryHistory', salaryHistorySchema);
