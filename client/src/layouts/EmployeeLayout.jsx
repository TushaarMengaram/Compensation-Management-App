import { Link, NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) => (isActive ? 'ui-nav-active' : 'ui-nav-idle');

export function EmployeeLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="ui-shell">
      <div className="ui-app-row">
        <aside className="ui-sidebar-aside">
          <div className="ui-sidebar-inner">
            <div className="shrink-0 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="ui-caption">Employee</div>
                  <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
                </div>
                <ThemeToggle />
              </div>
            </div>
            <nav className="ui-sidebar-nav space-y-1">
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
            <div className="ui-sidebar-footer">
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Log out
              </button>
            </div>
          </div>
        </aside>

        <div className="ui-main">
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
            <Link to="/employee" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Compensation
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-slate-700 underline dark:text-slate-300"
              >
                Log out
              </button>
            </div>
          </header>
          <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
            <NavLink to="/employee" end className="ui-chip">
              Dashboard
            </NavLink>
            <NavLink to="/employee/salary" className="ui-chip">
              Salary
            </NavLink>
            <NavLink to="/employee/history" className="ui-chip">
              History
            </NavLink>
          </div>
          <main className="ui-page">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
