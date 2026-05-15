import { formatINR } from '../utils/format.js';

const CHART_WIDTH = 640;
const CHART_HEIGHT = 280;
const MARGIN = { top: 20, right: 24, bottom: 40, left: 48 };

function formatMonthYear(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}

function getCoordinates(points) {
  const innerWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  const salaries = points.map((point) => point.salary);
  const minSalary = Math.min(...salaries);
  const maxSalary = Math.max(...salaries);
  const range = Math.max(maxSalary - minSalary, 1);

  return points.map((point, index) => {
    const x = MARGIN.left + (innerWidth * index) / Math.max(points.length - 1, 1);
    const y = MARGIN.top + innerHeight - ((point.salary - minSalary) / range) * innerHeight;
    return { ...point, x, y };
  });
}

export function SalaryGrowthChart({ entries = [], currentSalary }) {
  const points = [...entries];

  if (currentSalary && points.length > 0) {
    const lastSalary = Number(points[points.length - 1].salary || 0);
    if (Number(currentSalary) !== lastSalary) {
      points.push({
        salary: Number(currentSalary),
        date: new Date().toISOString(),
        label: 'Today',
      });
    }
  }

  if (points.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        No salary trend available yet.
      </div>
    );
  }

  const plotted = getCoordinates(points);
  const salaries = plotted.map((point) => point.salary);
  const minSalary = Math.min(...salaries);
  const maxSalary = Math.max(...salaries);
  const midSalary = Math.round((maxSalary + minSalary) / 2);
  const yTicks = [maxSalary, midSalary, minSalary];
  const xTicks = plotted.length <= 6 ? plotted : plotted.filter((_, idx) => idx === 0 || idx === plotted.length - 1 || idx % Math.ceil((plotted.length - 1) / 4) === 0);

  const linePath = plotted
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const labels = plotted.slice(-4).map((point, idx) => (
    <div key={idx} className="flex flex-col items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
      <div className="font-semibold text-slate-900 dark:text-slate-100">{formatMonthYear(point.date)}</div>
      <div>{formatINR(point.salary)}</div>
    </div>
  ));

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
            Growth chart
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Compensation growth over time
          </h3>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Latest salary journey</div>
      </div>
      <div className="mt-6 overflow-hidden rounded-3xl bg-slate-950/5 p-4 dark:bg-slate-900/80">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-[320px] w-full">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          <path
            d={`M ${MARGIN.left} ${MARGIN.top} L ${MARGIN.left} ${CHART_HEIGHT - MARGIN.bottom}`}
            stroke="rgba(148,163,184,0.5)"
            strokeWidth="1"
          />
          <path
            d={`M ${MARGIN.left} ${CHART_HEIGHT - MARGIN.bottom} L ${CHART_WIDTH - MARGIN.right} ${CHART_HEIGHT - MARGIN.bottom}`}
            stroke="rgba(148,163,184,0.5)"
            strokeWidth="1"
          />
          {yTicks.map((value, idx) => {
            const y = MARGIN.top + ((maxSalary - value) / Math.max(maxSalary - minSalary, 1)) * (CHART_HEIGHT - MARGIN.top - MARGIN.bottom);
            return (
              <g key={idx}>
                <path
                  d={`M ${MARGIN.left} ${y} H ${CHART_WIDTH - MARGIN.right}`}
                  stroke="rgba(148,163,184,0.15)"
                  strokeWidth="1"
                />
                <text
                  x={MARGIN.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fill="currentColor"
                  className="text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  {formatINR(value)}
                </text>
              </g>
            );
          })}
          {xTicks.map((point, idx) => (
            <g key={idx}>
              <path
                d={`M ${point.x} ${CHART_HEIGHT - MARGIN.bottom} L ${point.x} ${CHART_HEIGHT - MARGIN.bottom + 6}`}
                stroke="rgba(148,163,184,0.5)"
                strokeWidth="1"
              />
              <text
                x={point.x}
                y={CHART_HEIGHT - MARGIN.bottom + 22}
                textAnchor="middle"
                fill="currentColor"
                className="text-[10px] font-medium text-slate-500 dark:text-slate-400"
              >
                {formatMonthYear(point.date)}
              </text>
            </g>
          ))}
          <path
            d={linePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {plotted.map((point, idx) => (
            <g key={idx}>
              <circle cx={point.x} cy={point.y} r="5" fill="#0ea5e9" />
              <circle cx={point.x} cy={point.y} r="10" fill="transparent" />
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">{labels}</div>
    </div>
  );
}
