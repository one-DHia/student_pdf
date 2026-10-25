import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Trash2, Check, FileText } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { TRANSLATIONS } from '../utils/translations';

export default function CameraScanner({ onPdfGenerated, lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedPages, setCapturedPages] = useState([]);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [filterMode, setFilterMode] = useState('bw'); // 'bw', 'grayscale', 'color'
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Initialize camera stream
  const startCamera = async (mode = facingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setErrorMsg(null);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg(t.cameraAccessError);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture snapshot from live video stream
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply document contrast / b&w filter if enabled
    if (filterMode === 'bw' || filterMode === 'grayscale') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (filterMode === 'bw') {
          // B&W high contrast threshold
          const val = avg > 120 ? 255 : 0;
          d[i] = d[i + 1] = d[i + 2] = val;
        } else {
          // Grayscale
          d[i] = d[i + 1] = d[i + 2] = avg;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPages((prev) => [...prev, { id: Date.now(), dataUrl, width: canvas.width, height: canvas.height }]);
  };

  const removePage = (id) => {
    setCapturedPages((prev) => prev.filter((p) => p.id !== id));
  };

  // Generate multi-page PDF from scanned camera images
  const generatePdfFromScans = async () => {
    if (capturedPages.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const pageItem of capturedPages) {
        const response = await fetch(pageItem.dataUrl);
        const imgBuffer = await response.arrayBuffer();
        const embeddedImg = await pdfDoc.embedJpg(imgBuffer);

        const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: embeddedImg.width,
          height: embeddedImg.height
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      // Stop camera tracks before completing
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      onPdfGenerated(blob, `Document_Scanne_${capturedPages.length}_pages.pdf`);
    } catch (err) {
      console.error('Error generating PDF from camera scans:', err);
      alert(t.cameraPdfError);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Live Video Camera Viewfinder */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: '420px',
          background: '#000',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {errorMsg ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
            <p style={{ fontWeight: 600 }}>{errorMsg}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', maxHeight: '420px', objectFit: 'contain' }}
          />
        )}

        {/* Viewfinder Corner Overlays */}
        <div
          style={{
            position: 'absolute',
            inset: '1.5rem',
            border: '2px dashed rgba(255, 255, 255, 0.4)',
            borderRadius: 'var(--radius-md)',
            pointerEvents: 'none'
          }}
        />

        {/* Camera Controls Bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)'
          }}
        >
          {/* Switch Camera Button */}
          <button
            className="icon-action-btn"
            onClick={toggleCameraFacing}
            title={t.switchCamera}
            style={{ color: 'white', padding: '8px' }}
          >
            <RefreshCw size={20} />
          </button>

          {/* Capture Trigger Button */}
          <button
            onClick={captureSnapshot}
            disabled={!!errorMsg}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'white',
              border: '4px solid rgba(255, 255, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              transition: 'transform 0.1s ease'
            }}
            title={t.takePhoto}
          >
            <Camera size={26} color="#000" />
          </button>

          {/* Filter Toggle Selector */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="bw" style={{ color: '#000' }}>{t.filterBw}</option>
            <option value="grayscale" style={{ color: '#000' }}>{t.filterGrayscale}</option>
            <option value="color" style={{ color: '#000' }}>{t.filterColor}</option>
          </select>
        </div>
      </div>

      {/* Captured Pages Queue Bar */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={18} color="var(--accent-primary)" />
            {t.scannedPages} ({capturedPages.length})
          </h4>
          {capturedPages.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => setCapturedPages([])}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              {t.removeAll}
            </button>
          )}
        </div>

        {capturedPages.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
            {t.cameraInstructions}
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {capturedPages.map((page, idx) => (
              <div
                key={page.id}
                style={{
                  position: 'relative',
                  width: '90px',
                  height: '120px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: '#000'
                }}
              >
                <img src={page.dataUrl} alt={`Page ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    fontSize: '0.65rem',
                    padding: '2px 5px',
                    borderRadius: '3px',
                    fontWeight: 700
                  }}
                >
                  #{idx + 1}
                </span>
                <button
                  onClick={() => removePage(page.id)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={t.deletePage}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Convert Scanned Pages to PDF Action Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          className="btn-primary"
          onClick={generatePdfFromScans}
          disabled={capturedPages.length === 0 || isProcessing}
          style={{ padding: '0.75rem 1.5rem', width: '100%', justifyContent: 'center' }}
        >
          {isProcessing ? (
            <div className="loading-spinner" />
          ) : (
            <>
              <Check size={18} /> {t.generatePdf} ({capturedPages.length} {capturedPages.length > 1 ? 'pages' : 'page'})
            </>
          )}
        </button>
      </div>
    </div>
  );
}
