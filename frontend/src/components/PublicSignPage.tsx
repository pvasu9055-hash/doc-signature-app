import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { DndContext, useDraggable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import axios from 'axios';
import { BACKEND_URL } from '../api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const RENDER_WIDTH = 900;
const PAGE_GAP = 8;

interface Signature {
  id: string;
  x: number;
  y: number;
  page: number;
}

interface Props {
  token: string;
  docId: string;
}

function DraggableSignature({ sig, signerName, drawnImage, onRemove }: {
  sig: Signature, signerName: string, drawnImage: string | null, onRemove: (id: string) => void
}) {
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
      {drawnImage ? (
        <div className="border-2 border-orange-400 rounded-lg bg-white/90 shadow-lg flex items-center gap-1 select-none p-1">
          <img src={drawnImage} alt="signature" className="h-8 w-auto" />
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onRemove(sig.id)} className="text-red-400 hover:text-red-600 ml-1 text-xs">✕</button>
        </div>
      ) : (
        <div className="bg-orange-500/90 border-2 border-orange-400 rounded-lg px-3 py-1.5 text-white text-xs font-bold shadow-lg flex items-center gap-2 select-none">
          <span>✍️ {signerName || 'Sign Here'}</span>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onRemove(sig.id)} className="text-white/70 hover:text-white ml-1">✕</button>
        </div>
      )}
    </div>
  );
}

export default function PublicSignPage({ token, docId }: Props) {
  const [document, setDocument] = useState<any>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [step, setStep] = useState<'info' | 'sign' | 'done'>('info');
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [numPages, setNumPages] = useState(1);
  const [pageHeight, setPageHeight] = useState(1165);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signedFileUrl, setSignedFileUrl] = useState('');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/email/signing-request?token=${token}&docId=${docId}`);
        setDocument(res.data.document);
      } catch (err) {
        setError('Invalid or expired signing link!');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [token, docId]);

  // Canvas drawing
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setDrawnSignature(dataUrl);
    setShowCanvas(false);
    setSignatures([...signatures, { id: `sig-drawn-${Date.now()}`, x: 150, y: 150, page: 1 }]);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showCanvas) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const absoluteY = (e.clientY - rect.top) + scrollTop;
    const x = e.clientX - rect.left - 60;
    const slot = pageHeight + PAGE_GAP;
    const pageIndex = Math.floor(absoluteY / slot);
    const yWithinPage = absoluteY - (pageIndex * slot);
    const pageNum = Math.min(Math.max(pageIndex + 1, 1), numPages);
    setSignatures([...signatures, { id: `sig-${Date.now()}`, x, y: yWithinPage - 20, page: pageNum }]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    setSignatures(sigs => sigs.map(s => {
      if (s.id !== active.id) return s;
      const newAbsoluteY = (s.page - 1) * (pageHeight + PAGE_GAP) + s.y + delta.y;
      const slot = pageHeight + PAGE_GAP;
      const newPageIndex = Math.floor(newAbsoluteY / slot);
      const newPageNum = Math.min(Math.max(newPageIndex + 1, 1), numPages);
      const newYWithinPage = newAbsoluteY - (newPageIndex * slot);
      return { ...s, x: s.x + delta.x, y: newYWithinPage, page: newPageNum };
    }));
  };

  const handleSave = async () => {
    if (signatures.length === 0) { alert('Please place at least one signature!'); return; }
    try {
      setSaving(true);
      for (const sig of signatures) {
        await axios.post(`${BACKEND_URL}/api/email/public-sign`, {
          token, docId, signerName, signerEmail,
          x: sig.x, y: sig.y, page: sig.page,
          signatureImage: sig.id.includes('drawn') ? drawnSignature : null
        });
      }

      // Finalize - embed signature into PDF
      const finalizeRes = await axios.post(`${BACKEND_URL}/api/email/public-finalize`, {
        docId, signerName
      });
      setSignedFileUrl(`${BACKEND_URL}/${finalizeRes.data.signedFile}`);
      setStep('done');
    } catch (error) {
      alert('❌ Failed to sign document!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white">Loading document...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-black text-white mb-2">Invalid Link</h2>
        <p className="text-slate-400">{error}</p>
      </div>
    </div>
  );

  if (step === 'done') return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-white mb-2">Document Signed!</h2>
        <p className="text-slate-400 mb-2">Thank you <span className="text-orange-400 font-bold">{signerName}</span>!</p>
        <p className="text-slate-500 text-sm mb-6">Your signature has been recorded for <strong className="text-white">{document?.filename}</strong></p>
        {signedFileUrl && (
          <button onClick={() => window.open(signedFileUrl, '_blank')}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
            📄 Download Signed PDF
          </button>
        )}
      </div>
    </div>
  );

  if (step === 'info') return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🖊️</span>
          <h1 className="text-2xl font-black text-white mt-2">DocSign</h1>
          <p className="text-slate-400 mt-1">You've been invited to sign a document</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
            <p className="text-slate-400 text-xs">Document to sign:</p>
            <p className="text-white font-bold">{document?.filename}</p>
          </div>
          <div className="mb-4">
            <label className="text-slate-300 text-sm font-medium mb-2 block">Your Full Name</label>
            <input type="text" value={signerName} onChange={(e) => setSignerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition" />
          </div>
          <div className="mb-6">
            <label className="text-slate-300 text-sm font-medium mb-2 block">Your Email</label>
            <input type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition" />
          </div>
          <button onClick={() => { if (!signerName) { alert('Please enter your name!'); return; } setStep('sign'); }}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
            Continue to Sign →
          </button>
        </div>
      </div>
    </div>
  );

  const pdfUrl = `${BACKEND_URL}/${document?.filepath}`;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black">✍️ Sign Document</h1>
            <p className="text-slate-400 text-sm">Click to place • Drag to move • Sign when done</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCanvas(true)}
              className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl hover:bg-blue-500/30 transition">
              ✏️ Draw Signature
            </button>
            <button onClick={() => setSignatures([])} className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition">🗑️ Clear</button>
            <button onClick={handleSave} disabled={saving || signatures.length === 0}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50">
              {saving ? '⏳ Signing...' : `✅ Sign Document (${signatures.length})`}
            </button>
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 mb-4 text-sm text-orange-300">
          📄 Signing as <strong>{signerName}</strong> — Click anywhere on PDF to place signature or use Draw Signature
        </div>

        {drawnSignature && (
          <div className="mb-4 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <span className="text-slate-300 text-sm">✅ Drawn signature ready:</span>
            <img src={drawnSignature} alt="signature" className="h-8 w-auto bg-white rounded px-2" />
            <button onClick={() => setDrawnSignature(null)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
          </div>
        )}

        <DndContext onDragEnd={handleDragEnd}>
          <div ref={containerRef} onClick={handleContainerClick}
            className="relative bg-white rounded-2xl cursor-crosshair shadow-2xl overflow-auto"
            style={{ maxHeight: '700px' }}>
            <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)} className="w-full">
              {Array.from({ length: numPages }, (_, i) => (
                <div key={i + 1} style={{ marginBottom: PAGE_GAP }}>
                  <Page pageNumber={i + 1} width={RENDER_WIDTH}
                    onLoadSuccess={i === 0 ? (page: any) => {
                      if (page.originalWidth && page.originalHeight) {
                        setPageHeight((page.originalHeight / page.originalWidth) * RENDER_WIDTH);
                      }
                    } : undefined} />
                </div>
              ))}
            </Document>
            {signatures.map((sig) => {
              const slot = pageHeight + PAGE_GAP;
              const absoluteTop = (sig.page - 1) * slot + sig.y;
              return (
                <DraggableSignature
                  key={sig.id}
                  sig={{ ...sig, y: absoluteTop }}
                  signerName={signerName}
                  drawnImage={sig.id.includes('drawn') ? drawnSignature : null}
                  onRemove={(id) => setSignatures(signatures.filter(s => s.id !== id))}
                />
              );
            })}
          </div>
        </DndContext>
      </div>

      {/* Draw Signature Modal */}
      {showCanvas && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-black mb-4">✏️ Draw Your Signature</h3>
            <canvas ref={canvasRef} width={500} height={200}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              className="bg-white rounded-xl w-full cursor-crosshair border-2 border-orange-500/30" />
            <div className="flex gap-3 mt-4">
              <button onClick={clearCanvas} className="flex-1 bg-white/10 text-white py-2 rounded-xl hover:bg-white/20 transition">🗑️ Clear</button>
              <button onClick={() => setShowCanvas(false)} className="flex-1 bg-white/10 text-white py-2 rounded-xl hover:bg-white/20 transition">Cancel</button>
              <button onClick={saveDrawnSignature} className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-xl font-bold hover:opacity-90 transition">
                ✅ Use Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}