import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { fullName, vehicleLabel, formatDate } from '@/lib/utils';
import type { Vehicle, Customer } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/EmptyState';
import { Car, Plus, Search, Pencil, Trash2 } from 'lucide-react';

export function VehiclesPage() {
  const { shop } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({
    customer_id: '', year: '', make: '', model: '', vin: '', license_plate: '', mileage: '', color: '', notes: '',
  });

  useEffect(() => { if (shop) loadData(); }, [shop]);

  async function loadData() {
    if (!shop) return;
    const [v, c] = await Promise.all([
      supabase.from('vehicles').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }),
      supabase.from('customers').select('*').eq('shop_id', shop.id).order('last_name'),
    ]);
    setVehicles((v.data as Vehicle[]) ?? []);
    setCustomers((c.data as Customer[]) ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ customer_id: customers[0]?.id ?? '', year: '', make: '', model: '', vin: '', license_plate: '', mileage: '', color: '', notes: '' });
    setModalOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({
      customer_id: v.customer_id, year: String(v.year ?? ''), make: v.make, model: v.model,
      vin: v.vin ?? '', license_plate: v.license_plate ?? '', mileage: String(v.mileage), color: v.color ?? '', notes: v.notes ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setError('');
    const payload = {
      shop_id: shop.id, customer_id: form.customer_id,
      year: form.year ? parseInt(form.year) : null,
      make: form.make, model: form.model, vin: form.vin || null,
      license_plate: form.license_plate || null,
      mileage: form.mileage ? parseInt(form.mileage) : 0,
      color: form.color || null, notes: form.notes || null,
    };
    if (editing) {
      const { error } = await supabase.from('vehicles').update(payload).eq('id', editing.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('vehicles').insert(payload);
      if (error) { setError(error.message); return; }
    }
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this vehicle?')) return;
    await supabase.from('vehicles').delete().eq('id', id);
    loadData();
  }

  const customerMap: Record<string, Customer> = {};
  customers.forEach((c) => { customerMap[c.id] = c; });

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return vehicleLabel(v).toLowerCase().includes(q) ||
      (v.vin ?? '').toLowerCase().includes(q) ||
      (v.license_plate ?? '').toLowerCase().includes(q);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by make, model, VIN, plate..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
        </div>
        <button onClick={openAdd} disabled={customers.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Plus className="h-4 w-4" /> Add Vehicle
        </button>
      </div>

      {customers.length === 0 && (
        <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">Add a customer first before adding vehicles.</div>
      )}

      {error && <ErrorState message={error} />}

      {filtered.length === 0 ? (
        <EmptyState icon={<Car className="h-8 w-8" />} title="No vehicles yet" description="Add a vehicle to start tracking service history." action={{ label: 'Add Vehicle', onClick: openAdd }} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Plate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Mileage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Added</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Car className="h-5 w-5" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{vehicleLabel(v)}</p>
                        <p className="text-xs text-gray-500">{v.color} {v.vin ? `• VIN: ${v.vin.slice(0, 10)}...` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{customerMap[v.customer_id] ? fullName(customerMap[v.customer_id]) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.license_plate ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.mileage.toLocaleString()} mi</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(v.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(v)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(v.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Owner</label>
            <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
              <option value="">Select customer...</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Year</label>
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="2020" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Make</label>
              <input type="text" required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Toyota" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Model</label>
              <input type="text" required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Camry" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
              <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Silver" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">VIN</label>
              <input type="text" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="1HGBH41JXMN109186" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">License Plate</label>
              <input type="text" value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="ABC123" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mileage</label>
            <input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="50000" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{editing ? 'Save Changes' : 'Add Vehicle'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
