import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import { BACKEND_URL } from '../api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const RENDER_WIDTH = 900;
const PAGE_GAP = 8;

interface Props {
  token: string;
}

export default function SignMultiPage({ token }: Props) {
  const [signer, setSigner] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [numPages, setNumPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchSigner = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/signers/public/${token}`);
        setSigner(res.data.signer);
        setDocument(res.data.document);
        if (res.data.signer.status === 'signed') {
          setDone(true);
        }
      } catch (err) {
        setError('Invalid or expired signing link!');
      } finally {
        setLoading(false);
      }
    };
    fetchSigner();
  }, [token]);

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
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    if (!drawnSignature) {
      alert('Please draw your signature first!');
      return;
    }
    try {
      setSaving(true);
      await axios.post(`${BACKEND_URL}/api/signers/public/${token}/sign`, {
        signatureImage: drawnSignature
      });
      setDone(true);
    } catch (err: any) {
      alert(err.response?.data?.message || '❌ Failed to sign document!');
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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-black text-white mb-2">Invalid Link</h2>
        <p className="text-slate-400">{error}</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-white mb-2">Document Signed!</h2>
        <p className="text-slate-400 mb-2">Thank you <span className="text-orange-400 font-bold">{signer?.name}</span>!</p>
        <p className="text-slate-500 text-sm">Your signature has been recorded for <strong className="text-white">{document?.filename}</strong></p>
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
            <p className="text-slate-400 text-sm">Signing as <span className="text-orange-400 font-semibold">{signer?.name}</span></p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCanvas(true)}
              className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl hover:bg-blue-500/30 transition"
            >
              ✏️ {drawnSignature ? 'Redraw Signature' : 'Draw Signature'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !drawnSignature}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? '⏳ Signing...' : '✅ Sign Document'}
            </button>
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 mb-4 text-sm text-orange-300">
          📄 {document?.filename} — Draw your signature, then click "Sign Document" to complete.
        </div>

        {drawnSignature && (
          <div className="mb-4 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
            <span className="text-slate-300 text-sm">✅ Signature ready:</span>
            <img src={drawnSignature} alt="signature" className="h-8 w-auto bg-white rounded px-2" />
            <button onClick={() => setDrawnSignature(null)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
          </div>
        )}

        <div className="relative bg-white rounded-2xl shadow-2xl overflow-auto" style={{ maxHeight: '700px' }}>
          <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)} className="w-full">
            {Array.from({ length: numPages }, (_, i) => (
              <div key={i + 1} style={{ marginBottom: PAGE_GAP }}>
                <Page pageNumber={i + 1} width={RENDER_WIDTH} />
              </div>
            ))}
          </Document>
        </div>
      </div>

      {showCanvas && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-black mb-4">✏️ Draw Your Signature</h3>
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              className="bg-white rounded-xl w-full cursor-crosshair border-2 border-orange-500/30"
            />
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