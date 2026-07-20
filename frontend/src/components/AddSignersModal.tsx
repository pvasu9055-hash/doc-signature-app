import { useState } from 'react';
import { addSigners } from '../api';

interface SignerInput {
  name: string;
  email: string;
}

interface Props {
  documentId: number;
  filename: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSignersModal({ documentId, filename, onClose, onSuccess }: Props) {
  const [signers, setSigners] = useState<SignerInput[]>([{ name: '', email: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const addRow = () => setSigners([...signers, { name: '', email: '' }]);

  const removeRow = (index: number) => {
    if (signers.length === 1) return;
    setSigners(signers.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...signers];
    updated[index][field] = value;
    setSigners(updated);
  };

  const handleSubmit = async () => {
    setError('');
    const validSigners = signers.filter(s => s.name.trim() && s.email.trim());
    if (validSigners.length === 0) {
      setError('Please add at least one signer with name and email.');
      return;
    }

    setSaving(true);
    try {
      await addSigners(documentId, validSigners);
      setSent(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add signers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {sent ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-black text-white mb-2">Signers Notified!</h3>
            <p className="text-slate-400 text-sm">Each signer has been emailed a link to sign the document.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-white">👥 Add Signers</h3>
                <p className="text-slate-400 text-sm mt-1">{filename}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <p className="text-slate-400 text-xs mb-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              Add one or more people to sign this document. Everyone can sign in any order — the document is marked "Signed" once everyone has completed their signature.
            </p>

            <div className="space-y-3 mb-4">
              {signers.map((signer, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={signer.name}
                      onChange={(e) => updateRow(index, 'name', e.target.value)}
                      placeholder="Signer name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                    />
                    <input
                      type="email"
                      value={signer.email}
                      onChange={(e) => updateRow(index, 'email', e.target.value)}
                      placeholder="signer@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  {signers.length > 1 && (
                    <button
                      onClick={() => removeRow(index)}
                      className="text-red-400 hover:text-red-300 text-sm mt-2.5 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addRow}
              className="w-full bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition mb-4 border border-white/10 border-dashed"
            >
              + Add Another Signer
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                <p className="text-red-400 text-sm">⚠️ {error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 bg-white/10 text-white py-2.5 rounded-xl hover:bg-white/20 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Sending...' : '📧 Send Signing Requests'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}