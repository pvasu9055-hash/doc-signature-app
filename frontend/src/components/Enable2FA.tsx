import { useState, useEffect } from 'react';
import { Shield, QrCode, Smartphone, ArrowLeft, ArrowRight } from 'lucide-react';
import { BACKEND_URL } from '../api';

interface Enable2FAProps {
  userId: string;
  onSetupComplete: (secret: string) => void; // ← passes secret back to Dashboard
  onBack: () => void;
}

export default function Enable2FA({ userId, onSetupComplete, onBack }: Enable2FAProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error('Failed to generate QR code');

      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret); // ← capture secret from backend
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            <Shield size={36} color="white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Setup Two-Factor Auth
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Scan the QR code with Google Authenticator or Authy
          </p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          {/* Step indicators */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: '#f97316' }}>1</div>
            <div className="flex-1 h-0.5" style={{ background: '#f97316' }}></div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>2</div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>Generating QR code...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={generateQR}
                className="px-6 py-2 rounded-lg text-white font-medium"
                style={{ background: '#f97316' }}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div className="flex flex-col items-center mb-6">
                <div className="p-4 rounded-xl mb-4" style={{ background: 'white' }}>
                  {qrCode && (
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <QrCode size={16} />
                  <span>Scan with your authenticator app</span>
                </div>
              </div>

              {/* Manual entry */}
              <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-tertiary)' }}>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Can't scan? Enter this code manually:
                </p>
                <code className="text-sm font-mono break-all" style={{ color: '#f97316' }}>
                  {secret}
                </code>
              </div>

              {/* Instructions */}
              <div className="flex items-start gap-3 mb-8 p-4 rounded-xl"
                style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <Smartphone size={20} color="#f97316" className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#f97316' }}>After scanning:</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Open your authenticator app and scan the QR code above. Then click "Next" to verify with the 6-digit code.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button onClick={onBack}
                  className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  onClick={() => onSetupComplete(secret)} // ← pass secret up!
                  className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                  Next
                  <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Back link */}
        <button onClick={onBack}
          className="flex items-center gap-2 mt-6 mx-auto text-sm"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} />
          Back to Settings
        </button>
      </div>
    </div>
  );
}