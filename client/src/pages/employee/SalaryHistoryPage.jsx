import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { Spinner } from '../../components/Spinner.jsx';

function formatMoney(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

export function SalaryHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get('/employees/me/salary-history', {
          params: { page, limit: 15 },
        });
        if (!cancelled) setData(res);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load history'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h1 className="text-xl font-semibold text-slate-900">Salary history</h1>
        <p className="mt-1 text-sm text-slate-600">Immutable record of applied compensation changes.</p>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center gap-3 py-10">
            <Spinner />
            <div className="text-sm text-slate-600">Loading…</div>
          </div>
        ) : data.items.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-600">No history entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Applied</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Previous</th>
                  <th className="py-2 pr-4">New</th>
                  <th className="py-2 pr-4">Effective</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((row) => (
                  <tr key={row._id} className="text-slate-800">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {row.appliedAt ? new Date(row.appliedAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 pr-4">{row.changeType}</td>
                    <td className="py-3 pr-4">{formatMoney(row.previousSalary)}</td>
                    <td className="py-3 pr-4 font-medium">{formatMoney(row.newSalary)}</td>
                    <td className="py-3 pr-4">
                      {row.effectiveDate ? new Date(row.effectiveDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <div>
                Page {data.page} of {data.totalPages} ({data.total} total)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-slate-200 px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-slate-200 px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
