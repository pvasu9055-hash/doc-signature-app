import { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { DndContext, useDraggable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import axios from 'axios';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
interface Signature {
  id: string;
  x: number;
  y: number;
  page: number;
}

interface Props {
  documentId: number;
  filepath: string;
  onBack: () => void;
}

function DraggableSignature({ sig, index, onRemove }: { sig: Signature, index: number, onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: sig.id });
  const style = {
    position: 'absolute' as const,
    left: sig.x + (transform?.x || 0),
    top: sig.y + (transform?.y || 0),
    zIndex: 10,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div className="bg-orange-500/90 border-2 border-orange-400 rounded-lg px-3 py-1.5 text-white text-xs font-bold shadow-lg flex items-center gap-2 select-none">
        <span>✍️ {JSON.parse(localStorage.getItem('user') || '{}').name || 'Sign Here'}</span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onRemove(sig.id)}
          className="text-white/70 hover:text-white ml-1">✕</button>
      </div>
    </div>
  );
}

export default function SignPage({ documentId, filepath, onBack }: Props) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [numPages, setNumPages] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'pending' | 'signed' | 'rejected'>('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pdfUrl = `http://localhost:5000/${filepath}`;

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - 60;
    const y = e.clientY - rect.top - 20;
    setSignatures([...signatures, {
      id: `sig-${Date.now()}`,
      x, y, page: 1
    }]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    setSignatures(sigs => sigs.map(s =>
      s.id === active.id
        ? { ...s, x: s.x + delta.x, y: s.y + delta.y }
        : s
    ));
  };

  const removeSignature = (id: string) => {
    setSignatures(signatures.filter(s => s.id !== id));
  };

  const handleSave = async (finalStatus: 'signed' | 'rejected') => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      for (const sig of signatures) {
        await axios.post('http://localhost:5000/api/signatures', {
          documentId,
          x: sig.x,
          y: sig.y,
          page: sig.page,
          status: finalStatus
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setStatus(finalStatus);
      alert(finalStatus === 'signed' ? '✅ Document signed successfully!' : '❌ Document rejected!');
      onBack();
    } catch (error) {
      alert('❌ Failed to save!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition">
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-black">✍️ Sign Document</h1>
              <p className="text-slate-400 text-sm">Click to place • Drag to move • Save when done</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSignatures([])} className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition">
              🗑️ Clear
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500/30 transition">
              ❌ Reject
            </button>
            <button
              onClick={() => handleSave('signed')}
              disabled={saving || signatures.length === 0}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50">
              {saving ? '⏳ Saving...' : `✅ Sign & Save (${signatures.length})`}
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex gap-3 mb-4">
          {['pending', 'signed', 'rejected'].map((s) => (
            <div key={s} className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize ${status === s ? s === 'signed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : s === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-slate-500'}`}>
              {s === 'pending' ? '⏳' : s === 'signed' ? '✅' : '❌'} {s}
            </div>
          ))}
        </div>

        {/* PDF + Signature Canvas */}
        <DndContext onDragEnd={handleDragEnd}>
          <div
            ref={containerRef}
            onClick={handleContainerClick}
            className="relative bg-white rounded-2xl cursor-crosshair shadow-2xl overflow-auto"
            style={{ maxHeight: '700px' }}>

            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              className="w-full">
              {Array.from({ length: numPages }, (_, i) => (
                <Page key={i + 1} pageNumber={i + 1} width={900} />
              ))}
            </Document>

            {signatures.map((sig, i) => (
              <DraggableSignature
                key={sig.id}
                sig={sig}
                index={i}
                onRemove={removeSignature}
              />
            ))}
          </div>
        </DndContext>

        {/* Signatures List */}
        {signatures.length > 0 && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="font-bold mb-3 text-slate-300">📋 Placed Signatures ({signatures.length})</h3>
            <div className="space-y-2">
              {signatures.map((sig, i) => (
                <div key={sig.id} className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-2">
                  <span className="text-sm text-slate-300">Signature {i + 1}</span>
                  <span className="text-xs text-slate-500">x: {Math.round(sig.x)}, y: {Math.round(sig.y)}</span>
                  <button onClick={() => removeSignature(sig.id)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-black mb-4">❌ Reject Document</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 h-32 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 bg-white/10 text-white py-2 rounded-xl hover:bg-white/20 transition">
                Cancel
              </button>
              <button
                onClick={() => { setShowRejectModal(false); handleSave('rejected'); }}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl font-bold hover:opacity-90 transition">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}