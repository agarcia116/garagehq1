import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wrench,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Car,
  ChevronRight,
} from 'lucide-react';

type TabId = 'dashboard' | 'appointments' | 'customers' | 'repairs' | 'invoices' | 'reports';

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'repairs', label: 'Repair Orders', icon: Wrench },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

const APPOINTMENTS = [
  { time: '8:00 AM', customer: 'Maria Gonzalez', vehicle: '2019 Honda Civic', service: 'Oil change & inspection', bay: 'Bay 1', status: 'Confirmed' },
  { time: '9:30 AM', customer: 'James O\'Brien', vehicle: '2017 Ford F-150', service: 'Brake pad replacement', bay: 'Bay 2', status: 'In Progress' },
  { time: '11:00 AM', customer: 'Sarah Chen', vehicle: '2021 Toyota RAV4', service: 'Check engine light', bay: 'Bay 3', status: 'Confirmed' },
  { time: '1:00 PM', customer: 'David Kim', vehicle: '2015 Subaru Outback', service: 'Transmission service', bay: 'Bay 1', status: 'Pending' },
  { time: '2:30 PM', customer: 'Lisa Martinez', vehicle: '2020 Hyundai Elantra', service: 'Tire rotation & alignment', bay: 'Bay 2', status: 'Confirmed' },
];

const CUSTOMERS = [
  { name: 'Maria Gonzalez', vehicle: '2019 Honda Civic', visits: 12, lastVisit: 'Nov 12, 2026', totalSpent: 3480 },
  { name: 'James O\'Brien', vehicle: '2017 Ford F-150', visits: 8, lastVisit: 'Nov 8, 2026', totalSpent: 5210 },
  { name: 'Sarah Chen', vehicle: '2021 Toyota RAV4', visits: 5, lastVisit: 'Nov 14, 2026', totalSpent: 1890 },
  { name: 'David Kim', vehicle: '2015 Subaru Outback', visits: 15, lastVisit: 'Nov 10, 2026', totalSpent: 7340 },
  { name: 'Lisa Martinez', vehicle: '2020 Hyundai Elantra', visits: 7, lastVisit: 'Nov 15, 2026', totalSpent: 2650 },
];

const REPAIRS = [
  { id: 'RO-2041', vehicle: '2017 Ford F-150', customer: 'James O\'Brien', tech: 'Mike R.', status: 'In Progress', concern: 'Grinding noise when braking', hours: 2.5 },
  { id: 'RO-2042', vehicle: '2021 Toyota RAV4', customer: 'Sarah Chen', tech: 'Diego M.', status: 'Diagnosing', concern: 'Check engine light illuminated', hours: 1.0 },
  { id: 'RO-2043', vehicle: '2019 Honda Civic', customer: 'Maria Gonzalez', tech: 'Mike R.', status: 'Ready for Pickup', concern: 'Routine oil change', hours: 0.5 },
  { id: 'RO-2044', vehicle: '2015 Subaru Outback', customer: 'David Kim', tech: 'Unassigned', status: 'Awaiting Parts', concern: 'Transmission slipping', hours: 0 },
];

const INVOICES = [
  { num: 'INV-20261114-0042', customer: 'Maria Gonzalez', total: 89.5, paid: 89.5, status: 'Paid' },
  { num: 'INV-20261114-0043', customer: 'James O\'Brien', total: 412.0, paid: 0, status: 'Unpaid' },
  { num: 'INV-20261113-0041', customer: 'Sarah Chen', total: 245.0, paid: 245.0, status: 'Paid' },
  { num: 'INV-20261112-0040', customer: 'David Kim', total: 678.0, paid: 339.0, status: 'Partially Paid' },
  { num: 'INV-20261110-0039', customer: 'Lisa Martinez', total: 156.0, paid: 0, status: 'Overdue' },
];

const REPORT_DAYS = [
  { label: 'Mon', value: 1240 },
  { label: 'Tue', value: 890 },
  { label: 'Wed', value: 2100 },
  { label: 'Thu', value: 1670 },
  { label: 'Fri', value: 2840 },
  { label: 'Sat', value: 1980 },
  { label: 'Sun', value: 0 },
];

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    'Confirmed': 'bg-blue-500/15 text-blue-300',
    'In Progress': 'bg-amber-500/15 text-amber-300',
    'Pending': 'bg-slate-500/15 text-slate-300',
    'Diagnosing': 'bg-cyan-500/15 text-cyan-300',
    'Ready for Pickup': 'bg-emerald-500/15 text-emerald-300',
    'Awaiting Parts': 'bg-orange-500/15 text-orange-300',
    'Paid': 'bg-emerald-500/15 text-emerald-300',
    'Unpaid': 'bg-amber-500/15 text-amber-300',
    'Partially Paid': 'bg-blue-500/15 text-blue-300',
    'Overdue': 'bg-red-500/15 text-red-300',
    'Unassigned': 'bg-slate-500/15 text-slate-400',
  };
  return map[status] ?? 'bg-slate-500/15 text-slate-300';
};

function StatCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'up' | 'down' | 'neutral' }) {
  const accent = tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-red-400' : 'text-blue-400';
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
        <span className={accent}>{icon}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export function DashboardDemo() {
  const [active, setActive] = useState<TabId>('dashboard');

  return (
    <div id="demo" className="rounded-2xl border border-white/10 bg-[#0c1a2e] shadow-2xl shadow-blue-950/40 overflow-hidden scroll-mt-24">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#0a1426] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400/70" />
          <div className="h-3 w-3 rounded-full bg-amber-400/70" />
          <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
        </div>
        <div className="ml-3 flex-1 truncate rounded-md bg-white/5 px-3 py-1 text-xs text-slate-400">
          app.garagehq.com/dashboard
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar tabs */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 bg-[#0a1426] p-3 md:flex-col md:overflow-visible md:border-b-0 md:border-r">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-300 shadow-inner'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 p-4 md:p-6">
          {active === 'dashboard' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Shop Overview</h3>
                  <p className="text-xs text-slate-400">Today is Monday, November 16, 2026</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">3 bays active</span>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Revenue (MTD)" value={fmt(14820)} tone="up" icon={<TrendingUp className="h-4 w-4" />} />
                <StatCard label="Expenses (MTD)" value={fmt(6340)} tone="down" icon={<TrendingDown className="h-4 w-4" />} />
                <StatCard label="Est. Profit" value={fmt(8480)} tone="up" icon={<Wallet className="h-4 w-4" />} />
                <StatCard label="Outstanding" value={fmt(891)} tone="neutral" icon={<Clock className="h-4 w-4" />} />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h4 className="mb-3 text-sm font-semibold text-white">Today's Schedule</h4>
                <div className="space-y-2">
                  {APPOINTMENTS.slice(0, 3).map((a) => (
                    <div key={a.time} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-xs font-medium text-blue-300">{a.time}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{a.service}</p>
                          <p className="truncate text-xs text-slate-400">{a.customer} • {a.vehicle}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(a.status)}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-white">Vehicles In Service</h4>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Car className="h-5 w-5 text-blue-400" />
                    <span className="text-2xl font-bold text-white">4</span>
                    <span className="text-xs text-slate-400">across 3 bays</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-white">Revenue (7 days)</h4>
                  <div className="flex items-center gap-2 text-slate-300">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <span className="text-2xl font-bold text-white">{fmt(10720)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'appointments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Today's Appointments</h3>
                <span className="text-xs text-slate-400">5 scheduled • 3 bays</span>
              </div>
              <div className="space-y-2">
                {APPOINTMENTS.map((a) => (
                  <div key={a.time} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                        <span className="text-[10px] leading-none">{a.time.split(' ')[1]}</span>
                        <span className="text-sm font-bold leading-tight">{a.time.split(' ')[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{a.service}</p>
                        <p className="truncate text-xs text-slate-400">{a.customer} • {a.vehicle}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{a.bay}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 self-start rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusBadge(a.status)}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'customers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Customers</h3>
                <span className="text-xs text-slate-400">47 total</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Customer</th>
                      <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Vehicle</th>
                      <th className="px-4 py-2.5 text-center font-medium">Visits</th>
                      <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {CUSTOMERS.map((c) => (
                      <tr key={c.name} className="text-slate-200 transition-colors hover:bg-white/5">
                        <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                        <td className="hidden px-4 py-3 text-slate-400 sm:table-cell">{c.vehicle}</td>
                        <td className="px-4 py-3 text-center text-slate-300">{c.visits}</td>
                        <td className="hidden px-4 py-3 text-right font-medium text-emerald-300 sm:table-cell">{fmt(c.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'repairs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Active Repair Orders</h3>
                <span className="text-xs text-slate-400">4 open</span>
              </div>
              <div className="space-y-2.5">
                {REPAIRS.map((r) => (
                  <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">{r.id}</span>
                          <span className="truncate text-sm font-semibold text-white">{r.vehicle}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-400">{r.customer}</p>
                        <p className="mt-1 text-xs text-slate-500">"{r.concern}"</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusBadge(r.status)}`}>{r.status}</span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-2.5 text-xs">
                      <span className="text-slate-400">Tech: <span className={r.tech === 'Unassigned' ? 'text-slate-500' : 'text-slate-200'}>{r.tech}</span></span>
                      <span className="text-slate-400">{r.hours}h labor</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'invoices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Invoices</h3>
                <span className="text-xs text-slate-400">{fmt(1579.5)} outstanding</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Invoice #</th>
                      <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Customer</th>
                      <th className="px-4 py-2.5 text-right font-medium">Total</th>
                      <th className="px-4 py-2.5 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {INVOICES.map((inv) => (
                      <tr key={inv.num} className="text-slate-200 transition-colors hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-xs text-white">{inv.num}</td>
                        <td className="hidden px-4 py-3 text-slate-400 sm:table-cell">{inv.customer}</td>
                        <td className="px-4 py-3 text-right font-medium text-white">{fmt(inv.total)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusBadge(inv.status)}`}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {active === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Financial Reports</h3>
                <span className="text-xs text-slate-400">Nov 2026</span>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatCard label="Revenue (MTD)" value={fmt(14820)} tone="up" icon={<TrendingUp className="h-4 w-4" />} />
                <StatCard label="Expenses (MTD)" value={fmt(6340)} tone="down" icon={<TrendingDown className="h-4 w-4" />} />
                <StatCard label="Net Profit" value={fmt(8480)} tone="up" icon={<Wallet className="h-4 w-4" />} />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h4 className="mb-4 text-sm font-semibold text-white">Revenue — Last 7 Days</h4>
                <div className="flex h-44 items-end justify-between gap-2">
                  {REPORT_DAYS.map((d) => {
                    const max = Math.max(...REPORT_DAYS.map((x) => x.value), 1);
                    return (
                      <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                            style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
                            title={fmt(d.value)}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{d.label}</span>
                        <span className="text-[9px] text-slate-500">{d.value > 0 ? fmt(d.value).replace('.00', '') : '-'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h4 className="mb-3 text-sm font-semibold text-white">Expense Breakdown</h4>
                <div className="space-y-2.5">
                  {[
                    { cat: 'Parts & Inventory', amt: 3120, pct: 49 },
                    { cat: 'Payroll', amt: 1980, pct: 31 },
                    { cat: 'Rent & Utilities', amt: 840, pct: 13 },
                    { cat: 'Other', amt: 400, pct: 7 },
                  ].map((e) => (
                    <div key={e.cat}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-slate-300">{e.cat}</span>
                        <span className="font-medium text-white">{fmt(e.amt)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-blue-500/70" style={{ width: `${e.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0a1426] px-5 py-3.5 text-center">
        <Link
          to="/signup"
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300"
        >
          Explore the full dashboard with a free trial
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
