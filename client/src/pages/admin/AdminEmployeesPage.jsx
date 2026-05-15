import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { Spinner } from '../../components/Spinner.jsx';

function formatMoney(n) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

export function AdminEmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/admin/employees');
        if (!cancelled) setEmployees(data.employees || []);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load employees'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
        <p className="mt-1 text-sm text-slate-600">Directory of employee accounts and current salaries.</p>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center gap-3 py-10">
            <Spinner />
            <div className="text-sm text-slate-600">Loading…</div>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-600">No employees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Current salary</th>
                  <th className="py-2 pr-4">Salary effective</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <tr key={e.id} className="text-slate-800">
                    <td className="py-3 pr-4 font-medium">{e.name}</td>
                    <td className="py-3 pr-4">{e.email}</td>
                    <td className="py-3 pr-4">{formatMoney(e.currentSalary)}</td>
                    <td className="py-3 pr-4">
                      {e.salaryEffectiveDate ? new Date(e.salaryEffectiveDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
