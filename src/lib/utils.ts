export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${minutes} ${ampm}`;
}

export function fullName(customer: { first_name: string; last_name: string }): string {
  return `${customer.first_name} ${customer.last_name}`;
}

export function vehicleLabel(v: { year: number | null; make: string; model: string }): string {
  return `${v.year ?? ''} ${v.make} ${v.model}`.trim();
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
}

export function statusColors(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-[#e8e2d6] text-[#49636b]',
    diagnosing: 'bg-[#dbe7ea] text-[#234b5a]',
    'awaiting approval': 'bg-[#f3e3bf] text-[#8d641f]',
    'in progress': 'bg-[#dbe7ea] text-[#234b5a]',
    'waiting for parts': 'bg-[#f3e3bf] text-[#8d641f]',
    completed: 'bg-[#e0ece4] text-[#35634b]',
    'ready for pickup': 'bg-[#e0ece4] text-[#35634b]',
    draft: 'bg-[#e8e2d6] text-[#49636b]',
    sent: 'bg-[#dbe7ea] text-[#234b5a]',
    approved: 'bg-[#e0ece4] text-[#35634b]',
    declined: 'bg-[#f4e1d9] text-[#9a4f38]',
    unpaid: 'bg-[#f3e3bf] text-[#8d641f]',
    paid: 'bg-[#e0ece4] text-[#35634b]',
    'partially paid': 'bg-[#f3e3bf] text-[#8d641f]',
    overdue: 'bg-[#f4e1d9] text-[#9a4f38]',
    requested: 'bg-[#f3e3bf] text-[#8d641f]',
    confirmed: 'bg-[#e0ece4] text-[#35634b]',
    cancelled: 'bg-[#f4e1d9] text-[#9a4f38]',
    completed_apt: 'bg-[#e8e2d6] text-[#49636b]',
  };
  return map[status.toLowerCase()] || 'bg-gray-100 text-gray-700';
}

export function expenseCategories(): string[] {
  return ['parts', 'payroll', 'rent', 'utilities', 'equipment', 'insurance', 'software', 'supplies', 'marketing', 'other'];
}
