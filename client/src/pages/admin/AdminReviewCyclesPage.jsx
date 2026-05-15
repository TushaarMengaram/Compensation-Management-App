import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { Spinner } from '../../components/Spinner.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatINR } from '../../utils/format.js';

export function AdminReviewCyclesPage() {
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState([]);
  const [busyId, setBusyId] = useState('');

  async function refresh() {
    const { data } = await api.get('/admin/review-cycles');
    setCycles(data.cycles || []);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load cycles'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function closeCycle(id) {
    setBusyId(id);
    try {
      const { data } = await api.post(`/admin/review-cycles/${id}/close`);
      toast.success(data.message || 'Cycle closed');
      await refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not close cycle'));
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Review cycles</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Cycles must have all proposals decided before closing.</p>
        </div>
        <Link
          to="/admin/cycles/new"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Create cycle
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center gap-3 py-10">
              <Spinner />
              <div className="text-sm text-slate-600 dark:text-slate-400">Loading…</div>
            </div>
          ) : cycles.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">No review cycles yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Budget</th>
                    <th className="py-2 pr-4">Effective</th>
                    <th className="py-2 pr-4">Created by</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cycles.map((c) => (
                    <tr key={c._id} className="text-slate-800 dark:text-slate-200">
                      <td className="py-3 pr-4 font-medium">{c.title}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 pr-4">{formatINR(c.totalBudget)}</td>
                      <td className="py-3 pr-4">{new Date(c.effectiveDate).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">{c.createdBy?.name || '—'}</td>
                      <td className="py-3 pr-4 text-right">
                        {c.status === 'Open' ? (
                          <button
                            type="button"
                            disabled={busyId === c._id}
                            onClick={() => closeCycle(c._id)}
                            className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                          >
                            {busyId === c._id ? 'Closing…' : 'Close cycle'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
