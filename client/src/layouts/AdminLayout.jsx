import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
  }`;

function NavSection({ title, children }) {
  return (
    <div className="pt-3 first:pt-0">
      <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administrator</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
            <nav>
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
                <NavLink to="/admin/cycles" className={linkClass}>
                  All cycles
                </NavLink>
                <NavLink to="/admin/cycles/new" className={linkClass}>
                  Create cycle
                </NavLink>
              </NavSection>
              <NavSection title="Compensation">
                <NavLink to="/admin/proposals" className={linkClass}>
                  Proposals
                </NavLink>
              </NavSection>
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
            <Link to="/admin" className="text-sm font-semibold text-slate-900">
              Compensation Admin
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-slate-700 underline"
            >
              Log out
            </button>
          </header>
          <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
            <NavLink
              to="/admin"
              end
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/employees"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              Employees
            </NavLink>
            <NavLink
              to="/admin/cycles"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              Cycles
            </NavLink>
            <NavLink
              to="/admin/proposals"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              Proposals
            </NavLink>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
