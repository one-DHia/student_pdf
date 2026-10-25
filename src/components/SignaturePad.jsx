import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Type, Edit3, Image as ImageIcon } from 'lucide-react';

export default function SignaturePad({ onSaveSignature }) {
  const [tab, setTab] = useState('draw'); // 'draw' | 'type' | 'upload'
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [strokeColor, setStrokeColor] = useState('#0f172a');

  useEffect(() => {
    if (tab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeColor;
    }
  }, [tab, strokeColor]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleApplyDrawnSignature = () => {
    if (tab === 'draw' && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSaveSignature(dataUrl);
    } else if (tab === 'type') {
      if (!typedName.trim()) return;
      // Render typed text on canvas
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      ctx.font = 'italic bold 42px "Brush Script MT", cursive, sans-serif';
      ctx.fillStyle = strokeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 200, 75);
      onSaveSignature(canvas.toDataURL('image/png'));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onSaveSignature(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
      {/* Signature Method Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={`btn-secondary ${tab === 'draw' ? 'active' : ''}`}
          onClick={() => setTab('draw')}
          style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}
        >
          <Edit3 size={16} /> Dessiner
        </button>
        <button
          className={`btn-secondary ${tab === 'type' ? 'active' : ''}`}
          onClick={() => setTab('type')}
          style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}
        >
          <Type size={16} /> Taper le Nom
        </button>
        <button
          className={`btn-secondary ${tab === 'upload' ? 'active' : ''}`}
          onClick={() => setTab('upload')}
          style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}
        >
          <ImageIcon size={16} /> Importer Image
        </button>
      </div>

      {tab === 'draw' && (
        <div>
          <div className="signature-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={500}
              height={180}
              className="signature-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Couleur :</span>
              {['#0f172a', '#1e40af', '#15803d', '#b91c1c'].map((c) => (
                <div
                  key={c}
                  onClick={() => setStrokeColor(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    cursor: 'pointer',
                    border: strokeColor === c ? '2px solid white' : 'none'
                  }}
                />
              ))}
            </div>
            <button className="btn-secondary" onClick={clearCanvas} style={{ fontSize: '0.8rem' }}>
              <Eraser size={14} /> Effacer
            </button>
          </div>
        </div>
      )}

      {tab === 'type' && (
        <div style={{ margin: '1.5rem 0' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', fontSize: '1.25rem', textAlign: 'center' }}
            placeholder="Entrez votre nom complet..."
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
          />
          {typedName && (
            <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'white', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ font: 'italic bold 36px "Brush Script MT", cursive, sans-serif', color: strokeColor }}>
                {typedName}
              </span>
            </div>
          )}
        </div>
      )}

      {tab === 'upload' && (
        <div style={{ margin: '1.5rem 0', textIndent: 'center' }}>
          <input type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} className="form-input" style={{ width: '100%' }} />
        </div>
      )}

      {tab !== 'upload' && (
        <button className="btn-primary" onClick={handleApplyDrawnSignature} style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
          <Check size={18} /> Valider la signature
        </button>
      )}
    </div>
  );
}
