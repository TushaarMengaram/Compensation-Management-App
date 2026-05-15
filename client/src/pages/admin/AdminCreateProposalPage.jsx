import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { CHANGE_TYPES } from '../../constants/proposals.js';

export function AdminCreateProposalPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [createEmployee, setCreateEmployee] = useState('');
  const [createCycle, setCreateCycle] = useState('');
  const [createType, setCreateType] = useState(CHANGE_TYPES[0]);
  const [createSalary, setCreateSalary] = useState('');
  const [createJustification, setCreateJustification] = useState('');
  const [creating, setCreating] = useState(false);

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [eRes, cRes] = await Promise.all([
        api.get('/admin/employees', { params: { limit: 100, page: 1 } }),
        api.get('/admin/review-cycles'),
      ]);
      setEmployees(eRes.data.employees || []);
      const cs = cRes.data.cycles || [];
      setCycles(cs);
      const open = cs.find((c) => c.status === 'Open');
      if (open) setCreateCycle(open._id);
      else if (cs[0]) setCreateCycle(cs[0]._id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load reference data'));
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const firstEmployeeId = useMemo(() => employees[0]?.id || '', [employees]);

  useEffect(() => {
    if (!createEmployee && firstEmployeeId) setCreateEmployee(firstEmployeeId);
  }, [createEmployee, firstEmployeeId]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!createEmployee || !createCycle) {
      toast.error('Select employee and cycle');
      return;
    }
    setCreating(true);
    try {
      await api.post('/proposals', {
        employee: createEmployee,
        cycle: createCycle,
        changeType: createType,
        proposedNewSalary: Number(createSalary),
        justification: createJustification.trim(),
      });
      toast.success('Proposal created');
      navigate('/admin/proposals');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create proposal'));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="ui-page-fill">
      <div className="shrink-0">
        <h1 className="ui-heading">Create proposal</h1>
        <p className="ui-muted mt-1">
          Submit a compensation change for an employee in an open review cycle. Proposed salary must exceed their
          current salary.
        </p>
      </div>

      <div className="ui-panel max-w-3xl shrink-0">
        <div className="ui-panel-body">
          {loadingMeta ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading employees and cycles…</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">No employees available. Add employees first.</p>
          ) : cycles.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No review cycles found.{' '}
              <button
                type="button"
                className="font-medium text-slate-900 underline dark:text-slate-100"
                onClick={() => navigate('/admin/cycles/new')}
              >
                Create a cycle
              </button>
            </p>
          ) : (
            <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
              <div>
                <label className="ui-caption block">Employee</label>
                <select
                  className="ui-input mt-1"
                  value={createEmployee}
                  onChange={(e) => setCreateEmployee(e.target.value)}
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ui-caption block">Review cycle</label>
                <select
                  className="ui-input mt-1"
                  value={createCycle}
                  onChange={(e) => setCreateCycle(e.target.value)}
                  required
                >
                  {cycles.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} — {c.status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ui-caption block">Change type</label>
                <select className="ui-input mt-1" value={createType} onChange={(e) => setCreateType(e.target.value)}>
                  {CHANGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ui-caption block">Proposed new salary (INR)</label>
                <input
                  className="ui-input mt-1"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={createSalary}
                  onChange={(e) => setCreateSalary(e.target.value)}
                />
              </div>
              <div className="lg:col-span-2">
                <label className="ui-caption block">Justification</label>
                <textarea
                  className="ui-input mt-1"
                  rows={4}
                  required
                  value={createJustification}
                  onChange={(e) => setCreateJustification(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 lg:col-span-2">
                <button type="submit" disabled={creating} className="ui-btn-primary">
                  {creating ? 'Creating…' : 'Create proposal'}
                </button>
                <button
                  type="button"
                  className="ui-btn-secondary"
                  onClick={() => navigate('/admin/proposals')}
                  disabled={creating}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
