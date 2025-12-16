export function formatCurrency(amount) {
  if (typeof amount !== 'number') return amount;
  return amount.toLocaleString('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  });
}

export function formatDateShort(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
