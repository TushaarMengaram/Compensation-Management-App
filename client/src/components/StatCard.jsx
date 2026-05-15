export function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
      {detail ? <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{detail}</p> : null}
    </div>
  );
}
