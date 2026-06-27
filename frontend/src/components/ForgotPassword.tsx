import { useState } from 'react';

interface Props {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setSent(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/30">
              ✍️
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">DocSign</span>
          </div>
          <p className="text-slate-400 text-sm">Enterprise Document Signing</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {!sent ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  No worries! Enter your email and we'll send you a secure reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <p className="text-red-400 text-sm">⚠️ {error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending Reset Link...
                    </span>
                  ) : '📧 Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Check Your Email!</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-2">We sent a password reset link to</p>
              <p className="text-orange-400 font-semibold mb-6">{email}</p>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 text-left">
                <p className="text-slate-400 text-xs leading-relaxed">
                  💡 <strong className="text-slate-300">Didn't receive it?</strong> Check your spam folder. The link expires in <strong className="text-white">1 hour</strong>.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
              >
                ← Try a different email
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-orange-400 text-sm font-medium transition-colors"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          {['SOC 2', 'HIPAA', 'eIDAS', 'ESIGN'].map((badge) => (
            <span key={badge} className="text-xs text-slate-600 font-medium">🔒 {badge}</span>
          ))}
        </div>
      </div>
    </div>
  );
}