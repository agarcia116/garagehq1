import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate, expenseCategories } from '@/lib/utils';
import type { Expense } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/EmptyState';
import { DollarSign, Plus, Pencil, Trash2, TrendingDown } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  parts: 'bg-blue-50 text-blue-700',
  payroll: 'bg-purple-50 text-purple-700',
  rent: 'bg-orange-50 text-orange-700',
  utilities: 'bg-cyan-50 text-cyan-700',
  equipment: 'bg-gray-50 text-gray-700',
  insurance: 'bg-red-50 text-red-700',
  software: 'bg-indigo-50 text-indigo-700',
  supplies: 'bg-green-50 text-green-700',
  marketing: 'bg-pink-50 text-pink-700',
  other: 'bg-gray-50 text-gray-700',
};

export function ExpensesPage() {
  const { shop } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({ category: 'parts', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], vendor: '' });

  useEffect(() => { if (shop) loadData(); }, [shop]);

  async function loadData() {
    if (!shop) return;
    const { data } = await supabase.from('expenses').select('*').eq('shop_id', shop.id).order('expense_date', { ascending: false });
    setExpenses((data as Expense[]) ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ category: 'parts', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], vendor: '' });
    setModalOpen(true);
  }

  function openEdit(exp: Expense) {
    setEditing(exp);
    setForm({ category: exp.category, description: exp.description, amount: String(exp.amount), expense_date: exp.expense_date, vendor: exp.vendor ?? '' });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setError('');
    const payload = {
      shop_id: shop.id, category: form.category, description: form.description,
      amount: parseFloat(form.amount), expense_date: form.expense_date, vendor: form.vendor || null,
    };
    if (editing) {
      const { error } = await supabase.from('expenses').update(payload).eq('id', editing.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('expenses').insert(payload);
      if (error) { setError(error.message); return; }
    }
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense record?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    loadData();
  }

  const filtered = filterCategory === 'all' ? expenses : expenses.filter((e) => e.category === filterCategory);
  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => { categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount; });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
        </div>
        {Object.entries(categoryTotals).slice(0, 3).map(([cat, amt]) => (
          <div key={cat} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs capitalize text-gray-500">{cat}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(amt)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
          <option value="all">All Categories</option>
          {expenseCategories().map((cat) => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
        </select>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Record Expense
        </button>
      </div>

      {error && <ErrorState message={error} />}

      {filtered.length === 0 ? (
        <EmptyState icon={<DollarSign className="h-8 w-8" />} title="No expenses recorded" description="Track your business expenses to see profit calculations." action={{ label: 'Record Expense', onClick: openAdd }} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Vendor</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(exp.expense_date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{exp.description}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CATEGORY_COLORS[exp.category] ?? CATEGORY_COLORS.other}`}>{exp.category}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-700">{exp.vendor ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(exp.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(exp)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(exp.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Record Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                {expenseCategories().map((cat) => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
              <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <input type="text" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Brake pads, shop rags, etc." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
              <input type="date" required value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Vendor</label>
              <input type="text" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="AutoZone, NAPA, etc." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{editing ? 'Save Changes' : 'Record Expense'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
