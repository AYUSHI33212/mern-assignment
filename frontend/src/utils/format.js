export function formatSalary(salary) {
  if (!salary || (salary.min == null && salary.max == null)) return 'Not disclosed';
  const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
  if (salary.min != null && salary.max != null) return `${money(salary.min)} – ${money(salary.max)}`;
  return money(salary.min ?? salary.max);
}

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });