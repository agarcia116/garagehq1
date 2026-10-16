import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setError('Failed to create account. Please try again.');
      setLoading(false);
      return;
    }

    // Create the shop
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .insert({
        name: shopName,
        owner_email: email,
        phone,
        address,
        city,
        state,
        zip_code: zipCode,
        subscription_status: 'trial',
      })
      .select()
      .single();

    if (shopError) {
      setError(`Failed to create shop: ${shopError.message}`);
      setLoading(false);
      return;
    }

    // Link the user as owner in shop_members
    const { error: memberError } = await supabase.from('shop_members').insert({
      shop_id: shopData.id,
      user_id: userId,
      role: 'owner',
      full_name: ownerName,
      email,
    });

    if (memberError) {
      setError(`Failed to set up your account: ${memberError.message}`);
      setLoading(false);
      return;
    }

    setStep('success');
    setLoading(false);
  };

  if (step === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#173746] px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Shop Registered!</h2>
          <p className="mb-6 text-sm text-gray-600">
            Your shop has been set up successfully. You can now sign in to start managing your business.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-lg bg-[#d8a653] px-4 py-2.5 text-sm font-semibold text-[#173746] hover:bg-[#e1b765] transition-colors"
          >
            Continue to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#173746] px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center">
          <img src="/images/GarageHQ_Logo.jpg" alt="GarageHQ Shop Management" className="mb-3 h-auto w-64 rounded-lg" />
          <h1 className="text-xl font-bold text-white">Register Your Shop</h1>
          <p className="text-sm text-[#dbe4e5]">Get started with GarageHQ — $159.99/month after trial</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-xl">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Shop Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Shop Name</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                    placeholder="Joe's Auto Repair"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                    placeholder="Springfield"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      maxLength={2}
                      className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                      placeholder="IL"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Zip</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                      placeholder="62701"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Owner Account</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                    placeholder="Joe Smith"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                    placeholder="joe@joesautorepair.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#d8a653] px-4 py-2.5 text-sm font-semibold text-[#173746] hover:bg-[#e1b765] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating your account...' : 'Register Shop — Start Free Trial'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#a87524] hover:text-[#7e571b]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
