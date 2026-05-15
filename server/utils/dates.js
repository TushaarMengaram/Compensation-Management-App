export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isEffectiveDateInPast(isoDateString) {
  return toStartOfDay(isoDateString) < startOfToday();
}
