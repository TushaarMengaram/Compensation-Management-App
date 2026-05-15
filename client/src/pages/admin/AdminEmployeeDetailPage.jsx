import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { PaginationBar } from '../../components/PaginationBar.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { formatINR } from '../../utils/format.js';

export function AdminEmployeeDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [history, setHistory] = useState({ items: [], page: 1, totalPages: 1, total: 0 });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);

  const loadSalary = useCallback(async () => {
    const { data } = await api.get(`/admin/employees/${id}/salary`);
    setEmployee(data.employee);
    setSalary(data.salary);
  }, [id]);

  const loadHistory = useCallback(async () => {
    const { data } = await api.get(`/admin/employees/${id}/salary-history`, {
      params: { page: historyPage, limit: historyLimit },
    });
    setEmployee(data.employee);
    setHistory(data);
  }, [id, historyPage, historyLimit]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyLimit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadSalary(), loadHistory()]);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Could not load employee data'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSalary, loadHistory]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 shadow-sm">
        <Spinner />
        <div className="text-sm text-slate-600 dark:text-slate-400">Loading employee…</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-sm text-slate-600 dark:text-slate-400 shadow-sm">
        Employee not found.{' '}
        <Link to="/admin/employees" className="font-medium text-slate-900 dark:text-slate-100 underline">
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="ui-page-fill">
      <div className="shrink-0">
        <Link to="/admin/employees" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          ← Employees
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{employee.name}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{employee.email}</p>
      </div>

      <div className="ui-card-pad shrink-0">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Current salary record</h2>
        {salary ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Base salary</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatINR(salary.currentSalary)}</dd>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Effective date</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                {salary.effectiveDate ? new Date(salary.effectiveDate).toLocaleDateString() : '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">No salary record on file.</p>
        )}
      </div>

      <div className="ui-panel min-h-0 flex-1">
        <div className="ui-panel-header">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Salary change history</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{history.total} entries (immutable audit log)</p>
        </div>
        <div className="ui-panel-body">
          {history.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-600 dark:text-slate-400">No history entries yet.</p>
          ) : (
            <>
              <div className="ui-panel-scroll">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2 pr-4">Applied</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Previous</th>
                      <th className="py-2 pr-4">New</th>
                      <th className="py-2 pr-4">Effective</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.items.map((row) => (
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
                page={history.page ?? historyPage}
                totalPages={history.totalPages}
                total={history.total}
                limit={historyLimit}
                onLimitChange={setHistoryLimit}
                disabledPrevious={historyPage <= 1}
                disabledNext={historyPage >= history.totalPages}
                onPrevious={() => setHistoryPage((p) => Math.max(1, p - 1))}
                onNext={() => setHistoryPage((p) => p + 1)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
