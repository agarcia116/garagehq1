import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#173746] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <img src="/images/GarageHQ_Logo.jpg" alt="GarageHQ Shop Management" className="mb-4 h-auto w-64 rounded-lg" />
          <p className="text-sm text-[#dbe4e5]">Sign in to your shop dashboard</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Welcome Back</h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                placeholder="you@yourshop.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-[#c9d4d2] px-3 py-2 text-gray-900 focus:border-[#d8a653] focus:ring-2 focus:ring-[#d8a653]/30 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#d8a653] px-4 py-2.5 text-sm font-semibold text-[#173746] hover:bg-[#e1b765] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-[#a87524] hover:text-[#7e571b]">
              Register your shop
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Are you a customer?{' '}
          <Link to="/portal" className="font-medium text-[#d8a653] hover:text-[#e1b765]">
            Customer Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
