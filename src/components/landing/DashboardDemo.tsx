import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CalendarPlus,
  Car,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Receipt,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { ReactNode } from 'react';

const QUICK_ACTIONS = [
  { label: 'New Appointment', icon: CalendarPlus, color: 'bg-[#d8a653] text-[#173746] hover:bg-[#e1b765]' },
  { label: 'Add Customer', icon: UserPlus, color: 'bg-[#234b5a] text-white hover:bg-[#2d5d6d]' },
  { label: 'Repair Order', icon: Wrench, color: 'bg-[#49636b] text-white hover:bg-[#5d7780]' },
  { label: 'New Estimate', icon: FileText, color: 'bg-[#e8e2d6] text-[#173746] hover:bg-[#ddd4c5]' },
  { label: 'New Invoice', icon: Receipt, color: 'bg-[#173746] text-white hover:bg-[#234b5a]' },
  { label: 'Record Expense', icon: DollarSign, color: 'bg-[#b9852c] text-white hover:bg-[#a87524]' },
];

const APPOINTMENTS = [
  { time: '8:00 AM', customer: 'Maria Gonzalez', vehicle: '2019 Honda Civic', service: 'Oil change & inspection', status: 'confirmed' },
  { time: '9:30 AM', customer: "James O'Brien", vehicle: '2017 Ford F-150', service: 'Brake pad replacement', status: 'in progress' },
  { time: '11:00 AM', customer: 'Sarah Chen', vehicle: '2021 Toyota RAV4', service: 'Check engine light', status: 'confirmed' },
];

const REPAIRS = [
  { vehicle: '2017 Ford F-150', customer: "James O'Brien", status: 'in progress' },
  { vehicle: '2021 Toyota RAV4', customer: 'Sarah Chen', status: 'diagnosing' },
  { vehicle: '2019 Honda Civic', customer: 'Maria Gonzalez', status: 'ready for pickup' },
  { vehicle: '2015 Subaru Outback', customer: 'David Kim', status: 'waiting for parts' },
];

const INVOICES = [
  { number: 'INV-20261114-0043', customer: "James O'Brien", balance: 412, status: 'unpaid' },
  { number: 'INV-20261112-0040', customer: 'David Kim', balance: 339, status: 'partially paid' },
  { number: 'INV-20261110-0039', customer: 'Lisa Martinez', balance: 156, status: 'overdue' },
];

const REVENUE = [
  { label: 'Mon', value: 1240 },
  { label: 'Tue', value: 890 },
  { label: 'Wed', value: 2100 },
  { label: 'Thu', value: 1670 },
  { label: 'Fri', value: 2840 },
  { label: 'Sat', value: 1980 },
  { label: 'Sun', value: 0 },
];

const statusColors: Record<string, string> = {
  confirmed: 'bg-[#e0ece4] text-[#35634b]',
  'in progress': 'bg-[#dbe7ea] text-[#234b5a]',
  diagnosing: 'bg-[#dbe7ea] text-[#234b5a]',
  'ready for pickup': 'bg-[#e0ece4] text-[#35634b]',
  'waiting for parts': 'bg-[#f3e3bf] text-[#8d641f]',
  unpaid: 'bg-[#f3e3bf] text-[#8d641f]',
  'partially paid': 'bg-[#dbe7ea] text-[#234b5a]',
  overdue: 'bg-[#f4e1d9] text-[#9a4f38]',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

function StatCard({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-[#e7ecea] text-[#49636b]',
    red: 'bg-[#f4e1d9] text-[#9a4f38]',
    blue: 'bg-[#e7c985]/30 text-[#8d641f]',
    orange: 'bg-[#f3e3bf] text-[#a87524]',
  };

  return (
    <div className="rounded-xl border border-[#d8d1c4] bg-[#ffffff] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#667b80]">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[tone]}`}>{icon}</div>
      </div>
      <p className="mt-1 text-2xl font-bold text-[#173746]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[status]}`}>{status}</span>;
}

export function DashboardDemo() {
  const maxRevenue = Math.max(...REVENUE.map((day) => day.value), 1);

  return (
    <div id="demo" className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#c9d4d2] bg-[#ffffff] shadow-2xl shadow-[#173746]/40">
      <div className="flex items-center gap-2 border-b border-[#d8d1c4] bg-[#173746] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#e1b765]" />
          <div className="h-3 w-3 rounded-full bg-[#dbe4e5]" />
          <div className="h-3 w-3 rounded-full bg-[#b1c0c0]" />
        </div>
        <div className="ml-3 flex-1 truncate rounded-md bg-white/10 px-3 py-1 text-xs text-[#dbe4e5]">app.garagehq.com/dashboard</div>
      </div>

      <div className="space-y-5 bg-[#f5f1e8] p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map(({ label, icon: Icon, color }) => (
            <button key={label} className={`flex flex-col items-center gap-2 rounded-xl ${color} px-3 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}>
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Monthly Revenue" value={formatCurrency(14820)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
          <StatCard label="Monthly Expenses" value={formatCurrency(6340)} icon={<TrendingDown className="h-5 w-5" />} tone="red" />
          <StatCard label="Est. Operating Profit" value={formatCurrency(8480)} icon={<Wallet className="h-5 w-5" />} tone="blue" />
          <StatCard label="Outstanding Balances" value={formatCurrency(891)} icon={<AlertCircle className="h-5 w-5" />} tone="orange" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[#d8d1c4] bg-[#ffffff] p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#173746]">Today's Appointments</h3>
              <span className="text-xs font-medium text-[#a87524]">View Calendar →</span>
            </div>
            <div className="space-y-2">
              {APPOINTMENTS.map((appointment) => (
                <div key={appointment.time} className="flex items-center justify-between rounded-lg border border-[#e5ded2] px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7c985]/30 text-[#8d641f]"><Clock className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[#173746]">{appointment.service}</p>
                      <p className="truncate text-[11px] text-[#667b80]">{appointment.customer} • {appointment.vehicle}</p>
                    </div>
                  </div>
                  <div className="ml-2 flex shrink-0 items-center gap-2"><span className="text-xs font-medium text-[#3d5961]">{appointment.time}</span><StatusBadge status={appointment.status} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#d8d1c4] bg-[#ffffff] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#173746]">Revenue (Last 7 Days)</h3>
            <div className="flex h-32 items-end justify-between gap-1.5">
              {REVENUE.map((day) => (
                <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-[#d8a653] transition-all hover:bg-[#b9852c]" style={{ height: `${(day.value / maxRevenue) * 100}%`, minHeight: day.value > 0 ? '4px' : '0' }} title={formatCurrency(day.value)} />
                  <span className="text-[9px] text-[#667b80]">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DemoList title="Vehicles In Service" action="View All →">
            {REPAIRS.map((repair) => <div key={repair.vehicle} className="flex items-center justify-between rounded-lg border border-[#e5ded2] px-3 py-2.5"><div><p className="text-xs font-medium text-[#173746]">{repair.vehicle}</p><p className="text-[11px] text-[#667b80]">{repair.customer}</p></div><StatusBadge status={repair.status} /></div>)}
          </DemoList>
          <DemoList title="Unpaid Invoices" action="View All →">
            {INVOICES.map((invoice) => <div key={invoice.number} className="flex items-center justify-between rounded-lg border border-[#e5ded2] px-3 py-2.5"><div><p className="text-xs font-medium text-[#173746]">{invoice.number}</p><p className="text-[11px] text-[#667b80]">{invoice.customer}</p></div><div className="flex items-center gap-2"><span className="text-xs font-semibold text-[#173746]">{formatCurrency(invoice.balance)}</span><StatusBadge status={invoice.status} /></div></div>)}
          </DemoList>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CountCard icon={<Users className="h-5 w-5" />} value="47" label="Total Customers" />
          <CountCard icon={<Car className="h-5 w-5" />} value="62" label="Total Vehicles" gold />
        </div>
      </div>

      <div className="border-t border-[#d8d1c4] bg-[#ffffff] px-5 py-3.5 text-center">
        <Link to="/signup" className="inline-flex items-center gap-1 text-sm font-semibold text-[#a87524] transition-colors hover:text-[#7e571b]">Explore the full dashboard with a free trial<ChevronRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}

function DemoList({ title, action, children }: { title: string; action: string; children: ReactNode }) {
  return <div className="rounded-xl border border-[#d8d1c4] bg-[#ffffff] p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-[#173746]">{title}</h3><span className="text-xs font-medium text-[#a87524]">{action}</span></div><div className="space-y-2">{children}</div></div>;
}

function CountCard({ icon, value, label, gold = false }: { icon: ReactNode; value: string; label: string; gold?: boolean }) {
  return <div className="flex items-center gap-3 rounded-xl border border-[#d8d1c4] bg-[#ffffff] p-4"><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${gold ? 'bg-[#e7c985]/30 text-[#8d641f]' : 'bg-[#e7ecea] text-[#49636b]'}`}>{icon}</div><div><p className="text-xl font-bold text-[#173746]">{value}</p><p className="text-xs text-[#667b80]">{label}</p></div></div>;
}
