import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface VerifyTwoFactorSetupProps {
  userId: number;
  secret: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function VerifyTwoFactorSetup({ userId, secret, onSuccess, onBack }: VerifyTwoFactorSetupProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/2fa/verify-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, secret, code }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">2FA Enabled!</h2>
              <p className="text-slate-400">Your account is now protected with two-factor authentication</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verify Your Setup</h2>
                <p className="text-slate-400">Enter the 6-digit code from your authenticator app</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">Authentication Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-center text-2xl font-mono text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none transition-colors"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">Enter the 6-digit code displayed in your authenticator app</p>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
                  <p className="text-red-300 text-sm">⚠️ {error}</p>
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading || code.length !== 6}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
              >
                {loading ? '⏳ Verifying...' : '✓ Verify & Enable 2FA'}
              </button>

              <button
                onClick={onBack}
                className="w-full mt-3 text-slate-400 hover:text-white font-medium py-2 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}