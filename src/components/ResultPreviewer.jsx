import React, { useState, useEffect } from 'react';
import { Eye, Download, Check, Copy, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, Layers } from 'lucide-react';
import saveAs from 'file-saver';
import { formatBytes } from '../utils/pdfHelper';
import { TRANSLATIONS } from '../utils/translations';
import * as pdfjsLib from 'pdfjs-dist';

export default function ResultPreviewer({ resultBlob, resultFileName, ocrResultText, onReset, lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;
  const [copied, setCopied] = useState(false);
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'details'

  const isPdf = resultBlob && (resultBlob.type === 'application/pdf' || resultFileName.endsWith('.pdf'));
  const isZip = resultBlob && resultFileName.endsWith('.zip');

  useEffect(() => {
    let objectUrl = null;
    if (isPdf && resultBlob) {
      setIsLoadingPreview(true);
      objectUrl = URL.createObjectURL(resultBlob);

      const loadPdfPages = async () => {
        try {
          const arrayBuffer = await resultBlob.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          const pageImages = [];
          for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.2 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            pageImages.push(canvas.toDataURL('image/png'));
          }

          setPdfPages(pageImages);
          setCurrentPage(1);
        } catch (err) {
          console.error('Error loading PDF preview:', err);
        } finally {
          setIsLoadingPreview(false);
        }
      };

      loadPdfPages();
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resultBlob, isPdf]);

  const handleCopyText = () => {
    if (ocrResultText) {
      navigator.clipboard.writeText(ocrResultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (resultBlob && resultFileName) {
      saveAs(resultBlob, resultFileName);
    }
  };

  return (
    <div style={{ padding: '1rem 0' }}>
      {/* Top Banner with File Name & Download Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#22c55e',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Check size={24} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {resultFileName}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {formatBytes(resultBlob.size)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" onClick={handleDownload} style={{ padding: '0.75rem 1.5rem' }}>
            <Download size={18} /> {t.downloadBtn}
          </button>
          <button className="btn-secondary" onClick={onReset} style={{ fontSize: '0.85rem' }}>
            {t.resetBtn}
          </button>
        </div>
      </div>

      {/* Tabs View Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        <button
          className={`category-pill ${viewMode === 'preview' ? 'active' : ''}`}
          onClick={() => setViewMode('preview')}
        >
          <Eye size={16} /> Preview
        </button>
        <button
          className={`category-pill ${viewMode === 'details' ? 'active' : ''}`}
          onClick={() => setViewMode('details')}
        >
          <FileText size={16} /> {t.fileDetails}
        </button>
      </div>

      {/* VIEW MODE: PREVIEW */}
      {viewMode === 'preview' && (
        <div>
          {/* PDF Visual Page Viewer */}
          {isPdf && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)', padding: '1rem' }}>
              {/* PDF Toolbar Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'var(--bg-card)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="icon-action-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {t.pageOf.replace('{page}', currentPage).replace('{total}', pdfPages.length || 1)}
                  </span>
                  <button
                    className="icon-action-btn"
                    onClick={() => setCurrentPage(p => Math.min(pdfPages.length, p + 1))}
                    disabled={currentPage === pdfPages.length}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button className="icon-action-btn" onClick={() => setZoomScale(z => Math.max(0.6, z - 0.2))} title={t.zoomOut}>
                    <ZoomOut size={18} />
                  </button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{Math.round(zoomScale * 100)}%</span>
                  <button className="icon-action-btn" onClick={() => setZoomScale(z => Math.min(2.0, z + 0.2))} title={t.zoomIn}>
                    <ZoomIn size={18} />
                  </button>
                </div>
              </div>

              {/* PDF Page Canvas Output */}
              <div style={{ minHeight: '380px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: '1rem', background: '#334155', borderRadius: '8px' }}>
                {isLoadingPreview ? (
                  <div style={{ textAlign: 'center', color: 'white' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 0.75rem auto' }} />
                  </div>
                ) : pdfPages.length > 0 ? (
                  <img
                    src={pdfPages[currentPage - 1]}
                    alt={`Preview Page ${currentPage}`}
                    style={{
                      maxWidth: '100%',
                      transform: `scale(${zoomScale})`,
                      transformOrigin: 'top center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      borderRadius: '4px',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                ) : (
                  <span style={{ color: '#94a3b8' }}>Preview</span>
                )}
              </div>
            </div>
          )}

          {/* Text / OCR Preview */}
          {ocrResultText && (
            <div style={{ marginTop: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="form-label">OCR ({ocrResultText.split(/\s+/).length} words):</span>
                <button className="btn-secondary" onClick={handleCopyText} style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}>
                  {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  {copied ? t.ocrCopied : t.copyOcr}
                </button>
              </div>
              <textarea
                className="form-input"
                rows={10}
                readOnly
                value={ocrResultText}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.5', background: 'rgba(0,0,0,0.3)' }}
              />
            </div>
          )}

          {/* ZIP Batch Preview Notice */}
          {isZip && (
            <div style={{ padding: '2rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <Layers size={48} color="var(--accent-primary)" style={{ margin: '0 auto 1rem auto' }} />
              <h4>ZIP Archive</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                <strong>{resultFileName}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE: DETAILS */}
      {viewMode === 'details' && (
        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'left' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>{t.fileDetails}</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <li><strong>{t.fileName}:</strong> {resultFileName}</li>
            <li><strong>{t.fileSize}:</strong> {formatBytes(resultBlob.size)}</li>
            <li><strong>MIME Type:</strong> {resultBlob.type || 'application/octet-stream'}</li>
            {isPdf && <li><strong>{t.pageCount}:</strong> {pdfPages.length}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
