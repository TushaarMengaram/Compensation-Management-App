import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function EmployeeDashboardPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user?.name}</h1>
        <p className="mt-1 text-sm text-slate-600">This is your personal compensation workspace.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/employee/salary"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <div className="text-sm font-semibold text-slate-900">Current salary</div>
          <p className="mt-2 text-sm text-slate-600">View your latest salary on record.</p>
        </Link>
        <Link
          to="/employee/history"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <div className="text-sm font-semibold text-slate-900">Salary history</div>
          <p className="mt-2 text-sm text-slate-600">See approved changes applied from past cycles.</p>
        </Link>
      </div>
    </div>
  );
}
