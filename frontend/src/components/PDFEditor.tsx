import { useState, useRef } from 'react';

interface SignatureField {
  id: string;
  x: number;
  y: number;
  page: number;
}

interface Props {
  onSave: (signatures: SignatureField[]) => void;
}

export default function PDFEditor({ onSave }: Props) {
  const [signatures, setSignatures] = useState<SignatureField[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSignature: SignatureField = {
      id: `sig-${Date.now()}`,
      x,
      y,
      page: 1,
    };

    setSignatures([...signatures, newSignature]);
  };

  const handleDragStart = (id: string) => {
    setDragging(id);
  };

  const handleDragEnd = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSignatures(signatures.map(sig =>
      sig.id === dragging ? { ...sig, x, y } : sig
    ));
    setDragging(null);
  };

  const removeSignature = (id: string) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
  };

  return (
    <div className="bg-[#0a0a0f] min-h-screen p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">📝 PDF Signature Editor</h2>
          <div className="flex gap-3">
            <p className="text-slate-400 text-sm mt-2">Click anywhere on document to place signature</p>
            <button
              onClick={() => onSave(signatures)}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Save Signatures ({signatures.length})
            </button>
          </div>
        </div>

        {/* PDF Container */}
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          onMouseUp={handleDragEnd}
          className="relative bg-white rounded-2xl cursor-crosshair"
          style={{ height: '700px', overflow: 'hidden' }}
        >
          {/* PDF Placeholder */}
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-400">
              <p className="text-6xl mb-4">📄</p>
              <p className="text-xl font-semibold text-gray-500">PDF Document</p>
              <p className="text-sm text-gray-400 mt-2">Click anywhere to place signature field</p>
            </div>
          </div>

          {/* Signature Fields */}
          {signatures.map((sig) => (
            <div
              key={sig.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleDragStart(sig.id);
              }}
              style={{
                position: 'absolute',
                left: sig.x - 60,
                top: sig.y - 20,
                cursor: 'move',
              }}
              className="group"
            >
              <div className="bg-blue-500/90 border-2 border-blue-400 rounded-lg px-4 py-2 text-white text-sm font-semibold shadow-lg flex items-center gap-2">
                <span>✍️ Sign Here</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSignature(sig.id);
                  }}
                  className="text-white/70 hover:text-white ml-1 text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs text-blue-300 mt-1 text-center">
                x:{Math.round(sig.x)} y:{Math.round(sig.y)}
              </div>
            </div>
          ))}
        </div>

        {/* Signature List */}
        {signatures.length > 0 && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold mb-4 text-slate-300">📋 Placed Signatures</h3>
            <div className="space-y-2">
              {signatures.map((sig, i) => (
                <div key={sig.id} className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-2">
                  <span className="text-sm text-slate-300">Signature {i + 1} — Page {sig.page}</span>
                  <span className="text-xs text-slate-500">x: {Math.round(sig.x)}, y: {Math.round(sig.y)}</span>
                  <button
                    onClick={() => removeSignature(sig.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}