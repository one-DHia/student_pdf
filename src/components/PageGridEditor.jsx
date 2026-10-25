import React, { useState } from 'react';
import { RotateCw, Trash2, ArrowLeft, ArrowRight, Move, GripVertical } from 'lucide-react';

export default function PageGridEditor({ pages, setPages }) {
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleRotate = (index) => {
    setPages(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        rotation: (updated[index].rotation + 90) % 360
      };
      return updated;
    });
  };

  const handleDelete = (index) => {
    setPages(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveLeft = (index) => {
    if (index === 0) return;
    setPages(prev => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveRight = (index) => {
    if (index === pages.length - 1) return;
    setPages(prev => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const rotateAll = () => {
    setPages(prev => prev.map(p => ({ ...p, rotation: (p.rotation + 90) % 360 })));
  };

  // HTML5 Drag & Drop page reorder logic
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setPages(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });

    setDraggedIndex(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Move size={16} color="var(--accent-primary)" /> Pages sélectionnées ({pages.length} pages)
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Glissez-déposez (Drag & Drop) les vignettes pour changer l'ordre des pages.
          </p>
        </div>
        <button className="btn-secondary" onClick={rotateAll} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
          <RotateCw size={14} /> Pivoter tout (90°)
        </button>
      </div>

      <div className="page-grid">
        {pages.map((item, idx) => (
          <div
            key={`${item.pageIndex}-${idx}`}
            className={`page-card ${draggedIndex === idx ? 'selected' : ''}`}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            style={{
              opacity: draggedIndex === idx ? 0.4 : 1,
              cursor: 'grab'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '6px',
                left: '6px',
                zIndex: 10,
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '4px',
                padding: '2px 4px',
                color: 'white',
                fontSize: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <GripVertical size={10} /> #{idx + 1}
            </div>

            <div className="page-thumbnail-box">
              <img
                src={item.dataUrl}
                alt={`Page ${item.pageNumber}`}
                style={{
                  transform: `rotate(${item.rotation}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              />
            </div>
            
            <div className="page-actions-bar">
              <span>Page {item.pageNumber}</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => handleMoveLeft(idx)}
                  disabled={idx === 0}
                  title="Déplacer à gauche"
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => handleMoveRight(idx)}
                  disabled={idx === pages.length - 1}
                  title="Déplacer à droite"
                >
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => handleRotate(idx)}
                  title="Pivoter 90°"
                >
                  <RotateCw size={14} />
                </button>
                <button
                  type="button"
                  className="icon-action-btn delete"
                  onClick={() => handleDelete(idx)}
                  title="Supprimer la page"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
