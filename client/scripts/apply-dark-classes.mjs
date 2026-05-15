import fs from 'fs';
import path from 'path';

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.jsx')) acc.push(p);
  }
  return acc;
}

const textReps = [
  [/\btext-slate-900\b(?! dark:)/g, 'text-slate-900 dark:text-slate-100'],
  [/\btext-slate-800\b(?! dark:)/g, 'text-slate-800 dark:text-slate-200'],
  [/\btext-slate-700\b(?! dark:)/g, 'text-slate-700 dark:text-slate-300'],
  [/\btext-slate-600\b(?! dark:)/g, 'text-slate-600 dark:text-slate-400'],
  [/\btext-slate-500\b(?! dark:)/g, 'text-slate-500 dark:text-slate-400'],
  [/\bborder-slate-200\b(?! dark:)/g, 'border-slate-200 dark:border-slate-700'],
  [/\bborder-slate-100\b(?! dark:)/g, 'border-slate-100 dark:border-slate-800'],
  [/\bdivide-slate-100\b(?! dark:)/g, 'divide-slate-100 dark:divide-slate-800'],
  [/\bhover:bg-slate-50\b(?! dark:)/g, 'hover:bg-slate-50 dark:hover:bg-slate-800'],
  [/\bhover:bg-slate-100\b(?! dark:)/g, 'hover:bg-slate-100 dark:hover:bg-slate-800'],
  [/\bbg-slate-50\b(?! dark:)/g, 'bg-slate-50 dark:bg-slate-950'],
  [/\bbg-white\b(?! dark:)/g, 'bg-white dark:bg-slate-900'],
  [
    /className="mt-1 w-full rounded-md border border-slate-200/g,
    'className="ui-input mt-1',
  ],
  [
    /fixed inset-0 z-50 flex items-end justify-center bg-slate-900\/40/g,
    'fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 dark:bg-black/60',
  ],
  [
    /w-full max-w-lg rounded-xl bg-white p-6 shadow-xl/g,
    'w-full max-w-lg ui-card p-6 shadow-xl',
  ],
  [/text-amber-800/g, 'text-amber-800 dark:text-amber-200'],
  [
    /rounded-xl border border-slate-200 bg-white p-6 shadow-sm/g,
    'ui-card-pad',
  ],
];

let count = 0;
for (const file of walk(path.join('src', 'pages'))) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;
  for (const [re, b] of textReps) s = s.replace(re, b);
  if (s !== orig) {
    fs.writeFileSync(file, s);
    count += 1;
    console.log('updated', file);
  }
}
console.log('done', count);
