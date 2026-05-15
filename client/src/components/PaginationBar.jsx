import { PAGE_SIZE_OPTIONS } from '../constants/pagination.js';

export function PaginationBar({
  page,
  totalPages,
  total,
  limit,
  onLimitChange,
  onPrevious,
  onNext,
  disabledPrevious,
  disabledNext,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div>
          Page {page} of {totalPages}
          {total != null ? ` (${total} total)` : ''}
        </div>
        {onLimitChange ? (
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Per page</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabledPrevious}
          onClick={onPrevious}
          className="rounded-md border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={disabledNext}
          onClick={onNext}
          className="rounded-md border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}
