import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { fullName, vehicleLabel, formatCurrency, formatDate } from '@/lib/utils';
import type { Estimate, EstimateItem, Customer, Vehicle, RepairOrder } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/Badge';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/EmptyState';
import { FileText, Plus, Trash2, Send, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export function EstimatesPage() {
  const { shop } = useAuth();
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailEstimate, setDetailEstimate] = useState<Estimate | null>(null);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [form, setForm] = useState({ customer_id: '', vehicle_id: '', repair_order_id: '', tax_rate: '8.25', shop_fee: '0', discount: '0', notes: '' });
  const [newItem, setNewItem] = useState({ type: 'labor', description: '', quantity: '1', unit_price: '0' });

  useEffect(() => { if (shop) loadData(); }, [shop]);

  async function loadData() {
    if (!shop) return;
    const [e, c, v] = await Promise.all([
      supabase.from('estimates').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }),
      supabase.from('customers').select('*').eq('shop_id', shop.id).order('last_name'),
      supabase.from('vehicles').select('*').eq('shop_id', shop.id),
    ]);
    setEstimates((e.data as Estimate[]) ?? []);
    setCustomers((c.data as Customer[]) ?? []);
    setVehicles((v.data as Vehicle[]) ?? []);
    setLoading(false);
  }

  async function createEstimate(e: FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setError('');
    const { data, error } = await supabase.from('estimates').insert({
      shop_id: shop.id, customer_id: form.customer_id, vehicle_id: form.vehicle_id,
      repair_order_id: form.repair_order_id || null, status: 'draft',
      tax_rate: parseFloat(form.tax_rate), shop_fee: parseFloat(form.shop_fee), discount: parseFloat(form.discount),
      subtotal: 0, tax_amount: 0, total: 0, notes: form.notes || null,
    }).select().single();
    if (error) { setError(error.message); return; }
    setModalOpen(false);
    openDetail(data as Estimate);
    loadData();
  }

  async function openDetail(est: Estimate) {
    setDetailEstimate(est);
    const { data } = await supabase.from('estimate_items').select('*').eq('estimate_id', est.id);
    setItems((data as EstimateItem[]) ?? []);
  }

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!detailEstimate) return;
    await supabase.from('estimate_items').insert({
      estimate_id: detailEstimate.id, type: newItem.type, description: newItem.description,
      quantity: parseFloat(newItem.quantity), unit_price: parseFloat(newItem.unit_price),
    });
    setNewItem({ type: 'labor', description: '', quantity: '1', unit_price: '0' });
    await recalculate();
  }

  async function deleteItem(id: string) {
    await supabase.from('estimate_items').delete().eq('id', id);
    await recalculate();
  }

  async function recalculate() {
    if (!detailEstimate) return;
    const { data } = await supabase.from('estimate_items').select('*').eq('estimate_id', detailEstimate.id);
    const allItems = (data as EstimateItem[]) ?? [];
    setItems(allItems);
    const subtotal = allItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = subtotal * (detailEstimate.tax_rate / 100);
    const total = subtotal + taxAmount + detailEstimate.shop_fee - detailEstimate.discount;
    await supabase.from('estimates').update({ subtotal, tax_amount: taxAmount, total }).eq('id', detailEstimate.id);
    setDetailEstimate({ ...detailEstimate, subtotal, tax_amount: taxAmount, total });
  }

  async function sendEstimate() {
    if (!detailEstimate) return;
    await supabase.from('estimates').update({ status: 'sent' }).eq('id', detailEstimate.id);
    setDetailEstimate({ ...detailEstimate, status: 'sent' });
    loadData();
  }

  async function approveEstimate() {
    if (!detailEstimate) return;
    await supabase.from('estimates').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by_customer: true }).eq('id', detailEstimate.id);
    setDetailEstimate({ ...detailEstimate, status: 'approved', approved_at: new Date().toISOString() });
    loadData();
  }

  async function declineEstimate() {
    if (!detailEstimate) return;
    await supabase.from('estimates').update({ status: 'declined' }).eq('id', detailEstimate.id);
    setDetailEstimate({ ...detailEstimate, status: 'declined' });
    loadData();
  }

  async function convertToInvoice() {
    if (!detailEstimate || !shop) return;
    const { data: invItems } = await supabase.from('estimate_items').select('*').eq('estimate_id', detailEstimate.id);
    const invNum = `INV-${Date.now().toString().slice(-8)}`;
    const { data: invoice, error } = await supabase.from('invoices').insert({
      shop_id: shop.id, customer_id: detailEstimate.customer_id, vehicle_id: detailEstimate.vehicle_id,
      estimate_id: detailEstimate.id, invoice_number: invNum, status: 'unpaid',
      subtotal: detailEstimate.subtotal, tax_rate: detailEstimate.tax_rate, tax_amount: detailEstimate.tax_amount,
      shop_fee: detailEstimate.shop_fee, discount: detailEstimate.discount, total: detailEstimate.total,
      balance_due: detailEstimate.total,
    }).select().single();
    if (error) { setError(error.message); return; }
    // Copy items
    if (invItems && invoice) {
      for (const item of invItems as EstimateItem[]) {
        await supabase.from('invoice_items').insert({
          invoice_id: invoice.id, type: item.type, description: item.description,
          quantity: item.quantity, unit_price: item.unit_price,
        });
      }
    }
    setDetailEstimate(null);
    navigate('/invoices');
  }

  const customerMap: Record<string, Customer> = {};
  customers.forEach((c) => { customerMap[c.id] = c; });
  const vehicleMap: Record<string, Vehicle> = {};
  vehicles.forEach((v) => { vehicleMap[v.id] = v; });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-gray-500">{estimates.length} estimates</h2>
        <button onClick={() => { setForm({ customer_id: '', vehicle_id: '', repair_order_id: '', tax_rate: '8.25', shop_fee: '0', discount: '0', notes: '' }); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> New Estimate
        </button>
      </div>

      {error && <ErrorState message={error} />}

      {estimates.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="No estimates" description="Create an estimate to send to a customer for approval." action={{ label: 'New Estimate', onClick: () => setModalOpen(true) }} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estimates.map((est) => (
                <tr key={est.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetail(est)}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{customerMap[est.customer_id] ? fullName(customerMap[est.customer_id]) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{vehicleMap[est.vehicle_id] ? vehicleLabel(vehicleMap[est.vehicle_id]) : '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(est.total)}</td>
                  <td className="px-4 py-3"><Badge status={est.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(est.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Estimate">
        <form onSubmit={createEstimate} className="space-y-4">
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tax Rate %</label>
              <input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Shop Fee</label>
              <input type="number" step="0.01" value={form.shop_fee} onChange={(e) => setForm({ ...form, shop_fee: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Discount</label>
              <input type="number" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })}
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
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Create Draft</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {detailEstimate && (
        <Modal open={!!detailEstimate} onClose={() => setDetailEstimate(null)} title="Estimate Details" maxWidth="max-w-2xl">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{vehicleMap[detailEstimate.vehicle_id] ? vehicleLabel(vehicleMap[detailEstimate.vehicle_id]) : ''}</h3>
                <p className="text-sm text-gray-500">{customerMap[detailEstimate.customer_id] ? fullName(customerMap[detailEstimate.customer_id]) : ''}</p>
              </div>
              <Badge status={detailEstimate.status} />
            </div>

            {/* Items */}
            <div>
              <h4 className="mb-2 font-semibold text-gray-900">Line Items</h4>
              {items.length > 0 && (
                <div className="mb-3 space-y-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.type} • {item.quantity} × {formatCurrency(item.unit_price)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{formatCurrency(item.quantity * item.unit_price)}</span>
                        {detailEstimate.status === 'draft' && <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {detailEstimate.status === 'draft' && (
                <form onSubmit={addItem} className="grid grid-cols-12 gap-2">
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
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(detailEstimate.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax ({detailEstimate.tax_rate}%)</span><span className="font-medium">{formatCurrency(detailEstimate.tax_amount)}</span></div>
              {detailEstimate.shop_fee > 0 && <div className="flex justify-between"><span className="text-gray-500">Shop Fee</span><span className="font-medium">{formatCurrency(detailEstimate.shop_fee)}</span></div>}
              {detailEstimate.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="font-medium">-{formatCurrency(detailEstimate.discount)}</span></div>}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-gray-900">{formatCurrency(detailEstimate.total)}</span></div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {detailEstimate.status === 'draft' && (
                <button onClick={sendEstimate} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Send className="h-4 w-4" /> Send to Customer</button>
              )}
              {detailEstimate.status === 'sent' && (
                <>
                  <button onClick={approveEstimate} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"><CheckCircle2 className="h-4 w-4" /> Mark Approved</button>
                  <button onClick={declineEstimate} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"><XCircle className="h-4 w-4" /> Mark Declined</button>
                </>
              )}
              {detailEstimate.status === 'approved' && (
                <button onClick={convertToInvoice} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"><ArrowRight className="h-4 w-4" /> Convert to Invoice</button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
