import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { Spinner } from '../../components/Spinner.jsx';
import { formatINR } from '../../utils/format.js';

export function AdminEmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      const { data } = await api.get('/admin/employees', { params });
      setEmployees(data.employees || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load employees'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
        <p className="mt-1 text-sm text-slate-600">
          Directory of employee accounts and current salaries. Search by name or email.
        </p>
      </div>
      <div className="border-b border-slate-200 px-6 py-4">
        <label className="sr-only" htmlFor="employee-search">
          Search employees
        </label>
        <input
          id="employee-search"
          type="search"
          placeholder="Search by name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-md rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-2"
        />
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center gap-3 py-10">
            <Spinner />
            <div className="text-sm text-slate-600">Loading…</div>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-600">
            {search ? 'No employees match your search.' : 'No employees found.'}
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-slate-500">
              Showing page {page} of {totalPages} ({total} total)
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Current salary</th>
                    <th className="py-2 pr-4">Salary effective</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((e) => (
                    <tr key={e.id} className="text-slate-800">
                      <td className="py-3 pr-4 font-medium">{e.name}</td>
                      <td className="py-3 pr-4">{e.email}</td>
                      <td className="py-3 pr-4">{formatINR(e.currentSalary)}</td>
                      <td className="py-3 pr-4">
                        {e.salaryEffectiveDate
                          ? new Date(e.salaryEffectiveDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Link
                          to={`/admin/employees/${e.id}`}
                          className="text-xs font-semibold text-slate-900 underline hover:text-slate-700"
                        >
                          View salary & history
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Page {page} of {totalPages}
              </span>
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
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
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
  );
}
