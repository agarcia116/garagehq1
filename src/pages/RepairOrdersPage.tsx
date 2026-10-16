import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { fullName, vehicleLabel, formatCurrency, formatDate, statusColors } from '@/lib/utils';
import type { RepairOrder, RepairOrderItem, Customer, Vehicle, ShopMember } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/Badge';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/EmptyState';
import { Wrench, Plus, Pencil, Trash2, FileText, Clock, Camera, CheckCircle2 } from 'lucide-react';

const REPAIR_STATUSES = ['pending', 'diagnosing', 'awaiting approval', 'in progress', 'waiting for parts', 'completed', 'ready for pickup'];

export function RepairOrdersPage() {
  const { shop, member } = useAuth();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [members, setMembers] = useState<ShopMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RepairOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<RepairOrder | null>(null);
  const [items, setItems] = useState<RepairOrderItem[]>([]);
  const [form, setForm] = useState({
    customer_id: '', vehicle_id: '', technician_id: '', status: 'pending',
    customer_concerns: '', diagnostic_notes: '', labor_hours: '',
  });
  const [newItem, setNewItem] = useState({ type: 'labor', description: '', quantity: '1', unit_price: '0' });

  useEffect(() => { if (shop) loadData(); }, [shop]);

  async function loadData() {
    if (!shop) return;
    const [ro, c, v, m] = await Promise.all([
      supabase.from('repair_orders').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }),
      supabase.from('customers').select('*').eq('shop_id', shop.id).order('last_name'),
      supabase.from('vehicles').select('*').eq('shop_id', shop.id),
      supabase.from('shop_members').select('*').eq('shop_id', shop.id),
    ]);
    setOrders((ro.data as RepairOrder[]) ?? []);
    setCustomers((c.data as Customer[]) ?? []);
    setVehicles((v.data as Vehicle[]) ?? []);
    setMembers((m.data as ShopMember[]) ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ customer_id: '', vehicle_id: '', technician_id: '', status: 'pending', customer_concerns: '', diagnostic_notes: '', labor_hours: '' });
    setModalOpen(true);
  }

  function openEdit(ro: RepairOrder) {
    setEditing(ro);
    setForm({
      customer_id: ro.customer_id, vehicle_id: ro.vehicle_id, technician_id: ro.technician_id ?? '',
      status: ro.status, customer_concerns: ro.customer_concerns ?? '', diagnostic_notes: ro.diagnostic_notes ?? '',
      labor_hours: String(ro.labor_hours),
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setError('');
    const payload = {
      shop_id: shop.id, customer_id: form.customer_id, vehicle_id: form.vehicle_id,
      technician_id: form.technician_id || null, status: form.status,
      customer_concerns: form.customer_concerns || null, diagnostic_notes: form.diagnostic_notes || null,
      labor_hours: form.labor_hours ? parseFloat(form.labor_hours) : 0,
    };
    if (editing) {
      const { error } = await supabase.from('repair_orders').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('repair_orders').insert(payload);
      if (error) { setError(error.message); return; }
    }
    setModalOpen(false);
    loadData();
  }

  async function openDetail(ro: RepairOrder) {
    setDetailOrder(ro);
    const { data } = await supabase.from('repair_order_items').select('*').eq('repair_order_id', ro.id);
    setItems((data as RepairOrderItem[]) ?? []);
  }

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!detailOrder) return;
    await supabase.from('repair_order_items').insert({
      repair_order_id: detailOrder.id, type: newItem.type, description: newItem.description,
      quantity: parseFloat(newItem.quantity), unit_price: parseFloat(newItem.unit_price),
    });
    setNewItem({ type: 'labor', description: '', quantity: '1', unit_price: '0' });
    const { data } = await supabase.from('repair_order_items').select('*').eq('repair_order_id', detailOrder.id);
    setItems((data as RepairOrderItem[]) ?? []);
  }

  async function deleteItem(id: string) {
    await supabase.from('repair_order_items').delete().eq('id', id);
    if (detailOrder) {
      const { data } = await supabase.from('repair_order_items').select('*').eq('repair_order_id', detailOrder.id);
      setItems((data as RepairOrderItem[]) ?? []);
    }
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('repair_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    loadData();
    if (detailOrder?.id === id) setDetailOrder({ ...detailOrder, status });
  }

  const customerMap: Record<string, Customer> = {};
  customers.forEach((c) => { customerMap[c.id] = c; });
  const vehicleMap: Record<string, Vehicle> = {};
  vehicles.forEach((v) => { vehicleMap[v.id] = v; });
  const memberMap: Record<string, ShopMember> = {};
  members.forEach((m) => { memberMap[m.id] = m; });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-gray-500">{orders.length} repair orders</h2>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> New Repair Order
        </button>
      </div>

      {error && <ErrorState message={error} />}

      {orders.length === 0 ? (
        <EmptyState icon={<Wrench className="h-8 w-8" />} title="No repair orders" description="Create a repair order to track vehicle service work." action={{ label: 'New Repair Order', onClick: openAdd }} />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {orders.map((ro) => {
            const cust = customerMap[ro.customer_id];
            const veh = vehicleMap[ro.vehicle_id];
            const tech = ro.technician_id ? memberMap[ro.technician_id] : null;
            return (
              <div key={ro.id} className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-all" onClick={() => openDetail(ro)}>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{veh ? vehicleLabel(veh) : 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{cust ? fullName(cust) : ''} • {tech ? tech.full_name : 'Unassigned'}</p>
                  </div>
                  <Badge status={ro.status} />
                </div>
                {ro.customer_concerns && <p className="mb-2 text-sm text-gray-600"><span className="font-medium">Concern:</span> {ro.customer_concerns}</p>}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(ro.created_at)}</span>
                  {ro.labor_hours > 0 && <span>{ro.labor_hours}h labor</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Repair Order' : 'New Repair Order'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Customer</label>
              <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                <option value="">Select...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Vehicle</label>
              <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                <option value="">Select...</option>
                {vehicles.filter((v) => !form.customer_id || v.customer_id === form.customer_id).map((v) => <option key={v.id} value={v.id}>{vehicleLabel(v)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Technician</label>
              <select value={form.technician_id} onChange={(e) => setForm({ ...form, technician_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                <option value="">Unassigned</option>
                {members.filter((m) => m.role === 'mechanic' || m.role === 'owner').map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                {REPAIR_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Customer Concerns</label>
            <textarea value={form.customer_concerns} onChange={(e) => setForm({ ...form, customer_concerns: e.target.value })} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="What the customer reported..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Diagnostic Notes</label>
            <textarea value={form.diagnostic_notes} onChange={(e) => setForm({ ...form, diagnostic_notes: e.target.value })} rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Mechanic findings..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Labor Hours</label>
            <input type="number" step="0.25" value={form.labor_hours} onChange={(e) => setForm({ ...form, labor_hours: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="0" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{editing ? 'Save Changes' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {detailOrder && (
        <Modal open={!!detailOrder} onClose={() => setDetailOrder(null)} title="Repair Order Details" maxWidth="max-w-2xl">
          <RepairOrderDetail
            order={detailOrder}
            customer={customerMap[detailOrder.customer_id]}
            vehicle={vehicleMap[detailOrder.vehicle_id]}
            technician={detailOrder.technician_id ? memberMap[detailOrder.technician_id] : null}
            items={items}
            newItem={newItem}
            setNewItem={setNewItem}
            onAddItem={addItem}
            onDeleteItem={deleteItem}
            onStatusChange={(s) => updateStatus(detailOrder.id, s)}
            onEdit={() => { openEdit(detailOrder); setDetailOrder(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

function RepairOrderDetail({ order, customer, vehicle, technician, items, newItem, setNewItem, onAddItem, onDeleteItem, onStatusChange, onEdit }: {
  order: RepairOrder; customer?: Customer; vehicle?: Vehicle; technician: ShopMember | null;
  items: RepairOrderItem[]; newItem: { type: string; description: string; quantity: string; unit_price: string };
  setNewItem: (v: { type: string; description: string; quantity: string; unit_price: string }) => void;
  onAddItem: (e: FormEvent) => void; onDeleteItem: (id: string) => void;
  onStatusChange: (s: string) => void; onEdit: () => void;
}) {
  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{vehicle ? vehicleLabel(vehicle) : 'Unknown'}</h3>
          <p className="text-sm text-gray-500">{customer ? fullName(customer) : ''} • {technician?.full_name ?? 'Unassigned'}</p>
        </div>
        <button onClick={onEdit} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"><Pencil className="inline h-3.5 w-3.5 mr-1" />Edit</button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
        <select value={order.status} onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
          {REPAIR_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {order.customer_concerns && (
        <div className="rounded-lg bg-orange-50 p-3">
          <p className="text-xs font-semibold uppercase text-orange-700">Customer Concerns</p>
          <p className="mt-1 text-sm text-gray-700">{order.customer_concerns}</p>
        </div>
      )}
      {order.diagnostic_notes && (
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs font-semibold uppercase text-blue-700">Diagnostic Notes</p>
          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{order.diagnostic_notes}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-400">Labor hours:</span> <span className="font-medium text-gray-900">{order.labor_hours}h</span></div>
        <div><span className="text-gray-400">Created:</span> <span className="font-medium text-gray-900">{formatDate(order.created_at)}</span></div>
      </div>

      {/* Items */}
      <div>
        <h4 className="mb-2 font-semibold text-gray-900">Parts & Labor</h4>
        {items.length > 0 && (
          <div className="mb-3 space-y-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.description}</p>
                  <p className="text-xs text-gray-500 capitalize">{item.type} • {item.quantity} × {formatCurrency(item.unit_price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.quantity * item.unit_price)}</span>
                  <button onClick={() => onDeleteItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        )}
        <form onSubmit={onAddItem} className="grid grid-cols-12 gap-2">
          <select value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value })} className="col-span-3 rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
            <option value="labor">Labor</option>
            <option value="parts">Parts</option>
            <option value="fee">Fee</option>
          </select>
          <input type="text" required placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="col-span-4 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
          <input type="number" required placeholder="Qty" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} className="col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
          <input type="number" required placeholder="Price" value={newItem.unit_price} onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })} className="col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
          <button type="submit" className="col-span-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"><Plus className="mx-auto h-4 w-4" /></button>
        </form>
      </div>
    </div>
  );
}
