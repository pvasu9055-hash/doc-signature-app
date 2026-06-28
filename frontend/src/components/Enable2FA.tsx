import { useState } from 'react';
import { Copy, ArrowLeft } from 'lucide-react';

interface Enable2FAProps {
  userId: number;
  onSetupComplete: () => void;
  onBack: () => void;
}

export default function Enable2FA({ userId, onSetupComplete, onBack }: Enable2FAProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/2fa/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔐</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Enable Two-Factor Authentication</h2>
              <p className="text-slate-400">Secure your DocSign account with 2FA</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">✓</span>
                  <span>Download Google Authenticator or Authy on your phone</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">✓</span>
                  <span>Scan the QR code we'll generate</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">✓</span>
                  <span>Enter the 6-digit code to verify</span>
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
                <p className="text-red-300 text-sm">⚠️ {error}</p>
              </div>
            )}

            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? '⏳ Generating QR Code...' : '📱 Continue to Setup'}
            </button>

            <button
              onClick={onBack}
              className="w-full mt-3 text-slate-400 hover:text-white font-medium py-2 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Scan QR Code</h2>
            <p className="text-slate-400">Use Google Authenticator or Authy</p>
          </div>

          <div className="bg-white rounded-lg p-4 mb-6 flex justify-center">
            <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
            <p className="text-xs text-slate-400 mb-2">Can't scan? Enter this code manually:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-orange-400 font-mono break-all">
                {secret}
              </code>
              <button
                onClick={copySecret}
                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded transition-colors"
                title="Copy"
              >
                <Copy size={18} />
              </button>
            </div>
            {copied && <p className="text-green-400 text-xs mt-2">✓ Copied!</p>}
          </div>

          <button
            onClick={() => onSetupComplete()}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            ✓ I've Scanned the QR Code
          </button>
        </div>
      </div>
    </div>
  );
}