import { formatINR } from '../utils/format.js';

export function SalaryTimeline({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
        No salary revisions tracked yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map((entry, index) => {
        const effectiveDate = entry.effectiveDate || entry.appliedAt;
        const formattedDate = effectiveDate
          ? new Date(effectiveDate).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
            })
          : 'Unknown';
        return (
          <div key={entry._id || `${index}-${formattedDate}`} className="relative pl-8">
            <div className="absolute left-0 top-3 h-3 w-3 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-950" />
            {index < entries.length - 1 && (
              <div className="absolute left-1.5 top-8 h-[calc(100%-1.5rem)] w-px bg-slate-200 dark:bg-slate-700" />
            )}
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{formattedDate}</div>
                  <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{entry.changeType || 'Salary update'}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatINR(entry.newSalary)}</div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">New salary</div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  <div className="font-medium text-slate-900 dark:text-slate-100">Previous</div>
                  <div className="mt-1">{formatINR(entry.previousSalary)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  <div className="font-medium text-slate-900 dark:text-slate-100">Effective</div>
                  <div className="mt-1">{effectiveDate ? new Date(effectiveDate).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
