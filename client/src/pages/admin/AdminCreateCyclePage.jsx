import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';
import { todayDateInputValue, isDateBeforeToday } from '../../utils/format.js';

export function AdminCreateCyclePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const minDate = todayDateInputValue();

  async function onSubmit(e) {
    e.preventDefault();
    if (isDateBeforeToday(effectiveDate)) {
      toast.error('Effective date must be today or a future date');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/review-cycles', {
        title: title.trim(),
        effectiveDate: new Date(effectiveDate).toISOString(),
        totalBudget: Number(totalBudget),
      });
      toast.success('Review cycle created');
      navigate('/admin/cycles');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create cycle'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl ui-card rounded-2xl p-8">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create review cycle</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Budget must be greater than zero. Effective date must be today or later.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="ui-input mt-1 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="effectiveDate">
            Effective date
          </label>
          <input
            id="effectiveDate"
            type="date"
            required
            min={minDate}
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="ui-input mt-1 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-2"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Earliest allowed: {minDate}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="totalBudget">
            Total budget (INR)
          </label>
          <input
            id="totalBudget"
            type="number"
            min="1"
            step="1"
            required
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            className="ui-input mt-1 dark:border-slate-700 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-2"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create cycle'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
