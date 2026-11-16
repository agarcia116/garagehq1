import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Wrench,
  Receipt,
  Package,
  DollarSign,
  BarChart3,
  ChevronRight,
  Clock,
  Car,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Search,
  Plus,
  Bell,
} from 'lucide-react';

type TabId = 'dashboard' | 'calendar' | 'customers' | 'repairs' | 'invoices' | 'inventory' | 'expenses' | 'reports';

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'repairs', label: 'Repair Orders', icon: Wrench },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'expenses', label: 'Expenses', icon: DollarSign },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

const APPOINTMENTS = [
  { time: '08:00', end: '09:00', customer: 'Maria Gonzalez', vehicle: '2019 Honda Civic', service: 'Oil change & inspection', bay: 'Bay 1', status: 'confirmed' },
  { time: '09:30', end: '11:30', customer: "James O'Brien", vehicle: '2017 Ford F-150', service: 'Brake pad replacement', bay: 'Bay 2', status: 'confirmed' },
  { time: '11:00', end: '12:00', customer: 'Sarah Chen', vehicle: '2021 Toyota RAV4', service: 'Check engine light', bay: 'Bay 3', status: 'confirmed' },
  { time: '13:00', end: '15:00', customer: 'David Kim', vehicle: '2015 Subaru Outback', service: 'Transmission service', bay: 'Bay 1', status: 'confirmed' },
  { time: '14:30', end: '16:00', customer: 'Lisa Martinez', vehicle: '2020 Hyundai Elantra', service: 'Tire rotation & alignment', bay: 'Bay 2', status: 'confirmed' },
];

const CUSTOMERS = [
  { name: 'Maria Gonzalez', email: 'maria.g@email.com', phone: '(512) 555-0142', vehicles: 1, since: 'Jan 2024' },
  { name: "James O'Brien", email: 'jobrien@email.com', phone: '(512) 555-0188', vehicles: 2, since: 'Mar 2024' },
  { name: 'Sarah Chen', email: 's.chen@email.com', phone: '(512) 555-0199', vehicles: 1, since: 'Jun 2024' },
  { name: 'David Kim', email: 'dkim@email.com', phone: '(512) 555-0210', vehicles: 3, since: 'Nov 2023' },
  { name: 'Lisa Martinez', email: 'lmartinez@email.com', phone: '(512) 555-0233', vehicles: 1, since: 'Feb 2025' },
  { name: 'Robert Torres', email: 'rtorres@email.com', phone: '(512) 555-0244', vehicles: 2, since: 'Sep 2024' },
];

const REPAIRS = [
  { id: 'RO-2041', vehicle: '2017 Ford F-150', customer: "James O'Brien", tech: 'Mike R.', status: 'in progress', concern: 'Grinding noise when braking', labor: 2.5, date: 'Nov 16, 2026' },
  { id: 'RO-2042', vehicle: '2021 Toyota RAV4', customer: 'Sarah Chen', tech: 'Diego M.', status: 'diagnosing', concern: 'Check engine light illuminated', labor: 1.0, date: 'Nov 16, 2026' },
  { id: 'RO-2043', vehicle: '2019 Honda Civic', customer: 'Maria Gonzalez', tech: 'Mike R.', status: 'ready for pickup', concern: 'Routine oil change', labor: 0.5, date: 'Nov 16, 2026' },
  { id: 'RO-2044', vehicle: '2015 Subaru Outback', customer: 'David Kim', tech: 'Unassigned', status: 'waiting for parts', concern: 'Transmission slipping', labor: 0, date: 'Nov 15, 2026' },
];

const INVOICES = [
  { num: 'INV-20261114-0042', customer: 'Maria Gonzalez', total: 89.5, balance: 0, status: 'paid', date: 'Nov 14, 2026' },
  { num: 'INV-20261114-0043', customer: "James O'Brien", total: 412.0, balance: 412.0, status: 'unpaid', date: 'Nov 14, 2026' },
  { num: 'INV-20261113-0041', customer: 'Sarah Chen', total: 245.0, balance: 0, status: 'paid', date: 'Nov 13, 2026' },
  { num: 'INV-20261112-0040', customer: 'David Kim', total: 678.0, balance: 339.0, status: 'partially paid', date: 'Nov 12, 2026' },
  { num: 'INV-20261110-0039', customer: 'Lisa Martinez', total: 156.0, balance: 156.0, status: 'overdue', date: 'Nov 10, 2026' },
];

const INVENTORY = [
  { name: 'Brake Pads (Front) - Ceramic', sku: 'BP-FR-001', stock: 12, reorder: 5, cost: 45.0, price: 89.99 },
  { name: 'Oil Filter - Standard', sku: 'OF-STD-015', stock: 3, reorder: 10, cost: 4.5, price: 12.99 },
  { name: 'Air Filter - Premium', sku: 'AF-PRM-022', stock: 8, reorder: 5, cost: 12.0, price: 29.99 },
  { name: 'Spark Plugs - Iridium (Set of 4)', sku: 'SP-IRD-004', stock: 0, reorder: 6, cost: 24.0, price: 59.99 },
  { name: 'Transmission Fluid (Quart)', sku: 'TF-Q-030', stock: 15, reorder: 8, cost: 7.5, price: 18.99 },
  { name: 'Brake Rotors (Front Pair)', sku: 'BR-FR-010', stock: 4, reorder: 3, cost: 68.0, price: 139.99 },
];

const EXPENSES = [
  { date: 'Nov 14, 2026', category: 'Parts & Inventory', vendor: 'AutoZone Wholesale', amount: 420.5 },
  { date: 'Nov 13, 2026', category: 'Payroll', vendor: 'Payroll Service', amount: 990.0 },
  { date: 'Nov 12, 2026', category: 'Rent & Utilities', vendor: 'Shop Landlord', amount: 280.0 },
  { date: 'Nov 11, 2026', category: 'Parts & Inventory', vendor: 'NAPA Auto Parts', amount: 185.75 },
  { date: 'Nov 10, 2026', category: 'Other', vendor: 'Shop Supplies Co.', amount: 65.3 },
];

const REVENUE_DAYS = [
  { label: 'Mon', value: 1240 },
  { label: 'Tue', value: 890 },
  { label: 'Wed', value: 2100 },
  { label: 'Thu', value: 1670 },
  { label: 'Fri', value: 2840 },
  { label: 'Sat', value: 1980 },
  { label: 'Sun', value: 0 },
];

const EXPENSE_BREAKDOWN = [
  { cat: 'Parts & Inventory', amt: 3120, pct: 49 },
  { cat: 'Payroll', amt: 1980, pct: 31 },
  { cat: 'Rent & Utilities', amt: 840, pct: 13 },
  { cat: 'Other', amt: 400, pct: 7 },
];

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const statusColors: Record<string, string> = {
  confirmed: 'bg-[#e0ece4] text-[#35634b]',
  'in progress': 'bg-[#dbe7ea] text-[#234b5a]',
  pending: 'bg-[#e8e2d6] text-[#49636b]',
  diagnosing: 'bg-[#dbe7ea] text-[#234b5a]',
  'ready for pickup': 'bg-[#e0ece4] text-[#35634b]',
  'waiting for parts': 'bg-[#f3e3bf] text-[#8d641f]',
  paid: 'bg-[#e0ece4] text-[#35634b]',
  unpaid: 'bg-[#f3e3bf] text-[#8d641f]',
  'partially paid': 'bg-[#dbe7ea] text-[#234b5a]',
  overdue: 'bg-[#f4e1d9] text-[#9a4f38]',
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[status] ?? 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}

function StatCard({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-[#e7ecea] text-[#49636b]',
    red: 'bg-[#f4e1d9] text-[#9a4f38]',
    blue: 'bg-[#e7c985]/30 text-[#8d641f]',
    orange: 'bg-[#f3e3bf] text-[#a87524]',
  };
  return (
    <div className="rounded-xl border border-[#d8d1c4] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#667b80]">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[tone]}`}>{icon}</div>
      </div>
      <p className="mt-1 text-2xl font-bold text-[#173746]">{value}</p>
    </div>
  );
}

export function DashboardDemo() {
  const [active, setActive] = useState<TabId>('dashboard');
  const currentLabel = NAV_ITEMS.find((n) => n.id === active)?.label ?? 'Dashboard';

  return (
    <div id="demo" className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#c9d4d2] bg-white shadow-2xl shadow-[#173746]/40">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-[#d8d1c4] bg-[#173746] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#e1b765]" />
          <div className="h-3 w-3 rounded-full bg-[#dbe4e5]" />
          <div className="h-3 w-3 rounded-full bg-[#b1c0c0]" />
        </div>
        <div className="ml-3 flex-1 truncate rounded-md bg-white/10 px-3 py-1 text-xs text-[#dbe4e5]">app.garagehq.com/{active === 'dashboard' ? 'dashboard' : active}</div>
      </div>

      {/* App shell: sidebar + main */}
      <div className="flex h-[560px]">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 overflow-y-auto border-r border-[#234b5a] bg-[#173746] sm:block">
          <div className="flex h-12 items-center border-b border-white/10 px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#d8a653] to-[#b9852c]">
                <Wrench className="h-4 w-4 text-[#173746]" />
              </div>
              <span className="text-sm font-extrabold tracking-tight text-white">Garage <span className="text-[#d8a653]">HQ</span></span>
            </div>
          </div>
          <nav className="space-y-1 px-3 py-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#d8a653] text-[#173746]' : 'text-[#dbe4e5] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8a653] text-xs font-bold text-[#173746]">M</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">Mike Reynolds</p>
                <p className="truncate text-[10px] capitalize text-gray-400">owner</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
            <h2 className="text-sm font-semibold text-gray-900">{currentLabel}</h2>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs font-medium text-[#49636b] sm:inline">Reynolds Auto Repair</span>
              <div className="relative">
                <Bell className="h-5 w-5 text-[#49636b]" />
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#d8a653] px-1 text-[9px] font-bold text-white">3</span>
              </div>
            </div>
          </header>

          {/* Scrollable page content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {active === 'dashboard' && <DashboardView />}
            {active === 'calendar' && <CalendarView />}
            {active === 'customers' && <CustomersView />}
            {active === 'repairs' && <RepairsView />}
            {active === 'invoices' && <InvoicesView />}
            {active === 'inventory' && <InventoryView />}
            {active === 'expenses' && <ExpensesView />}
            {active === 'reports' && <ReportsView />}
          </div>
        </div>
      </div>

      {/* Mobile tab selector */}
      <div className="flex gap-1 overflow-x-auto border-t border-[#d8d1c4] bg-[#f5f1e8] p-2 sm:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? 'bg-[#d8a653] text-[#173746]' : 'text-[#667b80] hover:bg-[#e8e2d6]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* CTA footer */}
      <div className="border-t border-[#d8d1c4] bg-white px-5 py-3.5 text-center">
        <Link to="/signup" className="inline-flex items-center gap-1 text-sm font-semibold text-[#a87524] transition-colors hover:text-[#7e571b]">
          Explore the full dashboard with a free trial
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* ---- Page views ---- */

function DashboardView() {
  const maxRevenue = Math.max(...REVENUE_DAYS.map((d) => d.value), 1);
  const quickActions = [
    { label: 'New Appointment', icon: Calendar, color: 'bg-[#d8a653] text-[#173746]' },
    { label: 'Add Customer', icon: Users, color: 'bg-[#234b5a] text-white' },
    { label: 'Repair Order', icon: Wrench, color: 'bg-[#49636b] text-white' },
    { label: 'New Estimate', icon: Receipt, color: 'bg-[#e8e2d6] text-[#173746]' },
    { label: 'New Invoice', icon: Receipt, color: 'bg-[#173746] text-white' },
    { label: 'Record Expense', icon: DollarSign, color: 'bg-[#b9852c] text-white' },
  ];

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.label} className={`flex flex-col items-center gap-2 rounded-xl ${a.color} px-3 py-4 shadow-sm`}>
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{a.label}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monthly Revenue" value={fmt(14820)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <StatCard label="Monthly Expenses" value={fmt(6340)} icon={<TrendingDown className="h-5 w-5" />} tone="red" />
        <StatCard label="Est. Operating Profit" value={fmt(8480)} icon={<Wallet className="h-5 w-5" />} tone="blue" />
        <StatCard label="Outstanding Balances" value={fmt(907)} icon={<AlertCircle className="h-5 w-5" />} tone="orange" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[#d8d1c4] bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#173746]">Today's Appointments</h3>
            <span className="text-xs text-[#a87524]">View Calendar →</span>
          </div>
          <div className="space-y-2">
            {APPOINTMENTS.slice(0, 3).map((apt) => (
              <div key={apt.time} className="flex items-center justify-between rounded-lg border border-[#e5ded2] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7c985]/30 text-[#8d641f]"><Clock className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-medium text-[#173746]">{apt.service}</p>
                    <p className="text-xs text-[#667b80]">{apt.customer} • {apt.vehicle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#3d5961]">{apt.time}</span>
                  <StatusBadge status={apt.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#d8d1c4] bg-white p-5">
          <h3 className="mb-4 font-semibold text-[#173746]">Revenue (Last 7 Days)</h3>
          <div className="flex h-40 items-end justify-between gap-2">
            {REVENUE_DAYS.map((day) => (
              <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-[#d8a653] transition-all hover:bg-[#b9852c]" style={{ height: `${(day.value / maxRevenue) * 100}%`, minHeight: day.value > 0 ? '4px' : '0' }} title={fmt(day.value)} />
                <span className="text-[10px] text-[#667b80]">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#d8d1c4] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#173746]">Vehicles In Service</h3>
            <span className="text-xs text-[#a87524]">View All →</span>
          </div>
          <div className="space-y-2">
            {REPAIRS.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-[#e5ded2] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#173746]">{r.vehicle}</p>
                  <p className="text-xs text-[#667b80]">{r.customer}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#d8d1c4] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#173746]">Unpaid Invoices</h3>
            <span className="text-xs text-[#a87524]">View All →</span>
          </div>
          <div className="space-y-2">
            {INVOICES.filter((i) => i.balance > 0).slice(0, 4).map((inv) => (
              <div key={inv.num} className="flex items-center justify-between rounded-lg border border-[#e5ded2] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#173746]">{inv.num}</p>
                  <p className="text-xs text-[#667b80]">{inv.customer}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#173746]">{fmt(inv.balance)}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-4 rounded-xl border border-[#d8d1c4] bg-white p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e7ecea] text-[#49636b]"><Users className="h-6 w-6" /></div>
          <div><p className="text-2xl font-bold text-[#173746]">47</p><p className="text-sm text-[#667b80]">Total Customers</p></div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[#d8d1c4] bg-white p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e7c985]/30 text-[#8d641f]"><Car className="h-6 w-6" /></div>
          <div><p className="text-2xl font-bold text-[#173746]">62</p><p className="text-sm text-[#667b80]">Total Vehicles</p></div>
        </div>
      </div>
    </div>
  );
}

function CalendarView() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = 16;
  const apptsByDay: Record<number, { time: string; service: string; status: string }[]> = {
    16: [{ time: '8:00', service: 'Oil change', status: 'confirmed' }, { time: '9:30', service: 'Brake pads', status: 'confirmed' }, { time: '11:00', service: 'Check engine', status: 'confirmed' }],
    17: [{ time: '9:00', service: 'Tire rotation', status: 'confirmed' }],
    18: [{ time: '10:00', service: 'Inspection', status: 'confirmed' }],
    19: [{ time: '14:00', service: 'Transmission', status: 'confirmed' }],
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">November 2026</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300">
            {['day', 'week', 'month'].map((m, i) => (
              <span key={m} className={`px-3 py-1.5 text-xs font-medium capitalize ${i === 2 ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>{m}</span>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> New Appointment</span>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {days.map((d) => <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold uppercase text-gray-500">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }, (_, i) => {
            const dayNum = i - 6;
            const isToday = dayNum === today;
            const appts = apptsByDay[dayNum];
            return (
              <div key={i} className={`min-h-16 border-b border-r border-gray-100 p-1 ${isToday ? 'bg-blue-50' : ''}`}>
                {dayNum > 0 && dayNum <= 30 && <p className={`mb-0.5 text-[10px] font-medium ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>{dayNum}</p>}
                <div className="space-y-0.5">
                  {appts?.slice(0, 2).map((a, j) => (
                    <div key={j} className={`truncate rounded px-1 py-0.5 text-[9px] text-white ${a.status === 'confirmed' ? 'bg-blue-500' : 'bg-gray-400'}`}>{a.time} {a.service}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CustomersView() {
  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <div className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-400">Search customers...</div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Add Customer</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CUSTOMERS.map((c) => (
          <div key={c.name} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {c.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500">Since {c.since}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-gray-400" />{c.phone}</p>
              <p className="flex items-center gap-2 truncate"><Receipt className="h-3.5 w-3.5 shrink-0 text-gray-400" />{c.email}</p>
              <p className="flex items-center gap-2"><Car className="h-3.5 w-3.5 text-gray-400" />{c.vehicles} vehicle(s)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepairsView() {
  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-gray-500">{REPAIRS.length} repair orders</h3>
        <span className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> New Repair Order</span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {REPAIRS.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{r.vehicle}</p>
                <p className="text-sm text-gray-500">{r.customer} • {r.tech}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <p className="mb-2 text-sm text-gray-600"><span className="font-medium">Concern:</span> {r.concern}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{r.date}</span>
              {r.labor > 0 && <span>{r.labor}h labor</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoicesView() {
  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-gray-500">{INVOICES.length} invoices</h3>
        <span className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> New Invoice</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-gray-500">Invoice #</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-gray-500">Customer</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-gray-500">Total</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-gray-500">Balance</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {INVOICES.map((inv) => (
              <tr key={inv.num} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-xs font-medium text-gray-900">{inv.num}</td>
                <td className="px-3 py-2.5 text-xs text-gray-700">{inv.customer}</td>
                <td className="px-3 py-2.5 text-xs font-semibold text-gray-900">{fmt(inv.total)}</td>
                <td className="px-3 py-2.5 text-xs font-semibold text-gray-900">{fmt(inv.balance)}</td>
                <td className="px-3 py-2.5"><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryView() {
  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-gray-500">{INVENTORY.length} parts in stock</h3>
        <span className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Add Part</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-gray-500">Part Name</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-gray-500">SKU</th>
              <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase text-gray-500">Stock</th>
              <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase text-gray-500">Cost</th>
              <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase text-gray-500">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {INVENTORY.map((item) => (
              <tr key={item.sku} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-xs font-medium text-gray-900">{item.name}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{item.sku}</td>
                <td className="px-3 py-2.5 text-center text-xs">
                  <span className={item.stock === 0 ? 'font-bold text-red-600' : item.stock <= item.reorder ? 'font-semibold text-orange-600' : 'text-gray-700'}>{item.stock}</span>
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-gray-700">{fmt(item.cost)}</td>
                <td className="px-3 py-2.5 text-right text-xs font-semibold text-gray-900">{fmt(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpensesView() {
  const categoryColors: Record<string, string> = {
    'Parts & Inventory': 'bg-blue-100 text-blue-700',
    Payroll: 'bg-green-100 text-green-700',
    'Rent & Utilities': 'bg-purple-100 text-purple-700',
    Other: 'bg-gray-100 text-gray-700',
  };
  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-gray-500">November 2026 • {fmt(1741.55)} total</h3>
        <span className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" /> Record Expense</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-gray-500">Date</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-gray-500">Category</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-gray-500">Vendor</th>
              <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {EXPENSES.map((e, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-xs text-gray-500">{e.date}</td>
                <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColors[e.category]}`}>{e.category}</span></td>
                <td className="px-3 py-2.5 text-xs text-gray-700">{e.vendor}</td>
                <td className="px-3 py-2.5 text-right text-xs font-semibold text-gray-900">{fmt(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsView() {
  return (
    <div className="space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Financial Reports</h3>
        <span className="text-xs text-gray-500">Nov 2026</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Revenue (MTD)" value={fmt(14820)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <StatCard label="Expenses (MTD)" value={fmt(6340)} icon={<TrendingDown className="h-5 w-5" />} tone="red" />
        <StatCard label="Net Profit" value={fmt(8480)} icon={<Wallet className="h-5 w-5" />} tone="blue" />
      </div>
      <div className="rounded-xl border border-[#d8d1c4] bg-white p-5">
        <h4 className="mb-4 font-semibold text-[#173746]">Revenue — Last 7 Days</h4>
        <div className="flex h-40 items-end justify-between gap-2">
          {REVENUE_DAYS.map((d) => {
            const max = Math.max(...REVENUE_DAYS.map((x) => x.value), 1);
            return (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-[#d8a653] transition-all hover:bg-[#b9852c]" style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }} title={fmt(d.value)} />
                <span className="text-[10px] text-[#667b80]">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border border-[#d8d1c4] bg-white p-5">
        <h4 className="mb-3 font-semibold text-[#173746]">Expense Breakdown</h4>
        <div className="space-y-2.5">
          {EXPENSE_BREAKDOWN.map((e) => (
            <div key={e.cat}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-[#49636b]">{e.cat}</span>
                <span className="font-medium text-[#173746]">{fmt(e.amt)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e8e2d6]">
                <div className="h-full rounded-full bg-[#d8a653]" style={{ width: `${e.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
