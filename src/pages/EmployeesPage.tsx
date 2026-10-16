import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import type { ShopMember } from '@/lib/types';
import { Modal } from '@/components/Modal';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/EmptyState';
import { UserCog, Plus, Trash2, Mail, Shield } from 'lucide-react';

const ROLES = [
  { value: 'owner', label: 'Owner / Admin', desc: 'Full access to everything' },
  { value: 'admin', label: 'Office Employee', desc: 'Scheduling, customers, invoices (no settings)' },
  { value: 'mechanic', label: 'Mechanic', desc: 'View assigned repairs, add notes, update progress' },
];

export function EmployeesPage() {
  const { shop, member } = useAuth();
  const [members, setMembers] = useState<ShopMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'mechanic' });

  useEffect(() => { if (shop) loadData(); }, [shop]);

  async function loadData() {
    if (!shop) return;
    const { data } = await supabase.from('shop_members').select('*').eq('shop_id', shop.id).order('created_at');
    setMembers((data as ShopMember[]) ?? []);
    setLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setError('Your session has expired. Please sign in again.');
        setSubmitting(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-employee`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: form.email,
          full_name: form.full_name,
          role: form.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to add employee');
        setSubmitting(false);
        return;
      }

      setSuccess(`Employee added! ${form.full_name} can now sign in with ${form.email}.`);
      setModalOpen(false);
      setForm({ full_name: '', email: '', role: 'mechanic' });
      loadData();
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  async function updateRole(id: string, role: string) {
    await supabase.from('shop_members').update({ role }).eq('id', id);
    loadData();
  }

  async function handleRemove(id: string) {
    if (member?.role !== 'owner') return;
    if (member?.id === id) {
      alert('You cannot remove yourself.');
      return;
    }
    if (!confirm('Remove this employee from your shop?')) return;
    await supabase.from('shop_members').delete().eq('id', id);
    loadData();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <Shield className="h-4 w-4 shrink-0" />{success}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm text-gray-500">{members.length} team member(s)</h2>
        <button onClick={() => { setForm({ full_name: '', email: '', role: 'mechanic' }); setSuccess(''); setError(''); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      {error && <ErrorState message={error} />}

      {members.length === 0 ? (
        <EmptyState icon={<UserCog className="h-8 w-8" />} title="No employees" description="Add team members to give them access to your shop." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {m.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{m.full_name}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3 w-3" />{m.email}</p>
                  </div>
                </div>
                {m.role === 'owner' && <Shield className="h-4 w-4 text-blue-500" />}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500">Role</label>
                <select value={m.role} onChange={(e) => updateRole(m.id, e.target.value)} disabled={m.role === 'owner' || member?.role !== 'owner'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-50 disabled:text-gray-500">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <p className="text-xs text-gray-400">{ROLES.find((r) => r.value === m.role)?.desc}</p>
                <p className="text-xs text-gray-400">Joined {formatDate(m.created_at)}</p>
              </div>
              {member?.role === 'owner' && m.role !== 'owner' && (
                <button onClick={() => handleRemove(m.id)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" /> Remove from shop
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Employee">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="jane@yourshop.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
              {ROLES.filter((r) => r.value !== 'owner').map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-500">{ROLES.find((r) => r.value === form.role)?.desc}</p>
          </div>
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            An account will be created for this employee. They can sign in with their email. A temporary password will be generated and they should reset it on first login.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
