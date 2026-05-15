/** Indian Rupee with en-IN grouping (e.g. ₹12,34,567) */
export function formatINR(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '—';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/** YYYY-MM-DD for &lt;input type="date" min&gt; in local timezone */
export function todayDateInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isDateBeforeToday(dateInputValue) {
  if (!dateInputValue) return false;
  return dateInputValue < todayDateInputValue();
}
