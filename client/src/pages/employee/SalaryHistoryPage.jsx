import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { PaginationBar } from '../../components/PaginationBar.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { formatINR } from '../../utils/format.js';

export function SalaryHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get('/employees/me/salary-history', {
          params: { page, limit },
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
  }, [page, limit]);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  return (
    <div className="ui-page-fill">
      <div className="ui-panel">
        <div className="ui-panel-header">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Salary history</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Immutable record of applied compensation changes.
          </p>
        </div>
        <div className="ui-panel-body">
          {loading ? (
            <div className="flex items-center gap-3 py-10">
              <Spinner />
              <div className="text-sm text-slate-600 dark:text-slate-400">Loading…</div>
            </div>
          ) : data.items.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">No history entries yet.</div>
          ) : (
            <>
              <div className="ui-panel-scroll">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="py-2 pr-4">Applied</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Previous</th>
                      <th className="py-2 pr-4">New</th>
                      <th className="py-2 pr-4">Effective</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.items.map((row) => (
                      <tr key={row._id} className="text-slate-800 dark:text-slate-200">
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {row.appliedAt ? new Date(row.appliedAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 pr-4">{row.changeType}</td>
                        <td className="py-3 pr-4">{formatINR(row.previousSalary)}</td>
                        <td className="py-3 pr-4 font-medium">{formatINR(row.newSalary)}</td>
                        <td className="py-3 pr-4">
                          {row.effectiveDate ? new Date(row.effectiveDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                className="ui-panel-footer"
                page={data.page ?? page}
                totalPages={data.totalPages}
                total={data.total}
                limit={limit}
                onLimitChange={setLimit}
                disabledPrevious={page <= 1}
                disabledNext={page >= data.totalPages}
                onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
