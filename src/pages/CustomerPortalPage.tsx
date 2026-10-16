import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Wrench, AlertCircle, Car, Calendar, Receipt, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate, vehicleLabel, formatTime, statusColors } from '@/lib/utils';
import type { Shop, Customer, Vehicle, Appointment, RepairOrder, Invoice, Estimate } from '@/lib/types';

type PortalView = 'home' | 'appointments' | 'repairs' | 'invoices' | 'history' | 'estimates';

export function CustomerPortalPage() {
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [repairs, setRepairs] = useState<RepairOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [view, setView] = useState<PortalView>('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [linked, setLinked] = useState(false);

  // Demo mode: customer looks up their shop by email/phone
  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setError('');

    // Find the customer by email or phone in any shop
    let query = supabase.from('customers').select('*, shops(*)');
    if (searchEmail) {
      query = query.eq('email', searchEmail);
    } else if (searchPhone) {
      query = query.eq('phone', searchPhone);
    } else {
      setError('Please enter your email or phone number.');
      return;
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      setError('No customer found. Please check your information or contact your repair shop.');
      return;
    }

    const shopData = (data as any).shops as Shop;
    const custData = data as Customer;
    setShop(shopData);
    setCustomer(custData);
    setLinked(true);
    await loadCustomerData(shopData.id, custData.id);
  }

  async function loadCustomerData(shopId: string, customerId: string) {
    const [v, a, ro, inv, est] = await Promise.all([
      supabase.from('vehicles').select('*').eq('shop_id', shopId).eq('customer_id', customerId),
      supabase.from('appointments').select('*').eq('shop_id', shopId).eq('customer_id', customerId).order('appointment_date', { ascending: false }),
      supabase.from('repair_orders').select('*').eq('shop_id', shopId).eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('shop_id', shopId).eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('estimates').select('*').eq('shop_id', shopId).eq('customer_id', customerId).order('created_at', { ascending: false }),
    ]);
    setVehicles((v.data as Vehicle[]) ?? []);
    setAppointments((a.data as Appointment[]) ?? []);
    setRepairs((ro.data as RepairOrder[]) ?? []);
    setInvoices((inv.data as Invoice[]) ?? []);
    setEstimates((est.data as Estimate[]) ?? []);
    setLoading(false);
  }

  if (!linked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a2234] px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
              <Wrench className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Garage HQ</h1>
            <p className="text-sm text-gray-400">Customer Portal</p>
          </div>
          <div className="rounded-xl bg-white p-8 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Find Your Account</h2>
            <p className="mb-4 text-sm text-gray-500">Enter the email or phone number your repair shop has on file.</p>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={searchEmail} onChange={(e) => { setSearchEmail(e.target.value); setSearchPhone(''); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="you@email.com" />
              </div>
              <div className="text-center text-xs text-gray-400">— or —</div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                <input type="tel" value={searchPhone} onChange={(e) => { setSearchPhone(e.target.value); setSearchEmail(''); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="(555) 123-4567" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                Access My Account
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Are you a shop owner?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  const navItems: { key: PortalView; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Home', icon: <Wrench className="h-4 w-4" /> },
    { key: 'appointments', label: 'Appointments', icon: <Calendar className="h-4 w-4" /> },
    { key: 'repairs', label: 'Repair Tracking', icon: <FileText className="h-4 w-4" /> },
    { key: 'estimates', label: 'Estimates', icon: <FileText className="h-4 w-4" /> },
    { key: 'invoices', label: 'Invoices', icon: <Receipt className="h-4 w-4" /> },
    { key: 'history', label: 'Vehicle History', icon: <Car className="h-4 w-4" /> },
  ];

  const activeRepairs = repairs.filter((r) => !['completed', 'ready for pickup'].includes(r.status));
  const upcomingAppointments = appointments.filter((a) => a.appointment_date >= new Date().toISOString().split('T')[0] && a.status !== 'cancelled');
  const unpaidInvoices = invoices.filter((i) => i.balance_due > 0);
  const pendingEstimates = estimates.filter((e) => e.status === 'sent');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a2234] text-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500"><Wrench className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-bold">Garage HQ</p>
                <p className="text-xs text-blue-400">{shop?.name}</p>
              </div>
            </div>
            <button onClick={() => { setLinked(false); setCustomer(null); setShop(null); }}
              className="text-xs text-gray-400 hover:text-white">Sign Out</button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <button key={item.key} onClick={() => setView(item.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  view === item.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {item.icon}{item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {view === 'home' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-600 p-6 text-white">
              <h2 className="text-xl font-bold">Welcome, {customer?.first_name}!</h2>
              <p className="mt-1 text-sm text-blue-100">Here's what's happening with your vehicles at {shop?.name}.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <HomeCard label="Upcoming Appointments" value={upcomingAppointments.length} icon={<Calendar className="h-5 w-5" />} color="blue" onClick={() => setView('appointments')} />
              <HomeCard label="Active Repairs" value={activeRepairs.length} icon={<Wrench className="h-5 w-5" />} color="orange" onClick={() => setView('repairs')} />
              <HomeCard label="Pending Estimates" value={pendingEstimates.length} icon={<FileText className="h-5 w-5" />} color="indigo" onClick={() => setView('estimates')} />
              <HomeCard label="Unpaid Invoices" value={unpaidInvoices.length} icon={<Receipt className="h-5 w-5" />} color="red" onClick={() => setView('invoices')} />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 font-semibold text-gray-900">Your Vehicles</h3>
              {vehicles.length === 0 ? <p className="text-sm text-gray-500">No vehicles on file.</p> : (
                <div className="space-y-2">
                  {vehicles.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3">
                      <Car className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{vehicleLabel(v)}</p>
                        <p className="text-xs text-gray-500">{v.mileage.toLocaleString()} mi {v.license_plate ? `• ${v.license_plate}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'appointments' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Your Appointments</h2>
            {appointments.length === 0 ? <p className="text-sm text-gray-500">No appointments yet. Call {shop?.name} to schedule service.</p> : (
              appointments.map((apt) => (
                <div key={apt.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{apt.service_description}</p>
                      <p className="text-sm text-gray-500">{formatDate(apt.appointment_date)} at {formatTime(apt.start_time)}</p>
                      {apt.assigned_bay && <p className="text-xs text-gray-400">{apt.assigned_bay}</p>}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors(apt.status)}`}>{apt.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'repairs' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Repair Tracking</h2>
            {repairs.length === 0 ? <p className="text-sm text-gray-500">No repair orders yet.</p> : (
              repairs.map((ro) => {
                const veh = vehicles.find((v) => v.id === ro.vehicle_id);
                return (
                  <div key={ro.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{veh ? vehicleLabel(veh) : 'Vehicle'}</p>
                        <p className="text-xs text-gray-500">{formatDate(ro.created_at)}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors(ro.status)}`}>{ro.status}</span>
                    </div>
                    {ro.customer_concerns && <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Concern:</span> {ro.customer_concerns}</p>}
                    {ro.diagnostic_notes && <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Notes:</span> {ro.diagnostic_notes}</p>}
                    {/* Progress indicator */}
                    <div className="mt-3 flex items-center gap-1">
                      {['pending', 'diagnosing', 'in progress', 'completed'].map((step, i) => {
                        const statusOrder = ['pending', 'diagnosing', 'awaiting approval', 'in progress', 'waiting for parts', 'completed', 'ready for pickup'];
                        const currentIdx = statusOrder.indexOf(ro.status);
                        const stepIdx = statusOrder.indexOf(step);
                        const isDone = currentIdx >= stepIdx;
                        return (
                          <div key={step} className="flex items-1 flex-1">
                            <div className={`h-1.5 flex-1 rounded ${isDone ? 'bg-green-500' : 'bg-gray-200'}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {view === 'estimates' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Estimates</h2>
            {estimates.length === 0 ? <p className="text-sm text-gray-500">No estimates yet.</p> : (
              estimates.map((est) => {
                const veh = vehicles.find((v) => v.id === est.vehicle_id);
                return (
                  <div key={est.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{veh ? vehicleLabel(veh) : 'Vehicle'}</p>
                        <p className="text-xs text-gray-500">{formatDate(est.created_at)}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors(est.status)}`}>{est.status}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(est.subtotal)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrency(est.tax_amount)}</span></div>
                      <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(est.total)}</span></div>
                    </div>
                    {est.status === 'sent' && (
                      <p className="mt-2 text-xs text-orange-600">Awaiting your approval. Please contact {shop?.name} to approve or decline.</p>
                    )}
                    {est.status === 'approved' && <p className="mt-2 text-xs text-green-600">Approved on {est.approved_at ? formatDate(est.approved_at) : ''}</p>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {view === 'invoices' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Your Invoices</h2>
            {invoices.length === 0 ? <p className="text-sm text-gray-500">No invoices yet.</p> : (
              invoices.map((inv) => (
                <div key={inv.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{inv.invoice_number}</p>
                      <p className="text-xs text-gray-500">{formatDate(inv.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors(inv.status)}`}>{inv.status}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold">{formatCurrency(inv.total)}</span></div>
                    {inv.amount_paid > 0 && <div className="flex justify-between text-green-600"><span>Paid</span><span>{formatCurrency(inv.amount_paid)}</span></div>}
                    {inv.balance_due > 0 && <div className="flex justify-between text-orange-600"><span>Balance Due</span><span className="font-bold">{formatCurrency(inv.balance_due)}</span></div>}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">Online payment is in demonstration mode. Please contact {shop?.name} to make a payment.</p>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Service History</h2>
            {vehicles.length === 0 ? <p className="text-sm text-gray-500">No vehicles on file.</p> : (
              vehicles.map((v) => {
                const vehRepairs = repairs.filter((r) => r.vehicle_id === v.id);
                const vehInvoices = invoices.filter((i) => i.vehicle_id === v.id);
                return (
                  <div key={v.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <Car className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-900">{vehicleLabel(v)}</p>
                        <p className="text-xs text-gray-500">{v.mileage.toLocaleString()} mi • {v.license_plate ?? 'No plate'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {vehRepairs.length === 0 && vehInvoices.length === 0 ? (
                        <p className="text-sm text-gray-500">No service history yet.</p>
                      ) : (
                        <>
                          {vehRepairs.map((ro) => (
                            <div key={ro.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                              <div>
                                <p className="font-medium text-gray-900">{ro.customer_concerns || ro.diagnostic_notes || 'Service'}</p>
                                <p className="text-xs text-gray-500">{formatDate(ro.created_at)}</p>
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors(ro.status)}`}>{ro.status}</span>
                            </div>
                          ))}
                          {vehInvoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                              <div>
                                <p className="font-medium text-gray-900">{inv.invoice_number}</p>
                                <p className="text-xs text-gray-500">{formatDate(inv.created_at)}</p>
                              </div>
                              <span className="font-semibold text-gray-900">{formatCurrency(inv.total)}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function HomeCard({ label, value, icon, color, onClick }: { label: string; value: number; icon: React.ReactNode; color: string; onClick: () => void }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left hover:shadow-md transition-all">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </button>
  );
}
