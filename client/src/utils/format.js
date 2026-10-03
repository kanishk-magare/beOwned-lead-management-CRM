import moment from 'moment';

/** ₹75,00,000 → "₹75 L", ₹1,25,00,000 → "₹1.25 Cr" */
export function formatBudget(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} L`;
  return formatCurrency(n);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

// Format a date string or timestamp using Moment.js
export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const m = moment(value);
  if (!m.isValid()) return '—';
  return withTime ? m.format('D MMM YYYY, h:mm A') : m.format('D MMM YYYY');
}

// Format relative time (e.g. "2 hours ago", "yesterday") using Moment.js
export function formatRelativeTime(value) {
  if (!value) return '—';
  const m = moment(value);
  if (!m.isValid()) return '—';
  return m.fromNow();
}

export function formatPhone(phone) {
  const p = String(phone || '');
  return p.length === 10 ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : p;
}

export function getInitials(name) {
  if (!name) return 'L';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const trim = (n) => Number(n.toFixed(2)).toString();
