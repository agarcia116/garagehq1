import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { fullName, vehicleLabel, formatCurrency, formatDate, generateInvoiceNumber } from '@/lib/utils';
import type { Invoice, InvoiceItem, Customer, Vehicle } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { Badge } from '@/components/Badge';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/EmptyState';
import { Receipt, Plus, Trash2, Printer, DollarSign } from 'lucide-react';

export function InvoicesPage() {
  const { shop } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [form, setForm] = useState({ customer_id: '', vehicle_id: '', tax_rate: '8.25', shop_fee: '0', discount: '0', due_date: '', notes: '' });
  const [newItem, setNewItem] = useState({ type: 'labor', description: '', quantity: '1', unit_price: '0' });

  useEffect(() => { if (shop) loadData(); }, [shop]);

  async function loadData() {
    if (!shop) return;
    const [i, c, v] = await Promise.all([
      supabase.from('invoices').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }),
      supabase.from('customers').select('*').eq('shop_id', shop.id).order('last_name'),
      supabase.from('vehicles').select('*').eq('shop_id', shop.id),
    ]);
    setInvoices((i.data as Invoice[]) ?? []);
    setCustomers((c.data as Customer[]) ?? []);
    setVehicles((v.data as Vehicle[]) ?? []);
    setLoading(false);
  }

  async function createInvoice(e: FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setError('');
    const { data, error } = await supabase.from('invoices').insert({
      shop_id: shop.id, customer_id: form.customer_id, vehicle_id: form.vehicle_id || null,
      invoice_number: generateInvoiceNumber(), status: 'unpaid',
      tax_rate: parseFloat(form.tax_rate), shop_fee: parseFloat(form.shop_fee), discount: parseFloat(form.discount),
      subtotal: 0, tax_amount: 0, total: 0, amount_paid: 0, balance_due: 0,
      due_date: form.due_date || null, notes: form.notes || null,
    }).select().single();
    if (error) { setError(error.message); return; }
    setModalOpen(false);
    openDetail(data as Invoice);
    loadData();
  }

  async function openDetail(inv: Invoice) {
    setDetailInvoice(inv);
    const { data } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id);
    setItems((data as InvoiceItem[]) ?? []);
  }

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!detailInvoice) return;
    await supabase.from('invoice_items').insert({
      invoice_id: detailInvoice.id, type: newItem.type, description: newItem.description,
      quantity: parseFloat(newItem.quantity), unit_price: parseFloat(newItem.unit_price),
    });
    setNewItem({ type: 'labor', description: '', quantity: '1', unit_price: '0' });
    await recalculate();
  }

  async function deleteItem(id: string) {
    await supabase.from('invoice_items').delete().eq('id', id);
    await recalculate();
  }

  async function recalculate() {
    if (!detailInvoice) return;
    const { data } = await supabase.from('invoice_items').select('*').eq('invoice_id', detailInvoice.id);
    const allItems = (data as InvoiceItem[]) ?? [];
    setItems(allItems);
    const subtotal = allItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = subtotal * (detailInvoice.tax_rate / 100);
    const total = subtotal + taxAmount + detailInvoice.shop_fee - detailInvoice.discount;
    const balanceDue = total - detailInvoice.amount_paid;
    await supabase.from('invoices').update({ subtotal, tax_amount: taxAmount, total, balance_due: balanceDue }).eq('id', detailInvoice.id);
    setDetailInvoice({ ...detailInvoice, subtotal, tax_amount: taxAmount, total, balance_due: balanceDue });
  }

  async function recordPayment(e: FormEvent) {
    e.preventDefault();
    if (!detailInvoice) return;
    const amount = parseFloat(payAmount);
    const newPaid = detailInvoice.amount_paid + amount;
    const newBalance = detailInvoice.total - newPaid;
    const status = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partially paid' : 'unpaid';
    await supabase.from('invoices').update({
      amount_paid: newPaid, balance_due: newBalance, status,
      paid_at: status === 'paid' ? new Date().toISOString() : detailInvoice.paid_at,
      payment_method: payMethod,
    }).eq('id', detailInvoice.id);
    setPayModalOpen(false);
    setPayAmount('');
    setDetailInvoice({ ...detailInvoice, amount_paid: newPaid, balance_due: newBalance, status, payment_method: payMethod });
    loadData();
  }

  function printInvoice() {
    window.print();
  }

  const customerMap: Record<string, Customer> = {};
  customers.forEach((c) => { customerMap[c.id] = c; });
  const vehicleMap: Record<string, Vehicle> = {};
  vehicles.forEach((v) => { vehicleMap[v.id] = v; });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-gray-500">{invoices.length} invoices</h2>
        <button onClick={() => { setForm({ customer_id: '', vehicle_id: '', tax_rate: '8.25', shop_fee: '0', discount: '0', due_date: '', notes: '' }); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> New Invoice
        </button>
      </div>

      {error && <ErrorState message={error} />}

      {invoices.length === 0 ? (
        <EmptyState icon={<Receipt className="h-8 w-8" />} title="No invoices" description="Create an invoice to bill a customer for services." action={{ label: 'New Invoice', onClick: () => setModalOpen(true) }} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetail(inv)}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{customerMap[inv.customer_id] ? fullName(customerMap[inv.customer_id]) : '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(inv.total)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(inv.balance_due)}</td>
                  <td className="px-4 py-3"><Badge status={inv.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(inv.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Invoice">
        <form onSubmit={createInvoice} className="space-y-4">
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Vehicle (optional)</label>
              <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                <option value="">None</option>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Create Invoice</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {detailInvoice && (
        <Modal open={!!detailInvoice} onClose={() => setDetailInvoice(null)} title="Invoice Details" maxWidth="max-w-2xl">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{detailInvoice.invoice_number}</h3>
                <p className="text-sm text-gray-500">{customerMap[detailInvoice.customer_id] ? fullName(customerMap[detailInvoice.customer_id]) : ''}</p>
                {detailInvoice.vehicle_id && vehicleMap[detailInvoice.vehicle_id] && <p className="text-sm text-gray-500">{vehicleLabel(vehicleMap[detailInvoice.vehicle_id])}</p>}
              </div>
              <Badge status={detailInvoice.status} />
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
                        {detailInvoice.status === 'unpaid' && detailInvoice.amount_paid === 0 && <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {detailInvoice.status === 'unpaid' && detailInvoice.amount_paid === 0 && (
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
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(detailInvoice.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax ({detailInvoice.tax_rate}%)</span><span className="font-medium">{formatCurrency(detailInvoice.tax_amount)}</span></div>
              {detailInvoice.shop_fee > 0 && <div className="flex justify-between"><span className="text-gray-500">Shop Fee</span><span className="font-medium">{formatCurrency(detailInvoice.shop_fee)}</span></div>}
              {detailInvoice.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="font-medium">-{formatCurrency(detailInvoice.discount)}</span></div>}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-gray-900">{formatCurrency(detailInvoice.total)}</span></div>
              {detailInvoice.amount_paid > 0 && <div className="flex justify-between text-green-600"><span>Paid</span><span>{formatCurrency(detailInvoice.amount_paid)}</span></div>}
              {detailInvoice.balance_due > 0 && <div className="flex justify-between text-orange-600"><span>Balance Due</span><span className="font-bold">{formatCurrency(detailInvoice.balance_due)}</span></div>}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {detailInvoice.balance_due > 0 && (
                <button onClick={() => { setPayAmount(String(detailInvoice.balance_due)); setPayModalOpen(true); }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"><DollarSign className="h-4 w-4" /> Record Payment</button>
              )}
              <button onClick={printInvoice} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"><Printer className="h-4 w-4" /> Print</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title="Record Payment">
        <form onSubmit={recordPayment} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Payment Amount</label>
            <input type="number" step="0.01" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Payment Method</label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="check">Check</option>
              <option value="transfer">Bank Transfer</option>
            </select>
          </div>
          <p className="text-xs text-gray-500">Online payment processing is in demonstration mode. No actual charges will be made.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPayModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
