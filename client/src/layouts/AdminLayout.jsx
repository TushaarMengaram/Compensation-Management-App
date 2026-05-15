import { Link, NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) => (isActive ? 'ui-nav-active' : 'ui-nav-idle');

function NavSection({ title, children }) {
  return (
    <div className="pt-3 first:pt-0">
      <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="ui-shell">
      <div className="ui-app-row">
        <aside className="ui-sidebar-aside">
          <div className="ui-sidebar-inner">
            <div className="shrink-0 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="ui-caption">Administrator</div>
                  <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
                </div>
                <ThemeToggle />
              </div>
            </div>
            <nav className="ui-sidebar-nav">
              <NavSection title="Overview">
                <NavLink to="/admin" end className={linkClass}>
                  Dashboard
                </NavLink>
              </NavSection>
              <NavSection title="People">
                <NavLink to="/admin/employees" className={linkClass}>
                  Employees
                </NavLink>
              </NavSection>
              <NavSection title="Review cycles">
                <NavLink to="/admin/cycles" end className={linkClass}>
                  All cycles
                </NavLink>
                <NavLink to="/admin/cycles/new" className={linkClass}>
                  Create cycle
                </NavLink>
              </NavSection>
              <NavSection title="Compensation">
                <NavLink to="/admin/proposals/new" className={linkClass}>
                  Create proposal
                </NavLink>
                <NavLink to="/admin/proposals" end className={linkClass}>
                  Proposal management
                </NavLink>
              </NavSection>
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
            <Link to="/admin" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Compensation Admin
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
            <NavLink to="/admin" end className="ui-chip">
              Dashboard
            </NavLink>
            <NavLink to="/admin/employees" className="ui-chip">
              Employees
            </NavLink>
            <NavLink to="/admin/cycles" className="ui-chip">
              Cycles
            </NavLink>
            <NavLink to="/admin/proposals/new" className="ui-chip">
              New proposal
            </NavLink>
            <NavLink to="/admin/proposals" className="ui-chip">
              Proposals
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
