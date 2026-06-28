import { useState } from 'react';
import { ShieldCheck, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { BACKEND_URL } from '../api';

interface VerifyTwoFactorSetupProps {
  userId: string;
  secret: string; // ← received from Enable2FA via Dashboard state
  onSuccess: () => void;
  onBack: () => void;
}

export default function VerifyTwoFactorSetup({ userId, secret, onSuccess, onBack }: VerifyTwoFactorSetupProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const res = await fetch(`${BACKEND_URL}/api/2fa/verify-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, token: code, secret }), // ← send secret!
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Invalid code. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (error) setError('');
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e' }}>
            <CheckCircle size={48} color="#22c55e" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>2FA Enabled!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Your account is now protected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            <ShieldCheck size={36} color="white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Verify Your Setup
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          {/* Step indicators */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: '#22c55e' }}>✓</div>
            <div className="flex-1 h-0.5" style={{ background: '#f97316' }}></div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: '#f97316' }}>2</div>
          </div>

          {/* Code input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Authentication Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={handleInput}
              placeholder="000000"
              className="w-full px-4 py-4 rounded-xl text-center text-2xl font-mono tracking-widest outline-none transition-all"
              style={{
                background: 'var(--bg-tertiary)',
                border: `2px solid ${error ? '#ef4444' : code.length === 6 ? '#22c55e' : 'var(--border-color)'}`,
                color: 'var(--text-primary)',
              }}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
              Enter the 6-digit code displayed in your authenticator app
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl mb-6"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertTriangle size={18} color="#ef4444" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={onBack}
              className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              <ArrowLeft size={18} />
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: code.length === 6 && !loading
                  ? 'linear-gradient(135deg, #f97316, #ea580c)'
                  : 'var(--bg-tertiary)',
                color: code.length === 6 && !loading ? 'white' : 'var(--text-secondary)',
                cursor: code.length === 6 && !loading ? 'pointer' : 'not-allowed',
              }}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Verify & Enable 2FA
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
