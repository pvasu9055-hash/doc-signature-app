import { useState, useEffect } from 'react';

interface Props {
  onSuccess: () => void;
}

export default function ResetPassword({ onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) {
      setError('Invalid or missing reset token. Please request a new link.');
    } else {
      setToken(t);
    }
  }, []);

  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthTextColor = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-blue-400', 'text-green-400'];
  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setSuccess(true);
        setTimeout(() => onSuccess(), 3000);
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
          {success ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Password Reset!</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Your password has been reset successfully. Redirecting to login in 3 seconds...
              </p>
              <button
                onClick={onSuccess}
                className="inline-block py-3 px-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl"
              >
                Go to Sign In →
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔑</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
                <p className="text-slate-400 text-sm">Choose a strong password for your account.</p>
              </div>

              {!token && error ? (
                <div className="text-center">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-4 mb-6">
                    <p className="text-red-400 text-sm">⚠️ {error}</p>
                  </div>
                  <button
                    onClick={onSuccess}
                    className="inline-block py-3 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl text-sm"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all pr-12"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4,5].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : 'bg-slate-700'}`} />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${strengthTextColor[strength]}`}>{strengthLabel[strength]}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all pr-12 ${
                          confirm && password !== confirm ? 'border-red-500 focus:ring-red-500/50'
                          : confirm && password === confirm ? 'border-green-500 focus:ring-green-500/50'
                          : 'border-slate-700 focus:ring-orange-500/50 focus:border-orange-500'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                        {showConfirm ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {confirm && password !== confirm && <p className="text-red-400 text-xs mt-1">Passwords do not match</p>}
                    {confirm && password === confirm && <p className="text-green-400 text-xs mt-1">✓ Passwords match</p>}
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <p className="text-red-400 text-sm">⚠️ {error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Resetting Password...
                      </span>
                    ) : '🔐 Reset Password'}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button onClick={onSuccess} className="text-slate-400 hover:text-orange-400 text-sm font-medium transition-colors">
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