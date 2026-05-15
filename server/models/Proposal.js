import mongoose from 'mongoose';

const CHANGE_TYPES = ['Salary Increase', 'Promotion', 'Market Adjustment'];
const PROPOSAL_STATUSES = ['Proposed', 'Approved', 'Rejected'];

const proposalSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReviewCycle',
      required: true,
      index: true,
    },
    changeType: { type: String, enum: CHANGE_TYPES, required: true },
    currentSalarySnapshot: { type: Number, required: true, min: 0 },
    proposedNewSalary: { type: Number, required: true, min: 0 },
    costOfChange: { type: Number, required: true, min: 0 },
    justification: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: PROPOSAL_STATUSES,
      default: 'Proposed',
      index: true,
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decisionNote: { type: String, trim: true, default: '' },
    decidedAt: { type: Date, default: null },
    employeeNameSnapshot: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

proposalSchema.index({ cycle: 1, status: 1, createdAt: -1 });
proposalSchema.index({ cycle: 1, changeType: 1 });
proposalSchema.index({ cycle: 1, costOfChange: 1 });
proposalSchema.index({ cycle: 1, employeeNameSnapshot: 1 });

export const CHANGE_TYPES_LIST = CHANGE_TYPES;
export const PROPOSAL_STATUSES_LIST = PROPOSAL_STATUSES;
export const Proposal = mongoose.model('Proposal', proposalSchema);
