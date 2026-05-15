import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { PaginationBar } from '../../components/PaginationBar.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { formatINR } from '../../utils/format.js';

export function AdminEmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
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
  }, [search, limit]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="ui-page-fill">
      <div className="ui-panel">
        <div className="ui-panel-header">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Employees</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Directory of employee accounts and current salaries. Search by name or email.
          </p>
        </div>
        <div className="ui-panel-toolbar">
          <label className="sr-only" htmlFor="employee-search">
            Search employees
          </label>
          <input
            id="employee-search"
            type="search"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="ui-input max-w-md"
          />
        </div>
        <div className="ui-panel-body">
          {loading ? (
            <div className="flex items-center gap-3 py-10">
              <Spinner />
              <div className="text-sm text-slate-600 dark:text-slate-400">Loading…</div>
            </div>
          ) : employees.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">
              {search ? 'No employees match your search.' : 'No employees found.'}
            </div>
          ) : (
            <>
              <div className="ui-panel-scroll">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Current salary</th>
                      <th className="py-2 pr-4">Salary effective</th>
                      <th className="py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {employees.map((e) => (
                      <tr key={e.id} className="text-slate-800 dark:text-slate-200">
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
                            className="text-xs font-semibold text-slate-900 underline hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
                          >
                            View salary & history
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                className="ui-panel-footer"
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onLimitChange={setLimit}
                disabledPrevious={page <= 1}
                disabledNext={page >= totalPages}
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
