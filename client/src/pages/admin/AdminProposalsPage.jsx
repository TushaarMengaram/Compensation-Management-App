import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PaginationBar } from '../../components/PaginationBar.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatINR } from '../../utils/format.js';
import { CHANGE_TYPES, PROPOSAL_STATUSES } from '../../constants/proposals.js';

export function AdminProposalsPage() {
  const { user } = useAuth();
  const myId = user?.id;

  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);

  const [cycleId, setCycleId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [changeType, setChangeType] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [decision, setDecision] = useState(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [decisionBusy, setDecisionBusy] = useState(false);

  const [editProposal, setEditProposal] = useState(null);
  const [editType, setEditType] = useState(CHANGE_TYPES[0]);
  const [editSalary, setEditSalary] = useState('');
  const [editJustification, setEditJustification] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  const loadMeta = useCallback(async () => {
    const [eRes, cRes] = await Promise.all([
      api.get('/admin/employees', { params: { limit: 100, page: 1 } }),
      api.get('/admin/review-cycles'),
    ]);
    setEmployees(eRes.data.employees || []);
    const cs = cRes.data.cycles || [];
    setCycles(cs);
    const open = cs.find((c) => c.status === 'Open');
    if (open) {
      setCycleId((prev) => prev || open._id);
    } else if (cs[0]) {
      setCycleId((prev) => prev || cs[0]._id);
    }
  }, []);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, sort, order };
      if (cycleId) params.cycle = cycleId;
      if (employeeId) params.employee = employeeId;
      if (status) params.status = status;
      if (changeType) params.changeType = changeType;
      const { data } = await api.get('/proposals', { params });
      setRows(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load proposals'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, cycleId, employeeId, status, changeType, sort, order]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadMeta();
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Could not load reference data'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMeta]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    setPage(1);
  }, [cycleId, employeeId, status, changeType, sort, order, limit]);

  async function deleteProposal(id) {
    if (!window.confirm('Delete this proposal?')) return;
    try {
      await api.delete(`/proposals/${id}`);
      toast.success('Proposal deleted');
      await loadProposals();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete'));
    }
  }

  function openEdit(proposal) {
    setEditProposal(proposal);
    setEditType(proposal.changeType);
    setEditSalary(String(proposal.proposedNewSalary));
    setEditJustification(proposal.justification || '');
  }

  function closeEdit() {
    setEditProposal(null);
    setEditType(CHANGE_TYPES[0]);
    setEditSalary('');
    setEditJustification('');
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editProposal) return;
    if (!editJustification.trim()) {
      toast.error('Justification is required');
      return;
    }
    const proposedNum = Number(editSalary);
    if (proposedNum <= editProposal.currentSalarySnapshot) {
      toast.error('Proposed salary must be greater than the salary at proposal time');
      return;
    }
    setEditBusy(true);
    try {
      await api.patch(`/proposals/${editProposal._id}`, {
        changeType: editType,
        proposedNewSalary: proposedNum,
        justification: editJustification.trim(),
      });
      toast.success('Proposal updated');
      closeEdit();
      await loadProposals();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update proposal'));
    } finally {
      setEditBusy(false);
    }
  }

  async function submitDecision() {
    if (!decision) return;
    setDecisionBusy(true);
    try {
      const path =
        decision.type === 'approve' ? `/proposals/${decision.proposal._id}/approve` : `/proposals/${decision.proposal._id}/reject`;
      await api.post(path, { decisionNote: decisionNote.trim() });
      toast.success(decision.type === 'approve' ? 'Approved' : 'Rejected');
      setDecision(null);
      setDecisionNote('');
      await loadProposals();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed'));
    } finally {
      setDecisionBusy(false);
    }
  }

  return (
    <div className="ui-page-fill">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Proposal management</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Filter proposals, approve or reject as a different admin than the proposer, and edit your own pending rows.
        </p>
      </div>

      <div className="ui-panel min-h-0 flex-1">
        <div className="shrink-0 border-b border-slate-200 p-6 dark:border-slate-700">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Proposals</h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{total} matching rows</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <select
              className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-2 text-sm"
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
            >
              <option value="">All cycles</option>
              {cycles.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-2 text-sm"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">All employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {PROPOSAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-2 text-sm"
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
            >
              <option value="">All types</option>
              {CHANGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-2 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="createdAt">Sort: created date</option>
              <option value="cost">Sort: cost</option>
              <option value="employeeName">Sort: employee name</option>
            </select>
            <select
              className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-2 text-sm"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
        </div>

        <div className="ui-panel-body">
          <div className="ui-panel-scroll">
          {loading ? (
            <div className="flex items-center gap-3 py-10">
              <Spinner />
              <div className="text-sm text-slate-600 dark:text-slate-400">Loading proposals…</div>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">No proposals match your filters.</div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Employee</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Current</th>
                  <th className="py-2 pr-4">Proposed</th>
                  <th className="py-2 pr-4">Cost</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Proposer</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((p) => {
                  const isSelf =
                    String(p.proposedBy?._id || p.proposedBy || '') === String(myId || '');
                  const isCreator = isSelf;
                  const canDecide = p.status === 'Proposed' && p.cycle?.status === 'Open';
                  return (
                    <tr key={p._id} className="text-slate-800 dark:text-slate-200">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{p.employee?.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{p.employee?.email}</div>
                      </td>
                      <td className="py-3 pr-4">{p.changeType}</td>
                      <td className="py-3 pr-4">{formatINR(p.currentSalarySnapshot)}</td>
                      <td className="py-3 pr-4 font-medium">{formatINR(p.proposedNewSalary)}</td>
                      <td className="py-3 pr-4">{formatINR(p.costOfChange)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="text-sm">{p.proposedBy?.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{p.proposedBy?.email}</div>
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {p.status === 'Proposed' && isCreator && p.cycle?.status === 'Open' ? (
                          <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2">
                            <button
                              type="button"
                              title="Edit this proposal"
                              className="rounded-md bg-slate-600 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                              onClick={() => openEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              title="Delete this proposal"
                              className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                              onClick={() => deleteProposal(p._id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                        {canDecide && isSelf ? (
                          <p
                            className="ml-auto max-w-[14rem] text-right text-xs leading-snug text-amber-800 dark:text-amber-200"
                            title="Segregation of duties: the proposer cannot approve or reject their own proposal."
                          >
                            You proposed this — another administrator must approve or reject.
                          </p>
                        ) : null}
                        {canDecide && !isSelf ? (
                          <>
                            <button
                              type="button"
                              title="Approve this proposal"
                              onClick={() => {
                                setDecision({ type: 'approve', proposal: p });
                                setDecisionNote('');
                              }}
                              className="mr-2 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              title="Reject this proposal"
                              onClick={() => {
                                setDecision({ type: 'reject', proposal: p });
                                setDecisionNote('');
                              }}
                              className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

          {!loading && rows.length > 0 ? (
            <PaginationBar
              className="ui-panel-footer"
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onLimitChange={setLimit}
              disabledPrevious={page <= 1}
              disabledNext={page >= totalPages}
              onPrevious={() => setPage((x) => Math.max(1, x - 1))}
              onNext={() => setPage((x) => x + 1)}
            />
          ) : null}
        </div>
      </div>

      {editProposal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 dark:bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit proposal</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {editProposal.employee?.name} · snapshot {formatINR(editProposal.currentSalarySnapshot)}
            </p>
            <form className="mt-4 space-y-4" onSubmit={submitEdit}>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="edit-type">
                  Change type
                </label>
                <select
                  id="edit-type"
                  className="ui-input mt-1 dark:border-slate-700 px-3 py-2 text-sm"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                >
                  {CHANGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="edit-salary">
                  Proposed new salary (INR)
                </label>
                <input
                  id="edit-salary"
                  type="number"
                  min={editProposal.currentSalarySnapshot + 1}
                  step="1"
                  required
                  className="ui-input mt-1 dark:border-slate-700 px-3 py-2 text-sm"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Must be greater than {formatINR(editProposal.currentSalarySnapshot)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="edit-justification">
                  Justification
                </label>
                <textarea
                  id="edit-justification"
                  className="ui-input mt-1 dark:border-slate-700 px-3 py-2 text-sm"
                  rows={3}
                  required
                  value={editJustification}
                  onChange={(e) => setEditJustification(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={closeEdit}
                  disabled={editBusy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  disabled={editBusy}
                >
                  {editBusy ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {decision ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 dark:bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {decision.type === 'approve' ? 'Approve proposal' : 'Reject proposal'}
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {decision.proposal.employee?.name} · {formatINR(decision.proposal.currentSalarySnapshot)} →{' '}
              {formatINR(decision.proposal.proposedNewSalary)}
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="note">
              Decision note (optional)
            </label>
            <textarea
              id="note"
              className="ui-input mt-1 dark:border-slate-700 px-3 py-2 text-sm"
              rows={3}
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => {
                  setDecision(null);
                  setDecisionNote('');
                }}
                disabled={decisionBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                  decision.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
                disabled={decisionBusy}
                onClick={submitDecision}
              >
                {decisionBusy ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
