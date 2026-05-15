import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../services/api.js';

export function AdminCreateCyclePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
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
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Create review cycle</h1>
      <p className="mt-1 text-sm text-slate-600">Budget must be greater than zero.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="effectiveDate">
            Effective date
          </label>
          <input
            id="effectiveDate"
            type="date"
            required
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="totalBudget">
            Total budget (USD)
          </label>
          <input
            id="totalBudget"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-900/10 focus:ring-2"
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
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
