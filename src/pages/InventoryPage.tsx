import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import type { InventoryPart } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/EmptyState';
import { Package, Plus, Pencil, Trash2, AlertTriangle, Search } from 'lucide-react';

export function InventoryPage() {
  const { shop } = useAuth();
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryPart | null>(null);
  const [form, setForm] = useState({ part_number: '', name: '', description: '', quantity_on_hand: '0', min_stock_level: '5', purchase_cost: '0', selling_price: '0', supplier: '', location: '' });

  useEffect(() => { if (shop) loadData(); }, [shop]);

  async function loadData() {
    if (!shop) return;
    const { data } = await supabase.from('inventory_parts').select('*').eq('shop_id', shop.id).order('name');
    setParts((data as InventoryPart[]) ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ part_number: '', name: '', description: '', quantity_on_hand: '0', min_stock_level: '5', purchase_cost: '0', selling_price: '0', supplier: '', location: '' });
    setModalOpen(true);
  }

  function openEdit(part: InventoryPart) {
    setEditing(part);
    setForm({
      part_number: part.part_number ?? '', name: part.name, description: part.description ?? '',
      quantity_on_hand: String(part.quantity_on_hand), min_stock_level: String(part.min_stock_level),
      purchase_cost: String(part.purchase_cost), selling_price: String(part.selling_price),
      supplier: part.supplier ?? '', location: part.location ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setError('');
    const payload = {
      shop_id: shop.id, part_number: form.part_number || null, name: form.name,
      description: form.description || null, quantity_on_hand: parseInt(form.quantity_on_hand),
      min_stock_level: parseInt(form.min_stock_level), purchase_cost: parseFloat(form.purchase_cost),
      selling_price: parseFloat(form.selling_price), supplier: form.supplier || null, location: form.location || null,
    };
    if (editing) {
      const { error } = await supabase.from('inventory_parts').update(payload).eq('id', editing.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('inventory_parts').insert(payload);
      if (error) { setError(error.message); return; }
    }
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this part from inventory?')) return;
    await supabase.from('inventory_parts').delete().eq('id', id);
    loadData();
  }

  const filtered = parts.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.part_number ?? '').toLowerCase().includes(q) || (p.supplier ?? '').toLowerCase().includes(q);
  });

  const lowStock = parts.filter((p) => p.quantity_on_hand <= p.min_stock_level);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
          <span><strong>{lowStock.length}</strong> part(s) at or below minimum stock level</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search parts..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Part
        </button>
      </div>

      {error && <ErrorState message={error} />}

      {filtered.length === 0 ? (
        <EmptyState icon={<Package className="h-8 w-8" />} title="No parts in inventory" description="Add parts to track stock levels and use them in repair orders." action={{ label: 'Add Part', onClick: openAdd }} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Part Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Part #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">In Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Min Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Sell Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Supplier</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.quantity_on_hand <= p.min_stock_level ? 'bg-yellow-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.part_number ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${p.quantity_on_hand <= p.min_stock_level ? 'text-yellow-700' : 'text-gray-900'}`}>{p.quantity_on_hand}</span>
                    {p.quantity_on_hand <= p.min_stock_level && <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-yellow-600" />}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.min_stock_level}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(p.purchase_cost)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(p.selling_price)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.supplier ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Part' : 'Add Part'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Part Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Brake Pads - Front" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Part Number</label>
              <input type="text" value={form.part_number} onChange={(e) => setForm({ ...form, part_number: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="BP-1234" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Quantity On Hand</label>
              <input type="number" required value={form.quantity_on_hand} onChange={(e) => setForm({ ...form, quantity_on_hand: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Min Stock Level</label>
              <input type="number" required value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Purchase Cost</label>
              <input type="number" step="0.01" required value={form.purchase_cost} onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Selling Price</label>
              <input type="number" step="0.01" required value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Supplier</label>
              <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="NAPA, AutoZone..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Shelf A-3" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{editing ? 'Save Changes' : 'Add Part'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
