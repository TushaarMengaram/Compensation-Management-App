import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { Spinner } from '../../components/Spinner.jsx';
import { formatINR } from '../../utils/format.js';

export function AdminEmployeeDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [history, setHistory] = useState({ items: [], page: 1, totalPages: 1, total: 0 });
  const [historyPage, setHistoryPage] = useState(1);

  const loadSalary = useCallback(async () => {
    const { data } = await api.get(`/admin/employees/${id}/salary`);
    setEmployee(data.employee);
    setSalary(data.salary);
  }, [id]);

  const loadHistory = useCallback(async () => {
    const { data } = await api.get(`/admin/employees/${id}/salary-history`, {
      params: { page: historyPage, limit: 20 },
    });
    setEmployee(data.employee);
    setHistory(data);
  }, [id, historyPage]);

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
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-10 shadow-sm">
        <Spinner />
        <div className="text-sm text-slate-600">Loading employee…</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-sm text-slate-600 shadow-sm">
        Employee not found.{' '}
        <Link to="/admin/employees" className="font-medium text-slate-900 underline">
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/employees" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Employees
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{employee.name}</h1>
        <p className="text-sm text-slate-600">{employee.email}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Current salary record</h2>
        {salary ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Base salary</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(salary.currentSalary)}</dd>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Effective date</dt>
              <dd className="mt-2 text-sm font-medium text-slate-900">
                {salary.effectiveDate ? new Date(salary.effectiveDate).toLocaleDateString() : '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No salary record on file.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-sm font-semibold text-slate-900">Salary change history</h2>
          <p className="mt-1 text-xs text-slate-600">{history.total} entries (immutable audit log)</p>
        </div>
        <div className="p-6">
          {history.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-600">No history entries yet.</p>
          ) : (
            <>
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
                    {history.items.map((row) => (
                      <tr key={row._id} className="text-slate-800">
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
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>
                  Page {history.page} of {history.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-slate-200 px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={historyPage >= history.totalPages}
                    onClick={() => setHistoryPage((p) => p + 1)}
                    className="rounded-md border border-slate-200 px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
