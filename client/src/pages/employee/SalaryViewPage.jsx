import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { Spinner } from '../../components/Spinner.jsx';
import { formatINR } from '../../utils/format.js';

export function SalaryViewPage() {
  const [loading, setLoading] = useState(true);
  const [salary, setSalary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/employees/me/salary');
        if (!cancelled) setSalary(data.salary);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load salary'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <Spinner />
        <div className="text-sm text-slate-600">Loading salary…</div>
      </div>
    );
  }

  if (!salary) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
        No salary record found yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">My salary</h1>
      <p className="mt-1 text-sm text-slate-600">This reflects your current on-record compensation.</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current salary</dt>
          <dd className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(salary.currentSalary)}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Effective date</dt>
          <dd className="mt-2 text-sm font-medium text-slate-900">
            {salary.effectiveDate ? new Date(salary.effectiveDate).toLocaleDateString() : '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
