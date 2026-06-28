import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
});

type TwoFactorFormData = z.infer<typeof schema>;

interface VerifyTwoFactorLoginProps {
  userId: number;
  onSuccess: (token: string, user: any) => void;
  onBack: () => void;
}

export default function VerifyTwoFactorLogin({ userId, onSuccess, onBack }: VerifyTwoFactorLoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(schema),
  });

  const code = watch('code', '');

  const onSubmit = async (data: TwoFactorFormData) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/2fa/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: data.code }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }

      // Generate JWT token for the session
      const loginResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, twoFactorVerified: true }),
      });

      const loginData = await loginResponse.json();
      if (loginData.token) {
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        onSuccess(loginData.token, loginData.user);
      } else {
        throw new Error('Failed to generate session token');
      }
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
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Enter Authentication Code</h2>
            <p className="text-slate-400">Check your authenticator app for the 6-digit code</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">Authentication Code</label>
              <input
                type="text"
                {...register('code', {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  },
                })}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-center text-2xl font-mono text-white placeholder-slate-600 focus:border-orange-500 focus:outline-none transition-colors"
                autoFocus
              />
              {errors.code && (
                <p className="text-red-400 text-sm mt-2">⚠️ {errors.code.message}</p>
              )}
              <p className="text-xs text-slate-500 mt-2">Enter the 6-digit code from your authenticator app</p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
                <p className="text-red-300 text-sm">⚠️ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              {loading ? '⏳ Verifying...' : '✓ Verify & Login'}
            </button>
          </form>

          <button
            onClick={onBack}
            className="w-full mt-3 text-slate-400 hover:text-white font-medium py-2 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} /> Back to Login
          </button>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mt-6">
            <p className="text-xs text-slate-400">
              💡 <strong>Tip:</strong> If you can't access your authenticator app, use your backup codes (if you saved them).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}