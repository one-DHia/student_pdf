import React from 'react';
import { Home, Flame, Camera, Coffee } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';

export default function MobileBottomNav({ onSelectHome, onSelectPopular, onOpenScanner, onOpenKofi, lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  return (
    <nav className="mobile-bottom-nav">
      <button className="mobile-nav-item" onClick={onSelectHome}>
        <Home size={20} />
        <span>{t.navHome}</span>
      </button>

      <button className="mobile-nav-item" onClick={onSelectPopular}>
        <Flame size={20} color="#f59e0b" />
        <span>{t.navPopular}</span>
      </button>

      {/* Floating Center Camera Scanner Trigger */}
      <button className="mobile-nav-item mobile-scanner-btn" onClick={onOpenScanner}>
        <div className="mobile-scanner-circle">
          <Camera size={22} color="white" />
        </div>
        <span>{t.navScanner}</span>
      </button>

      <button className="mobile-nav-item" onClick={onOpenKofi}>
        <Coffee size={20} color="#ff5e5b" />
        <span>{t.supportBtn}</span>
      </button>
    </nav>
  );
}
