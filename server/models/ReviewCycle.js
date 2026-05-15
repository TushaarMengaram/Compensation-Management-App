import mongoose from 'mongoose';

const reviewCycleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    effectiveDate: { type: Date, required: true },
    totalBudget: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export const ReviewCycle = mongoose.model('ReviewCycle', reviewCycleSchema);
