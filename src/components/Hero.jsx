import React from 'react';
import { Search, ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';

export default function Hero({ searchQuery, setSearchQuery, lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  return (
    <section className="hero-section">
      <h1 className="hero-title">
        {t.heroTitle} <br />
        <span className="hero-title-highlight">{t.heroTitleHighlight}</span>
      </h1>
      <p className="hero-desc">{t.heroDesc}</p>

      {/* Interactive Live Search Bar */}
      <div className="search-bar-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <kbd className="search-shortcut-badge">
          {navigator.platform?.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </div>

      {/* Trust & Privacy Badges */}
      <div className="features-bar">
        <div className="feature-badge">
          <ShieldCheck size={18} /> {t.privacyBadge}
        </div>
        <div className="feature-badge">
          <Zap size={18} /> {t.fastBadge}
        </div>
        <div className="feature-badge">
          <Lock size={18} /> {t.localBadge}
        </div>
        <div className="feature-badge">
          <Sparkles size={18} /> {t.noSignupBadge}
        </div>
      </div>
    </section>
  );
}
