import { useRef, useState } from 'react';

interface Props {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

export default function SignatureCanvasModal({ onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3b82f6'; // Bright blue
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    console.log('Signature data URL length:', dataUrl.length);
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black text-white">✍️ Draw Your Signature</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl transition">✕</button>
        </div>

        <p className="text-slate-400 text-sm mb-4">Use your mouse to draw your signature below</p>

        <div className="bg-black rounded-xl border-2 border-dashed border-white/20 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full cursor-crosshair block"
            style={{
              display: 'block',
              width: '100%',
              height: '200px',
              touchAction: 'none'
            }}
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleClear}
            className="flex-1 bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition font-semibold">
            🗑️ Clear
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
            ✅ Use This Signature
          </button>
        </div>
      </div>
    </div>
  );
}