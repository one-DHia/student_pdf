import React, { useRef, useState } from 'react';
import { UploadCloud, File, Plus, X, Layers, AlertTriangle } from 'lucide-react';
import { formatBytes } from '../utils/pdfHelper';
import { TRANSLATIONS } from '../utils/translations';

export default function FileDropzone({
  onFilesSelected,
  accept = '.pdf',
  multiple = false,
  title = null,
  existingFiles = [],
  onRemoveFile,
  lang = 'fr'
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;
  const [isDragging, setIsDragging] = useState(false);
  const [formatError, setFormatError] = useState(null);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  // Validate files against accept prop
  const filterValidFiles = (filesList) => {
    if (!accept || accept === '*' || accept === 'image/*') {
      return filesList;
    }

    const extensions = accept
      .split(',')
      .map((ext) => ext.trim().toLowerCase());

    const validFiles = filesList.filter((file) => {
      const fileNameLower = file.name.toLowerCase();
      const fileTypeLower = file.type.toLowerCase();

      return extensions.some((ext) => {
        if (ext.startsWith('.')) {
          return fileNameLower.endsWith(ext);
        }
        if (ext.includes('/*')) {
          const mainType = ext.split('/')[0];
          return fileTypeLower.startsWith(mainType);
        }
        return fileTypeLower === ext;
      });
    });

    if (validFiles.length < filesList.length) {
      setFormatError(
        lang === 'en'
          ? `Some files were ignored because only ${accept} formats are accepted.`
          : `Certains fichiers ont été ignorés car seuls les formats ${accept} sont acceptés.`
      );
      setTimeout(() => setFormatError(null), 4000);
    }

    return validFiles;
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const rawFiles = Array.from(e.dataTransfer.files);
      const validFiles = filterValidFiles(rawFiles);

      if (validFiles.length > 0) {
        const updated = multiple ? [...existingFiles, ...validFiles] : [validFiles[0]];
        onFilesSelected(updated);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const rawFiles = Array.from(e.target.files);
      const validFiles = filterValidFiles(rawFiles);

      if (validFiles.length > 0) {
        const updated = multiple ? [...existingFiles, ...validFiles] : [validFiles[0]];
        onFilesSelected(updated);
      }
      e.target.value = ''; // Reset input to allow selecting same file again
    }
  };

  const displayTitle = title || t.dropzoneTitle;
  const acceptBadgeText = accept ? accept.toUpperCase().replace(/\./g, ' .') : '.PDF';

  return (
    <div>
      {/* Format Error Alert */}
      {formatError && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertTriangle size={18} />
          <span>{formatError}</span>
        </div>
      )}

      {/* Main Interactive Drag & Drop Area */}
      <div
        className={`dropzone-container ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className={`dropzone-icon ${isDragging ? 'icon-bounce' : ''}`}>
          <UploadCloud size={38} />
        </div>

        <div style={{ pointerEvents: 'none' }}>
          <h3 className="dropzone-title">
            {displayTitle} {multiple && <span className="batch-pill-badge">({t.batchBadge})</span>}
          </h3>
          <p className="dropzone-sub">
            {multiple ? t.dropzoneSubMultiple : t.dropzoneSubSingle}
          </p>

          <span
            style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-soft)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-active)'
            }}
          >
            {lang === 'en' ? `Accepted formats: ${acceptBadgeText}` : `Formats acceptés : ${acceptBadgeText}`}
          </span>
        </div>

        <button
          className="btn-primary"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          style={{ marginTop: '0.25rem' }}
        >
          <Plus size={18} /> {multiple ? t.dropzoneAddFiles : t.dropzoneSelectSingle}
        </button>
      </div>

      {/* Batch Files Queue Preview */}
      {multiple && existingFiles.length > 0 && (
        <div style={{ marginTop: '1.25rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={16} color="var(--accent-primary)" /> {t.batchTitle} ({existingFiles.length})
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t.totalSize} : {formatBytes(existingFiles.reduce((acc, f) => acc + f.size, 0))}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
            {existingFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <File size={16} color="var(--accent-primary)" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ({formatBytes(file.size)})
                  </span>
                </div>
                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(idx);
                    }}
                    style={{ color: 'var(--text-muted)', padding: '4px' }}
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
