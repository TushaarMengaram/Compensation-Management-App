export function StatusBadge({ status }) {
  const map = {
    Proposed: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-200',
    Approved: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-200',
    Rejected: 'bg-rose-50 text-rose-800 ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-200',
    Open: 'bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-200',
    Closed: 'bg-slate-100 text-slate-700 ring-slate-600/15 dark:bg-slate-800 dark:text-slate-300',
  };
  const cls = map[status] || 'bg-slate-50 text-slate-700 ring-slate-600/15 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {status}
    </span>
  );
}
