import { ReviewCycle } from '../models/ReviewCycle.js';
import { Proposal } from '../models/Proposal.js';
import { SalaryRecord } from '../models/SalaryRecord.js';
import { SalaryHistory } from '../models/SalaryHistory.js';

export async function closeReviewCycle(cycleId) {
  const cycle = await ReviewCycle.findById(cycleId);
  if (!cycle) {
    const err = new Error('Review cycle not found');
    err.statusCode = 404;
    throw err;
  }
  if (cycle.status === 'Closed') {
    return { alreadyClosed: true, cycle };
  }

  const proposals = await Proposal.find({ cycle: cycle._id });
  const pending = proposals.filter((p) => p.status === 'Proposed');
  if (pending.length > 0) {
    const count = pending.length;
    const err = new Error(
      `Cannot close cycle: ${count} proposal${count === 1 ? '' : 's'} still awaiting a decision.`
    );
    err.statusCode = 409;
    err.details = { pendingCount: count };
    throw err;
  }

  const approved = proposals
    .filter((p) => p.status === 'Approved')
    .sort((a, b) => a.createdAt - b.createdAt);

  const effectiveDate = cycle.effectiveDate;

  for (const proposal of approved) {
    const employeeId = proposal.employee;
    const previous = await SalaryRecord.findOne({ employee: employeeId }).sort({
      effectiveDate: -1,
    });
    const previousSalary = previous?.currentSalary ?? proposal.currentSalarySnapshot;

    await SalaryRecord.findOneAndUpdate(
      { employee: employeeId },
      {
        $set: {
          employee: employeeId,
          currentSalary: proposal.proposedNewSalary,
          effectiveDate,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await SalaryHistory.create({
      employee: employeeId,
      proposal: proposal._id,
      changeType: proposal.changeType,
      previousSalary,
      newSalary: proposal.proposedNewSalary,
      effectiveDate,
      appliedAt: new Date(),
    });
  }

  cycle.status = 'Closed';
  await cycle.save();

  return { alreadyClosed: false, cycle, appliedCount: approved.length };
}
