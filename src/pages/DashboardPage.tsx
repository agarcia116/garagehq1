import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, fullName, vehicleLabel, statusColors } from '@/lib/utils';
import type { Appointment, RepairOrder, Invoice, Expense, Customer, Vehicle } from '@/lib/types';
import {
  CalendarPlus,
  UserPlus,
  FileText,
  Wrench,
  DollarSign,
  Receipt,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  AlertCircle,
  Car,
  Users,
} from 'lucide-react';

interface Stats {
  todayAppointments: Appointment[];
  activeRepairs: RepairOrder[];
  pendingEstimates: number;
  unpaidInvoices: Invoice[];
  monthlyRevenue: number;
  monthlyExpenses: number;
  estimatedProfit: number;
  totalCustomers: number;
  totalVehicles: number;
}

export function DashboardPage() {
  const { shop, member } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});
  const [revenueData, setRevenueData] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    if (!shop) return;
    loadData();
  }, [shop]);

  async function loadData() {
    if (!shop) return;
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const [appts, repairs, estimates, invoices, expenses, custs, vehs] = await Promise.all([
      supabase.from('appointments').select('*').eq('shop_id', shop.id).eq('appointment_date', today),
      supabase.from('repair_orders').select('*').eq('shop_id', shop.id).not('status', 'in', '("completed","ready for pickup")'),
      supabase.from('estimates').select('*').eq('shop_id', shop.id).eq('status', 'sent'),
      supabase.from('invoices').select('*').eq('shop_id', shop.id).in('status', ['unpaid', 'partially paid', 'overdue']),
      supabase.from('expenses').select('*').eq('shop_id', shop.id).gte('expense_date', monthStartStr),
      supabase.from('customers').select('*').eq('shop_id', shop.id),
      supabase.from('vehicles').select('*').eq('shop_id', shop.id),
    ]);

    const custMap: Record<string, Customer> = {};
    (custs.data as Customer[] | null)?.forEach((c) => { custMap[c.id] = c; });
    setCustomers(custMap);

    const vehMap: Record<string, Vehicle> = {};
    (vehs.data as Vehicle[] | null)?.forEach((v) => { vehMap[v.id] = v; });
    setVehicles(vehMap);

    const monthlyRevenue = (invoices.data as Invoice[] | null)
      ?.filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount_paid, 0) ?? 0;

    const monthlyExpenses = (expenses.data as Expense[] | null)
      ?.reduce((sum, exp) => sum + exp.amount, 0) ?? 0;

    setStats({
      todayAppointments: (appts.data as Appointment[] | null) ?? [],
      activeRepairs: (repairs.data as RepairOrder[] | null) ?? [],
      pendingEstimates: estimates.data?.length ?? 0,
      unpaidInvoices: (invoices.data as Invoice[] | null) ?? [],
      monthlyRevenue,
      monthlyExpenses,
      estimatedProfit: monthlyRevenue - monthlyExpenses,
      totalCustomers: custs.data?.length ?? 0,
      totalVehicles: vehs.data?.length ?? 0,
    });

    // Build 7-day revenue chart
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ label: dayLabel, value: 0 });
    }
    // Get this week's paid invoices
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const { data: weekInvoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('status', 'paid')
      .gte('paid_at', weekStart.toISOString());

    (weekInvoices as Invoice[] | null)?.forEach((inv) => {
      if (inv.paid_at) {
        const invDate = new Date(inv.paid_at).toISOString().split('T')[0];
        const dayIndex = days.findIndex((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0] === invDate;
        });
        if (dayIndex >= 0) days[dayIndex].value += inv.amount_paid;
      }
    });
    setRevenueData(days);
    setLoading(false);
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#d8a653]" />
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueData.map((d) => d.value), 1);

  const quickActions = [
    { label: 'New Appointment', icon: <CalendarPlus className="h-5 w-5" />, onClick: () => navigate('/calendar'), color: 'bg-[#d8a653] text-[#173746] hover:bg-[#e1b765]' },
    { label: 'Add Customer', icon: <UserPlus className="h-5 w-5" />, onClick: () => navigate('/customers'), color: 'bg-[#234b5a] text-white hover:bg-[#2d5d6d]' },
    { label: 'Repair Order', icon: <Wrench className="h-5 w-5" />, onClick: () => navigate('/repair-orders'), color: 'bg-[#49636b] text-white hover:bg-[#5d7780]' },
    { label: 'New Estimate', icon: <FileText className="h-5 w-5" />, onClick: () => navigate('/estimates'), color: 'bg-[#e8e2d6] text-[#173746] hover:bg-[#ddd4c5]' },
    { label: 'New Invoice', icon: <Receipt className="h-5 w-5" />, onClick: () => navigate('/invoices'), color: 'bg-[#173746] text-white hover:bg-[#234b5a]' },
    { label: 'Record Expense', icon: <DollarSign className="h-5 w-5" />, onClick: () => navigate('/expenses'), color: 'bg-[#b9852c] text-white hover:bg-[#a87524]' },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`flex flex-col items-center gap-2 rounded-xl ${action.color} px-3 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
          >
            {action.icon}
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(stats.monthlyExpenses)}
          icon={<TrendingDown className="h-5 w-5" />}
          color="red"
        />
        <StatCard
          label="Est. Operating Profit"
          value={formatCurrency(stats.estimatedProfit)}
          icon={<Wallet className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          label="Outstanding Balances"
          value={formatCurrency(stats.unpaidInvoices.reduce((s, i) => s + i.balance_due, 0))}
          icon={<AlertCircle className="h-5 w-5" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Appointments */}
        <div className="lg:col-span-2 rounded-xl border border-[#d8d1c4] bg-[#fffdf8] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[#173746]">Today's Appointments</h2>
            <button onClick={() => navigate('/calendar')} className="text-sm text-[#a87524] hover:text-[#7e571b]">
              View Calendar →
            </button>
          </div>
          {stats.todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CalendarPlus className="mb-2 h-8 w-8 text-[#b1c0c0]" />
              <p className="text-sm text-[#667b80]">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.todayAppointments.map((apt) => {
                const cust = apt.customer_id ? customers[apt.customer_id] : null;
                const veh = apt.vehicle_id ? vehicles[apt.vehicle_id] : null;
                return (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border border-[#e5ded2] px-4 py-3 hover:bg-[#f5f1e8] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e7c985]/30 text-[#8d641f]">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#173746]">{apt.service_description}</p>
                        <p className="text-xs text-[#667b80]">
                          {cust ? fullName(cust) : 'Walk-in'}{veh ? ` • ${vehicleLabel(veh)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#3d5961]">{apt.start_time}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="rounded-xl border border-[#d8d1c4] bg-[#fffdf8] p-5">
          <h2 className="mb-4 font-semibold text-[#173746]">Revenue (Last 7 Days)</h2>
          <div className="flex h-40 items-end justify-between gap-2">
            {revenueData.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[#d8a653] transition-all hover:bg-[#b9852c]"
                  style={{ height: `${(day.value / maxRevenue) * 100}%`, minHeight: day.value > 0 ? '4px' : '0' }}
                  title={formatCurrency(day.value)}
                />
                <span className="text-[10px] text-[#667b80]">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Repairs */}
        <div className="rounded-xl border border-[#d8d1c4] bg-[#fffdf8] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[#173746]">Vehicles In Service</h2>
            <button onClick={() => navigate('/repair-orders')} className="text-sm text-[#a87524] hover:text-[#7e571b]">
              View All →
            </button>
          </div>
          {stats.activeRepairs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Car className="mb-2 h-8 w-8 text-[#b1c0c0]" />
              <p className="text-sm text-[#667b80]">No vehicles currently being serviced</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.activeRepairs.slice(0, 5).map((ro) => {
                const veh = vehicles[ro.vehicle_id];
                const cust = customers[ro.customer_id];
                return (
                  <div key={ro.id} className="flex items-center justify-between rounded-lg border border-[#e5ded2] px-4 py-3 hover:bg-[#f5f1e8] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[#173746]">{veh ? vehicleLabel(veh) : 'Unknown vehicle'}</p>
                      <p className="text-xs text-[#667b80]">{cust ? fullName(cust) : ''}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors(ro.status)}`}>
                      {ro.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unpaid Invoices */}
        <div className="rounded-xl border border-[#d8d1c4] bg-[#fffdf8] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[#173746]">Unpaid Invoices</h2>
            <button onClick={() => navigate('/invoices')} className="text-sm text-[#a87524] hover:text-[#7e571b]">
              View All →
            </button>
          </div>
          {stats.unpaidInvoices.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Receipt className="mb-2 h-8 w-8 text-[#b1c0c0]" />
              <p className="text-sm text-[#667b80]">All invoices are paid</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.unpaidInvoices.slice(0, 5).map((inv) => {
                const cust = customers[inv.customer_id];
                return (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-[#e5ded2] px-4 py-3 hover:bg-[#f5f1e8] transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[#173746]">{inv.invoice_number}</p>
                      <p className="text-xs text-[#667b80]">{cust ? fullName(cust) : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#173746]">{formatCurrency(inv.balance_due)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors(inv.status)}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Customer/Vehicle counts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-4 rounded-xl border border-[#d8d1c4] bg-[#fffdf8] p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e7ecea] text-[#49636b]">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#173746]">{stats.totalCustomers}</p>
            <p className="text-sm text-[#667b80]">Total Customers</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[#d8d1c4] bg-[#fffdf8] p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e7c985]/30 text-[#8d641f]">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#173746]">{stats.totalVehicles}</p>
            <p className="text-sm text-[#667b80]">Total Vehicles</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-[#e7ecea] text-[#49636b]',
    red: 'bg-[#f4e1d9] text-[#9a4f38]',
    blue: 'bg-[#e7c985]/30 text-[#8d641f]',
    orange: 'bg-[#f3e3bf] text-[#a87524]',
  };
  return (
    <div className="rounded-xl border border-[#d8d1c4] bg-[#fffdf8] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#667b80]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#173746]">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
