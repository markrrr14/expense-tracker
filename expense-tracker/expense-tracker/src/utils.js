export const CATEGORIES = [
  { name: 'Food', color: '#e07a3f' },
  { name: 'Transport', color: '#3f8fe0' },
  { name: 'School', color: '#7a5cd6' },
  { name: 'Bills', color: '#d64f64' },
  { name: 'Shopping', color: '#d6a31f' },
  { name: 'Health', color: '#2fa37a' },
  { name: 'Others', color: '#7b8794' },
];

const DEFAULT_COLOR = '#7b8794';
const COLORS = new Map(CATEGORIES.map((c) => [c.name, c.color]));
const PESO = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const SHORT_DATE = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
const MONTH_YEAR = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' });

export const colorOf = (name) => COLORS.get(name) ?? DEFAULT_COLOR;

export const peso = (n) => PESO.format(Number(n) || 0);

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value.length === 10 ? value + 'T00:00:00' : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Local date as YYYY-MM-DD (avoids the UTC off-by-one of toISOString)
export const today = () => new Date().toLocaleDateString('en-CA');
export const currentMonth = () => today().slice(0, 7);
export const monthOf = (value) => String(value || '').slice(0, 7);
export const dateInputValue = (value) => String(value || '').slice(0, 10);

export const formatDate = (value) => {
  const date = parseDate(value);
  return date ? SHORT_DATE.format(date) : '—';
};

export const monthLabel = (ym) => {
  const date = parseDate(ym ? ym + '-01' : '');
  return date ? MONTH_YEAR.format(date) : '';
};

export const sortExpenses = (list) =>
  [...list].sort(
    (a, b) => String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id),
  );

export function downloadCSV(expenses, month) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['Date', 'Category', 'Note', 'Amount'],
    ...expenses.map((e) => [e.date, e.category, e.note, e.amount]),
  ];
  const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${month}.csv`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
