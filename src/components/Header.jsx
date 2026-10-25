import React, { useState, useEffect } from 'react';
import { FileText, Sun, Moon, Coffee, ShieldCheck, Smartphone } from 'lucide-react';

export default function Header({ theme, toggleTheme, onOpenKofi, lang, setLang }) {
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsPwa(true);
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'fr' ? 'en' : 'fr';
    setLang(nextLang);
    document.documentElement.lang = nextLang;
  };

  const scrollToTools = (e) => {
    e.preventDefault();
    const section = document.querySelector('.tools-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="site-header">
      <div className="header-content">
        {/* Brand Logo & Title */}
        <a href="#" className="brand-logo">
          <div className="logo-badge">
            <FileText size={22} />
          </div>
          <span className="brand-title" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            StudentPDF
          </span>
          {isPwa && (
            <span className="brand-subtitle" style={{ borderColor: 'rgba(34, 197, 94, 0.4)', color: '#22c55e', background: 'rgba(34, 197, 94, 0.08)' }}>
              <Smartphone size={10} style={{ marginRight: '2px' }} /> App
            </span>
          )}
        </a>

        {/* Center Quick Navigation Links */}
        <nav className="header-nav-center" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <a
            href="#tools"
            onClick={scrollToTools}
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s ease'
            }}
            className="nav-link"
          >
            {lang === 'en' ? 'PDF Tools' : 'Outils PDF'}
          </a>
          <a
            href="#privacy"
            onClick={(e) => {
              e.preventDefault();
              alert(lang === 'en'
                ? "🔒 100% Privacy: Your PDF files are processed locally inside your WebAssembly browser. No files are uploaded to any server."
                : "🔒 Confidentialité Totale : Vos fichiers PDF sont traités à 100% dans votre navigateur WebAssembly. Aucun fichier n'est téléversé sur un serveur."
              );
            }}
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'color 0.15s ease'
            }}
            className="nav-link"
          >
            <ShieldCheck size={15} color="#10b981" /> {lang === 'en' ? 'Privacy' : 'Confidentialité'}
          </a>
        </nav>

        {/* Right Tools: Language Toggle (FR / EN), Dark/Light Mode & Ko-fi Support Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
          {/* Clean 1-click FR / EN Toggle Button */}
          <button
            onClick={toggleLanguage}
            title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.7rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            {lang === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
          </button>

          <button className="btn-kofi" onClick={onOpenKofi} title="Soutenir le projet sur Ko-fi">
            <Coffee size={16} />
            <span className="btn-kofi-text">{lang === 'en' ? 'Support' : 'Soutenir'}</span>
          </button>

          <button
            className="close-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre'}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
          </button>
        </div>
      </div>
    </header>
  );
}
