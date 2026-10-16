import { classNames } from '@/lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
}

export function Badge({ status, label }: BadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        statusColors(status)
      )}
    >
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}

function statusColors(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    diagnosing: 'bg-blue-100 text-blue-700',
    'awaiting approval': 'bg-orange-100 text-orange-700',
    'awaiting_approval': 'bg-orange-100 text-orange-700',
    'in progress': 'bg-blue-100 text-blue-700',
    'in_progress': 'bg-blue-100 text-blue-700',
    'waiting for parts': 'bg-yellow-100 text-yellow-700',
    'waiting_for_parts': 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    'ready for pickup': 'bg-green-100 text-green-700',
    'ready_for_pickup': 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    unpaid: 'bg-orange-100 text-orange-700',
    paid: 'bg-green-100 text-green-700',
    'partially paid': 'bg-yellow-100 text-yellow-700',
    'partially_paid': 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    requested: 'bg-orange-100 text-orange-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return map[status.toLowerCase()] || 'bg-gray-100 text-gray-700';
}
