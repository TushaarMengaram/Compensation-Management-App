import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { Spinner } from '../../components/Spinner.jsx';

function formatMoney(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

export function AdminDashboardPage() {
  const [cycles, setCycles] = useState([]);
  const [loadingCycles, setLoadingCycles] = useState(true);
  const [cycleId, setCycleId] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/admin/review-cycles');
        if (cancelled) return;
        setCycles(data.cycles || []);
        const open = (data.cycles || []).find((c) => c.status === 'Open');
        if (open) setCycleId(open._id);
        else if (data.cycles?.[0]) setCycleId(data.cycles[0]._id);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load cycles'));
      } finally {
        if (!cancelled) setLoadingCycles(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cycleId) return;
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const { data } = await api.get('/admin/dashboard', { params: { cycleId } });
        if (!cancelled) setStats(data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load dashboard metrics'));
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cycleId]);

  const selectedCycle = useMemo(
    () => cycles.find((c) => c._id === cycleId) || null,
    [cycles, cycleId]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Budget utilization for a selected review cycle.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/cycles/new"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New cycle
          </Link>
          <Link
            to="/admin/proposals"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Manage proposals
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-700" htmlFor="cycle">
          Review cycle
        </label>
        <select
          id="cycle"
          className="mt-2 w-full max-w-xl rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={cycleId}
          onChange={(e) => setCycleId(e.target.value)}
          disabled={loadingCycles || cycles.length === 0}
        >
          {cycles.length === 0 ? <option value="">No cycles yet</option> : null}
          {cycles.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title} — {c.status} — budget {formatMoney(c.totalBudget)}
            </option>
          ))}
        </select>
        {selectedCycle ? (
          <div className="mt-2 text-xs text-slate-500">
            Effective {new Date(selectedCycle.effectiveDate).toLocaleDateString()} · Status{' '}
            <span className="font-medium text-slate-700">{selectedCycle.status}</span>
          </div>
        ) : null}
      </div>

      {loadingCycles ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <Spinner />
          <div className="text-sm text-slate-600">Loading cycles…</div>
        </div>
      ) : statsLoading ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <Spinner />
          <div className="text-sm text-slate-600">Loading metrics…</div>
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric title="Total budget" value={formatMoney(stats.totalBudget)} />
          <Metric title="Approved amount" value={formatMoney(stats.approvedAmount)} />
          <Metric title="Pending amount" value={formatMoney(stats.pendingAmount)} />
          <Metric title="Remaining budget" value={formatMoney(stats.remainingBudget)} highlight />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          Select a cycle to view metrics.
        </div>
      )}
    </div>
  );
}

function Metric({ title, value, highlight }) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        highlight ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
