import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { fullName, formatDate } from '@/lib/utils';
import type { Customer, Vehicle } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/EmptyState';
import { Users, Plus, Search, Pencil, Trash2, Phone, Mail, Car, MapPin } from 'lucide-react';

export function CustomersPage() {
  const { shop } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', preferred_contact: 'phone',
    address: '', city: '', state: '', zip_code: '', notes: '',
  });

  useEffect(() => { if (shop) loadData(); }, [shop]);

  async function loadData() {
    if (!shop) return;
    const [c, v] = await Promise.all([
      supabase.from('customers').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }),
      supabase.from('vehicles').select('*').eq('shop_id', shop.id),
    ]);
    setCustomers((c.data as Customer[]) ?? []);
    setVehicles((v.data as Vehicle[]) ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ first_name: '', last_name: '', email: '', phone: '', preferred_contact: 'phone', address: '', city: '', state: '', zip_code: '', notes: '' });
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      first_name: c.first_name, last_name: c.last_name, email: c.email ?? '', phone: c.phone ?? '',
      preferred_contact: c.preferred_contact, address: c.address ?? '', city: c.city ?? '',
      state: c.state ?? '', zip_code: c.zip_code ?? '', notes: c.notes ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setError('');
    const payload = { ...form, shop_id: shop.id };
    if (editing) {
      const { error } = await supabase.from('customers').update(payload).eq('id', editing.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('customers').insert(payload);
      if (error) { setError(error.message); return; }
    }
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this customer and all their vehicles? This cannot be undone.')) return;
    await supabase.from('customers').delete().eq('id', id);
    setSelectedCustomer(null);
    loadData();
  }

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return fullName(c).toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {error && <ErrorState message={error} />}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No customers yet"
          description="Add your first customer to start building your database."
          action={{ label: 'Add Customer', onClick: openAdd }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const vehs = vehicles.filter((v) => v.customer_id === c.id);
            return (
              <div
                key={c.id}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md"
                onClick={() => setSelectedCustomer(c)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {c.first_name.charAt(0)}{c.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{fullName(c)}</p>
                      <p className="text-xs text-gray-500">Since {formatDate(c.created_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {c.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" />{c.phone}</p>}
                  {c.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />{c.email}</p>}
                  <p className="flex items-center gap-2"><Car className="h-3.5 w-3.5 text-gray-400" />{vehs.length} vehicle(s)</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
              <input type="text" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
              <input type="text" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Preferred Contact</label>
            <select value={form.preferred_contact} onChange={(e) => setForm({ ...form, preferred_contact: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Zip</label>
              <input type="text" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{editing ? 'Save Changes' : 'Add Customer'}</button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Modal open={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="Customer Details" maxWidth="max-w-2xl">
          <CustomerDetail
            customer={selectedCustomer}
            vehicles={vehicles.filter((v) => v.customer_id === selectedCustomer.id)}
            onEdit={() => { openEdit(selectedCustomer); setSelectedCustomer(null); }}
            onDelete={() => handleDelete(selectedCustomer.id)}
          />
        </Modal>
      )}
    </div>
  );
}

function CustomerDetail({ customer, vehicles, onEdit, onDelete }: { customer: Customer; vehicles: Vehicle[]; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
            {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{fullName(customer)}</h3>
            <p className="text-sm text-gray-500">Customer since {formatDate(customer.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
          <button onClick={onDelete} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
        {customer.phone && <p className="flex items-center gap-2 text-sm text-gray-700"><Phone className="h-4 w-4 text-gray-400" />{customer.phone}</p>}
        {customer.email && <p className="flex items-center gap-2 text-sm text-gray-700"><Mail className="h-4 w-4 text-gray-400" />{customer.email}</p>}
        {customer.address && <p className="flex items-center gap-2 text-sm text-gray-700 col-span-2"><MapPin className="h-4 w-4 text-gray-400" />{customer.address}, {customer.city} {customer.state} {customer.zip_code}</p>}
        <p className="text-sm text-gray-700"><span className="text-gray-400">Preferred contact:</span> <span className="capitalize">{customer.preferred_contact}</span></p>
      </div>

      {customer.notes && (
        <div className="rounded-lg bg-yellow-50 p-3 text-sm text-gray-700">{customer.notes}</div>
      )}

      <div>
        <h4 className="mb-2 font-semibold text-gray-900">Vehicles ({vehicles.length})</h4>
        {vehicles.length === 0 ? (
          <p className="text-sm text-gray-500">No vehicles associated yet.</p>
        ) : (
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3">
                <Car className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{v.year} {v.make} {v.model}</p>
                  <p className="text-xs text-gray-500">{v.license_plate ? `Plate: ${v.license_plate}` : ''} {v.vin ? `VIN: ${v.vin.slice(0, 8)}...` : ''}</p>
                </div>
                <span className="ml-auto text-xs text-gray-500">{v.mileage.toLocaleString()} mi</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
