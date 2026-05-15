export function Spinner({ className = '' }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-600 dark:border-t-slate-100 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
