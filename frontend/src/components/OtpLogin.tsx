import { useState } from 'react';
import { requestLoginOtp, verifyLoginOtp } from '../api';

interface Props {
  onSuccess: (token: string, user: any) => void;
  onBack: () => void;
}

export default function OtpLogin({ onSuccess, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestLoginOtp({ email });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await verifyLoginOtp({ email, otp });
      onSuccess(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
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
          {step === 'email' ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📧</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Login with OTP</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Enter your email and we'll send you a one-time login code.
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-5">
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
                  {loading ? 'Sending Code...' : '📤 Send Login Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔢</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Enter Your Code</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We sent a 6-digit code to <span className="text-orange-400 font-semibold">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Login Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  />
                  <p className="text-slate-500 text-xs mt-2">Code expires in 10 minutes.</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <p className="text-red-400 text-sm">⚠️ {error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : '🔓 Verify & Login'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                  className="w-full text-slate-400 hover:text-orange-400 text-sm font-medium transition-colors"
                >
                  ← Use a different email
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button onClick={onBack} className="text-slate-400 hover:text-orange-400 text-sm font-medium transition-colors">
              ← Back to Password Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}