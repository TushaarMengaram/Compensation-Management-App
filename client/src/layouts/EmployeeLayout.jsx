import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`;

export function EmployeeLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
            <nav className="space-y-1">
              <NavLink to="/employee" end className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/employee/salary" className={linkClass}>
                My salary
              </NavLink>
              <NavLink to="/employee/history" className={linkClass}>
                Salary history
              </NavLink>
            </nav>
            <button
              type="button"
              onClick={logout}
              className="mt-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/employee" className="text-sm font-semibold text-slate-900">
              Compensation
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-slate-700 underline"
            >
              Log out
            </button>
          </header>
          <div className="lg:hidden mb-4 flex flex-wrap gap-2">
            <NavLink
              to="/employee"
              end
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/employee/salary"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              Salary
            </NavLink>
            <NavLink
              to="/employee/history"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              History
            </NavLink>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
