import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { Spinner } from '../../components/Spinner.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { SalaryTimeline } from '../../components/SalaryTimeline.jsx';
import { SalaryGrowthChart } from '../../components/SalaryGrowthChart.jsx';
import { formatINR } from '../../utils/format.js';
import { useAuth } from '../../context/AuthContext.jsx';

const HISTORY_LIMIT = 100;

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getPercentage(previous, current) {
  if (!previous || !current || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salary, setSalary] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const salaryRequest = api.get('/employees/me/salary');
    const historyRequest = api.get('/employees/me/salary-history', {
      params: { limit: HISTORY_LIMIT },
    });

    Promise.all([salaryRequest, historyRequest])
      .then(([salaryRes, historyRes]) => {
        if (cancelled) return;
        setSalary(salaryRes.data.salary);
        setHistory(historyRes.data.items || []);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(getErrorMessage(err, 'Unable to load compensation overview'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const preparedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(a.effectiveDate || a.appliedAt) - new Date(b.effectiveDate || b.appliedAt));
  }, [history]);

  const latestUpdate = history[0] || null;
  const lastRevisionDate = latestUpdate?.appliedAt || latestUpdate?.effectiveDate;
  const totalRevisions = history.length;
  const highestSalary = useMemo(() => {
    const salaryValues = history.map((item) => Number(item.newSalary || 0));
    if (salary?.currentSalary) salaryValues.push(Number(salary.currentSalary));
    return salaryValues.length ? Math.max(...salaryValues) : null;
  }, [history, salary]);

  const currentIncrement = useMemo(() => {
    if (!latestUpdate?.previousSalary || !latestUpdate?.newSalary) return null;
    return getPercentage(latestUpdate.previousSalary, latestUpdate.newSalary);
  }, [latestUpdate]);

  const chartEntries = useMemo(() => {
    const points = preparedHistory.map((item) => ({
      salary: Number(item.newSalary || 0),
      date: item.effectiveDate || item.appliedAt,
    }));

    if (!salary?.currentSalary) {
      return points;
    }

    const latestSalaryPoint = points[points.length - 1];
    if (!latestSalaryPoint || Number(latestSalaryPoint.salary) !== Number(salary.currentSalary)) {
      return [
        ...points,
        {
          salary: Number(salary.currentSalary),
          date: salary.effectiveDate || new Date().toISOString(),
        },
      ];
    }

    return points;
  }, [preparedHistory, salary]);

  const overviewItems = [
    {
      label: 'Total salary revisions',
      value: totalRevisions || '0',
      detail: 'Approved changes in your compensation journey.',
    },
    {
      label: 'Last revision date',
      value: lastRevisionDate ? formatDate(lastRevisionDate) : '—',
      detail: 'Most recent salary update applied.',
    },
    {
      label: 'Highest salary achieved',
      value: highestSalary ? formatINR(highestSalary) : '—',
      detail: 'Your top recorded compensation.',
    },
    {
      label: 'Current increment',
      value: currentIncrement !== null ? `${currentIncrement.toFixed(1)}%` : '—',
      detail: 'Last approved raise compared to previous salary.',
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200/90 bg-white/90 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">Welcome back</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Welcome back, {user?.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Track your compensation growth and salary updates in one secure place.
            </p>
          </div>
          <div className="inline-flex items-center rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Employee dashboard
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 text-white shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300/80">Salary overview</p>
              <h2 className="mt-3 text-3xl font-semibold">Current compensation</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Active
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/5 p-6">
              <div className="text-sm uppercase tracking-[0.24em] text-slate-300/80">Current salary</div>
              <div className="mt-5 text-4xl font-semibold tracking-tight text-white">
                {loading ? 'Loading…' : salary?.currentSalary ? formatINR(salary.currentSalary) : '—'}
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-white/5 p-6">
              <div className="text-sm uppercase tracking-[0.24em] text-slate-300/80">Effective from</div>
              <div className="mt-5 text-xl font-semibold text-white">
                {loading ? 'Loading…' : formatDate(salary?.effectiveDate)}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/5 p-6">
              <div className="text-sm uppercase tracking-[0.24em] text-slate-300/80">Latest increment</div>
              <div className="mt-4 text-2xl font-semibold text-white">
                {loading ? 'Loading…' : currentIncrement !== null ? `${currentIncrement.toFixed(1)}%` : 'No previous increment data'}
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-white/5 p-6">
              <div className="text-sm uppercase tracking-[0.24em] text-slate-300/80">Status</div>
              <div className="mt-4 text-2xl font-semibold text-white">{salary ? 'Active' : 'No record'}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {overviewItems.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} detail={item.detail} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-slate-200/90 bg-white/90 p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Latest compensation update</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Review your most recent approved salary change.
              </p>
            </div>
          </div>

          <div className="mt-8 min-h-[220px]">
            {loading ? (
              <div className="flex items-center gap-3 py-10">
                <Spinner />
                <div className="text-sm text-slate-600 dark:text-slate-400">Loading update…</div>
              </div>
            ) : latestUpdate ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{latestUpdate.changeType || 'Promotion approved'}</div>
                  <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatINR(latestUpdate.newSalary)}</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Previous salary</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatINR(latestUpdate.previousSalary)}</div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Effective date</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatDate(latestUpdate.effectiveDate)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                No approved salary updates are available yet. Check back once a new compensation change has been applied.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/90 bg-white/90 p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950/80">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Salary growth chart</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Track salary progression through approved compensation changes.
            </p>
          </div>
          <div className="mt-8">
            <SalaryGrowthChart entries={chartEntries} currentSalary={salary?.currentSalary} />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/90 bg-white/90 p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Salary growth timeline</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Visual progression of approved compensation changes over time.
          </p>
        </div>
        <div className="mt-8">
          <SalaryTimeline entries={preparedHistory} />
        </div>
      </section>
    </div>
  );
}
