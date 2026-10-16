import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import type { Shop } from '@/lib/types';
import { ErrorState, LoadingSpinner } from '@/components/EmptyState';
import { Settings as SettingsIcon, Save, CheckCircle2, CreditCard, Clock } from 'lucide-react';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

export function SettingsPage() {
  const { shop, member, refreshMember } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', address: '', city: '', state: '', zip_code: '', subscription_price: '159.99',
  });
  const [hours, setHours] = useState<Record<string, { open: string; close: string } | null>>({});

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name, phone: shop.phone ?? '', address: shop.address ?? '',
        city: shop.city ?? '', state: shop.state ?? '', zip_code: shop.zip_code ?? '',
        subscription_price: String(shop.subscription_price),
      });
      const loadedHours: Record<string, { open: string; close: string } | null> = {};
      DAYS.forEach((day) => {
        loadedHours[day] = shop.business_hours?.[day] ?? null;
      });
      setHours(loadedHours);
      setLoading(false);
    }
  }, [shop]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setSaving(true);
    setError('');
    setSaved(false);

    const { error } = await supabase.from('shops').update({
      name: form.name, phone: form.phone, address: form.address,
      city: form.city, state: form.state, zip_code: form.zip_code,
      subscription_price: parseFloat(form.subscription_price),
      business_hours: hours,
    }).eq('id', shop.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    refreshMember();
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <LoadingSpinner />;

  const isOwner = member?.role === 'owner';

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-3xl">
      {error && <ErrorState message={error} />}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5" /> Settings saved successfully.
        </div>
      )}

      {/* Shop Profile */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Shop Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Shop Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" disabled={!isOwner} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" disabled={!isOwner} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" disabled={!isOwner} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" disabled={!isOwner} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" disabled={!isOwner} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Zip</label>
              <input type="text" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" disabled={!isOwner} />
            </div>
          </div>
        </div>
      </form>

      {/* Business Hours */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Business Hours</h2>
        </div>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const dayHours = hours[day];
            return (
              <div key={day} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium text-gray-700">{DAY_LABELS[day]}</span>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={dayHours !== null} disabled={!isOwner}
                    onChange={(e) => {
                      setHours({ ...hours, [day]: e.target.checked ? { open: '08:00', close: '17:00' } : null });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  Open
                </label>
                {dayHours ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={dayHours.open} disabled={!isOwner}
                      onChange={(e) => setHours({ ...hours, [day]: { ...dayHours, open: e.target.value } })}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-sm" />
                    <span className="text-gray-400">to</span>
                    <input type="time" value={dayHours.close} disabled={!isOwner}
                      onChange={(e) => setHours({ ...hours, [day]: { ...dayHours, close: e.target.value } })}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-sm" />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Subscription</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Garage HQ Standard Plan</p>
              <p className="text-xs text-gray-500">Monthly subscription per repair shop</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${shop?.subscription_status === 'trial' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
              {shop?.subscription_status}
            </span>
          </div>
          {isOwner && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Monthly Price (USD)</label>
              <input type="number" step="0.01" value={form.subscription_price} onChange={(e) => setForm({ ...form, subscription_price: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
              <p className="mt-1 text-xs text-gray-500">Configurable by administrators. Current: {formatCurrency(parseFloat(form.subscription_price) || 0)}/month</p>
            </div>
          )}
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Payment processing is in demonstration mode. No actual charges will be made until Stripe is securely configured.
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="flex justify-end">
          <button onClick={handleSubmit} disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}
