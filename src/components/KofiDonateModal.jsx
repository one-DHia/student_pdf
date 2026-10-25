import React from 'react';
import { X, Coffee, Heart, ShieldCheck } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';

export default function KofiDonateModal({ onClose, lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '480px', padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Coffee size={24} color="#ff5e5b" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {t.kofiModalTitle}
            </h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            {t.kofiModalHeader}
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            {t.kofiModalDesc}
          </p>

          <a
            href="https://ko-fi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              width: '100%',
              padding: '0.9rem',
              fontSize: '1rem',
              background: '#ff5e5b',
              borderColor: '#ff5e5b',
              color: 'white',
              boxShadow: '0 4px 14px rgba(255, 94, 91, 0.4)'
            }}
          >
            <Coffee size={20} /> {t.kofiBtnMain}
          </a>
        </div>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-light)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}
        >
          <Heart size={14} color="#ef4444" /> {t.kofiThanks}
        </div>
      </div>
    </div>
  );
}
