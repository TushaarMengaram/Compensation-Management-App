import { Proposal } from '../models/Proposal.js';

export function computeCostOfChange(currentSalary, proposedNewSalary) {
  return Math.max(0, proposedNewSalary - currentSalary);
}

export async function sumApprovedCostsForCycle(cycleId, excludeProposalId = null) {
  const match = { cycle: cycleId, status: 'Approved' };
  if (excludeProposalId) {
    match._id = { $ne: excludeProposalId };
  }
  const agg = await Proposal.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$costOfChange' } } },
  ]);
  return agg[0]?.total ?? 0;
}

export async function sumPendingCostsForCycle(cycleId) {
  const agg = await Proposal.aggregate([
    { $match: { cycle: cycleId, status: 'Proposed' } },
    { $group: { _id: null, total: { $sum: '$costOfChange' } } },
  ]);
  return agg[0]?.total ?? 0;
}
