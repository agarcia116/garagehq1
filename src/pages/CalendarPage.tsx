import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { fullName, vehicleLabel, formatTime, statusColors } from '@/lib/utils';
import type { Appointment, Customer, Vehicle, ShopMember } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/EmptyState';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month';

export function CalendarPage() {
  const { shop, member } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [members, setMembers] = useState<ShopMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState({
    customer_id: '', vehicle_id: '', service_description: '', appointment_date: '',
    start_time: '09:00', end_time: '10:00', assigned_bay: '', assigned_technician_id: '', notes: '',
  });

  useEffect(() => { if (shop) loadData(); }, [shop]);

  async function loadData() {
    if (!shop) return;
    const [a, c, v, m] = await Promise.all([
      supabase.from('appointments').select('*').eq('shop_id', shop.id),
      supabase.from('customers').select('*').eq('shop_id', shop.id).order('last_name'),
      supabase.from('vehicles').select('*').eq('shop_id', shop.id),
      supabase.from('shop_members').select('*').eq('shop_id', shop.id),
    ]);
    setAppointments((a.data as Appointment[]) ?? []);
    setCustomers((c.data as Customer[]) ?? []);
    setVehicles((v.data as Vehicle[]) ?? []);
    setMembers((m.data as ShopMember[]) ?? []);
    setLoading(false);
  }

  function openAdd(date?: string) {
    setEditing(null);
    setForm({
      customer_id: '', vehicle_id: '', service_description: '', appointment_date: date ?? currentDate.toISOString().split('T')[0],
      start_time: '09:00', end_time: '10:00', assigned_bay: '', assigned_technician_id: '', notes: '',
    });
    setModalOpen(true);
  }

  function openEdit(apt: Appointment) {
    setEditing(apt);
    setForm({
      customer_id: apt.customer_id ?? '', vehicle_id: apt.vehicle_id ?? '', service_description: apt.service_description,
      appointment_date: apt.appointment_date, start_time: apt.start_time, end_time: apt.end_time,
      assigned_bay: apt.assigned_bay ?? '', assigned_technician_id: apt.assigned_technician_id ?? '', notes: apt.notes ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setError('');
    const payload = {
      shop_id: shop.id,
      customer_id: form.customer_id || null,
      vehicle_id: form.vehicle_id || null,
      service_description: form.service_description,
      appointment_date: form.appointment_date,
      start_time: form.start_time, end_time: form.end_time,
      status: editing ? editing.status : 'confirmed',
      assigned_bay: form.assigned_bay || null,
      assigned_technician_id: form.assigned_technician_id || null,
      notes: form.notes || null,
    };
    if (editing) {
      const { error } = await supabase.from('appointments').update(payload).eq('id', editing.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from('appointments').insert(payload);
      if (error) { setError(error.message); return; }
    }
    setModalOpen(false);
    loadData();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm('Cancel this appointment?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    loadData();
  }

  const customerMap: Record<string, Customer> = {};
  customers.forEach((c) => { customerMap[c.id] = c; });
  const vehicleMap: Record<string, Vehicle> = {};
  vehicles.forEach((v) => { vehicleMap[v.id] = v; });
  const memberMap: Record<string, ShopMember> = {};
  members.forEach((m) => { memberMap[m.id] = m; });

  // Filter appointments for current view
  const todayStr = currentDate.toISOString().split('T')[0];
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const visibleAppointments = appointments.filter((a) => {
    if (viewMode === 'day') return a.appointment_date === todayStr;
    if (viewMode === 'week') {
      const aptDate = new Date(a.appointment_date);
      return aptDate >= weekStart && aptDate <= weekEnd;
    }
    const aptDate = new Date(a.appointment_date);
    return aptDate >= monthStart && aptDate <= monthEnd;
  });

  function navigate(direction: number) {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + direction);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + direction * 7);
    else newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  }

  function getDateLabel() {
    if (viewMode === 'day') return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (viewMode === 'week') return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => navigate(1)} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => setCurrentDate(new Date())} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Today</button>
          <h2 className="ml-2 text-lg font-semibold text-gray-900">{getDateLabel()}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm font-medium capitalize ${viewMode === mode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {mode}
              </button>
            ))}
          </div>
          <button onClick={() => openAdd()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Appointment
          </button>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {/* Appointment list / calendar grid */}
      {visibleAppointments.length === 0 ? (
        <EmptyState icon={<Calendar className="h-8 w-8" />} title="No appointments" description="Schedule a new appointment to fill your calendar." action={{ label: 'New Appointment', onClick: () => openAdd() }} />
      ) : viewMode === 'day' ? (
        <div className="space-y-2">
          {visibleAppointments.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((apt) => (
            <AppointmentCard key={apt.id} apt={apt} customer={apt.customer_id ? customerMap[apt.customer_id] : null} vehicle={apt.vehicle_id ? vehicleMap[apt.vehicle_id] : null} technician={apt.assigned_technician_id ? memberMap[apt.assigned_technician_id] : null} onEdit={() => openEdit(apt)} onDelete={() => handleDelete(apt.id)} onStatusChange={(s) => updateStatus(apt.id, s)} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-3 py-2 text-center text-xs font-semibold uppercase text-gray-500">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {(viewMode === 'week' ? Array.from({ length: 7 }, (_, i) => {
              const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
            }) : Array.from({ length: monthEnd.getDate() }, (_, i) => {
              const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1); return d;
            })).map((day) => {
              const dateStr = day.toISOString().split('T')[0];
              const dayAppts = appointments.filter((a) => a.appointment_date === dateStr);
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              return (
                <div key={dateStr} className={`min-h-24 border-b border-r border-gray-100 p-1.5 ${isToday ? 'bg-blue-50' : ''}`}>
                  <p className={`mb-1 text-xs font-medium ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>{day.getDate()}</p>
                  <div className="space-y-1">
                    {dayAppts.slice(0, 3).map((apt) => (
                      <button key={apt.id} onClick={() => openEdit(apt)}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] text-white ${apt.status === 'confirmed' ? 'bg-blue-500' : apt.status === 'requested' ? 'bg-orange-500' : apt.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'}`}>
                        {apt.start_time} {apt.service_description}
                      </button>
                    ))}
                    {dayAppts.length > 3 && <p className="text-[10px] text-gray-400">+{dayAppts.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Appointment' : 'New Appointment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Customer</label>
            <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
              <option value="">Walk-in / Select customer...</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vehicle</label>
            <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
              <option value="">Select vehicle...</option>
              {vehicles.filter((v) => !form.customer_id || v.customer_id === form.customer_id).map((v) => <option key={v.id} value={v.id}>{vehicleLabel(v)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Service Description</label>
            <input type="text" required value={form.service_description} onChange={(e) => setForm({ ...form, service_description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Oil change, brake inspection, etc." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
              <input type="date" required value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Time</label>
              <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Time</label>
              <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Service Bay</label>
              <select value={form.assigned_bay} onChange={(e) => setForm({ ...form, assigned_bay: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                <option value="">Auto-assign</option>
                <option value="Bay 1">Bay 1</option>
                <option value="Bay 2">Bay 2</option>
                <option value="Bay 3">Bay 3</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Technician</label>
              <select value={form.assigned_technician_id} onChange={(e) => setForm({ ...form, assigned_technician_id: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                <option value="">Unassigned</option>
                {members.filter((m) => m.role === 'mechanic' || m.role === 'owner').map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
          </div>
          {editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select value={editing.status} onChange={(e) => updateStatus(editing.id, e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
                <option value="requested">Requested</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed_apt">Completed</option>
              </select>
            </div>
          )}
          <div className="flex justify-between">
            {editing && <button type="button" onClick={() => handleDelete(editing.id)} className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Cancel Appointment</button>}
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Close</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{editing ? 'Save Changes' : 'Create Appointment'}</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AppointmentCard({ apt, customer, vehicle, technician, onEdit, onDelete, onStatusChange }: {
  apt: Appointment; customer: Customer | null; vehicle: Vehicle | null; technician: ShopMember | null;
  onEdit: () => void; onDelete: () => void; onStatusChange: (status: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-all">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center rounded-lg bg-gray-50 px-3 py-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="mt-1 text-xs font-medium text-gray-700">{formatTime(apt.start_time)}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{apt.service_description}</p>
          <p className="text-sm text-gray-500">
            {customer ? fullName(customer) : 'Walk-in'}
            {vehicle ? ` • ${vehicleLabel(vehicle)}` : ''}
            {apt.assigned_bay ? ` • ${apt.assigned_bay}` : ''}
            {technician ? ` • ${technician.full_name}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors(apt.status)}`}>{apt.status}</span>
        {apt.status === 'requested' && (
          <button onClick={() => onStatusChange('confirmed')} className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700">Confirm</button>
        )}
        <button onClick={onEdit} className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
      </div>
    </div>
  );
}
