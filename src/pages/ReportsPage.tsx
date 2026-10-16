import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, expenseCategories } from '@/lib/utils';
import type { Invoice, Expense } from '@/lib/types';
import { LoadingSpinner } from '@/components/EmptyState';
import { TrendingUp, TrendingDown, Wallet, Download, BarChart3 } from 'lucide-react';

export function ReportsPage() {
  const { shop } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { if (shop) loadData(); }, [shop, dateFrom, dateTo]);

  async function loadData() {
    if (!shop) return;
    const [inv, exp] = await Promise.all([
      supabase.from('invoices').select('*').eq('shop_id', shop.id).gte('created_at', dateFrom).lte('created_at', dateTo + 'T23:59:59'),
      supabase.from('expenses').select('*').eq('shop_id', shop.id).gte('expense_date', dateFrom).lte('expense_date', dateTo),
    ]);
    setInvoices((inv.data as Invoice[]) ?? []);
    setExpenses((exp.data as Expense[]) ?? []);
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const totalRevenue = paidInvoices.reduce((s, i) => s + i.amount_paid, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const estimatedProfit = totalRevenue - totalExpenses;
  const outstandingBalance = invoices.reduce((s, i) => s + i.balance_due, 0);

  // Revenue by service category (based on invoice item types)
  const revenueByCategory: Record<string, number> = {};
  paidInvoices.forEach((inv) => {
    revenueByCategory['invoices'] = (revenueByCategory['invoices'] ?? 0) + inv.amount_paid;
  });

  // Expense breakdown by category
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] ?? 0) + e.amount;
  });

  // Monthly trend (last 6 months)
  const monthlyData: { label: string; revenue: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
    const monthRevenue = paidInvoices
      .filter((inv) => {
        if (!inv.paid_at) return false;
        const pd = new Date(inv.paid_at);
        return pd >= monthStart && pd <= monthEnd;
      })
      .reduce((s, i) => s + i.amount_paid, 0);
    const monthExpenses = expenses
      .filter((e) => {
        const ed = new Date(e.expense_date);
        return ed >= monthStart && ed <= monthEnd;
      })
      .reduce((s, e) => s + e.amount, 0);
    monthlyData.push({ label: monthLabel, revenue: monthRevenue, expenses: monthExpenses });
  }

  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.revenue, m.expenses)), 1);

  function exportCSV() {
    const rows = [
      ['Date', 'Type', 'Description', 'Category', 'Amount'],
      ...expenses.map((e) => [e.expense_date, 'Expense', e.description, e.category, String(e.amount)]),
      ...paidInvoices.map((i) => [i.created_at.split('T')[0], 'Revenue', i.invoice_number, 'Invoice', String(i.amount_paid)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garage-hq-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Date filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"><TrendingUp className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"><TrendingDown className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Est. Operating Profit</p>
              <p className={`mt-1 text-2xl font-bold ${estimatedProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(estimatedProfit)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Wallet className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outstanding Balances</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(outstandingBalance)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><BarChart3 className="h-5 w-5" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue vs Expenses Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Revenue vs Expenses (6 Months)</h2>
          <div className="flex h-48 items-end justify-between gap-3">
            {monthlyData.map((month, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center gap-1" style={{ height: '140px' }}>
                  <div className="w-1/2 rounded-t bg-green-500" style={{ height: `${(month.revenue / maxMonthly) * 100}%`, minHeight: month.revenue > 0 ? '3px' : '0' }} title={`Revenue: ${formatCurrency(month.revenue)}`} />
                  <div className="w-1/2 rounded-t bg-red-400" style={{ height: `${(month.expenses / maxMonthly) * 100}%`, minHeight: month.expenses > 0 ? '3px' : '0' }} title={`Expenses: ${formatCurrency(month.expenses)}`} />
                </div>
                <span className="text-[10px] text-gray-500">{month.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-green-500" />Revenue</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-red-400" />Expenses</span>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Expense Breakdown</h2>
          {Object.keys(expenseByCategory).length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No expenses in this period</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                const pct = (amt / totalExpenses) * 100;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-700">{cat}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(amt)} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Type</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Description</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paidInvoices.slice(0, 10).map((inv) => (
                <tr key={`rev-${inv.id}`}>
                  <td className="px-4 py-2 text-sm text-gray-500">{inv.paid_at?.split('T')[0] ?? inv.created_at.split('T')[0]}</td>
                  <td className="px-4 py-2"><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Revenue</span></td>
                  <td className="px-4 py-2 text-sm text-gray-700">{inv.invoice_number}</td>
                  <td className="px-4 py-2 text-right text-sm font-semibold text-green-600">{formatCurrency(inv.amount_paid)}</td>
                </tr>
              ))}
              {expenses.slice(0, 10).map((exp) => (
                <tr key={`exp-${exp.id}`}>
                  <td className="px-4 py-2 text-sm text-gray-500">{exp.expense_date}</td>
                  <td className="px-4 py-2"><span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Expense</span></td>
                  <td className="px-4 py-2 text-sm text-gray-700">{exp.description} <span className="text-gray-400 capitalize">({exp.category})</span></td>
                  <td className="px-4 py-2 text-right text-sm font-semibold text-red-600">-{formatCurrency(exp.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Note: These figures represent estimated operating profit based on recorded revenue and expenses. They are not a substitute for professional accounting or tax calculations.
      </p>
    </div>
  );
}
