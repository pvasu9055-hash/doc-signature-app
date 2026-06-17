import { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../api';

interface Props {
  documentId: number;
  filename: string;
  onClose: () => void;
}

export default function ShareModal({ documentId, filename, onClose }: Props) {
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [link, setLink] = useState('');

  const handleSend = async () => {
    if (!signerEmail) {
      alert('Please enter signer email!');
      return;
    }
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${BACKEND_URL}/api/email/send-link`,
        { documentId, signerEmail, signerName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLink(res.data.signingLink);
      setSent(true);

      // Save to shared links history
      const history = JSON.parse(localStorage.getItem('sharedLinks') || '[]');
      history.unshift({
        id: Date.now(),
        documentId,
        filename,
        signerName,
        signerEmail,
        link: res.data.signingLink,
        sentAt: new Date().toISOString()
      });
      localStorage.setItem('sharedLinks', JSON.stringify(history.slice(0, 50)));
    } catch (error) {
      alert('❌ Failed to send! Check email settings.');
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    alert('🔗 Link copied!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-white">🔗 Share Document</h3>
            <p className="text-slate-400 text-sm mt-1 truncate">{filename}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl transition">✕</button>
        </div>

        {!sent ? (
          <>
            <div className="mb-4">
              <label className="text-slate-300 text-sm font-medium mb-2 block">Signer Name</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter signer's name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            <div className="mb-6">
              <label className="text-slate-300 text-sm font-medium mb-2 block">Signer Email</label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="Enter signer's email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition font-semibold">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50">
                {sending ? '⏳ Sending...' : '📧 Send Link'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h4 className="text-xl font-black text-white mb-2">Link Sent!</h4>
            <p className="text-slate-400 text-sm mb-6">
              Signing link sent to <span className="text-orange-400 font-semibold">{signerEmail}</span>
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
              <p className="text-slate-400 text-xs mb-2">Signing Link:</p>
              <p className="text-orange-400 text-xs break-all">{link}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyLink}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition font-semibold">
                📋 Copy Link
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
                Done ✅
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}