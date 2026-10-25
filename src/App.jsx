import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolGrid, { TOOLS_CONFIG } from './components/ToolGrid';
import ToolModal from './components/ToolModal';
import KofiDonateModal from './components/KofiDonateModal';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import MobileBottomNav from './components/MobileBottomNav';
import { Coffee } from 'lucide-react';
import { TRANSLATIONS } from './utils/translations';

export default function App() {
  const [currentCategory, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTool, setActiveTool] = useState(null);
  const [isKofiOpen, setIsKofiOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('studentpdf_theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('studentpdf_lang') || 'fr');

  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('studentpdf_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('studentpdf_lang', lang);
    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [lang]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Keyboard shortcut CMD+K / CTRL+K listener for instant search focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenScanner = () => {
    const scannerTool = TOOLS_CONFIG.find(t => t.id === 'camera-scanner');
    if (scannerTool) {
      setActiveTool(scannerTool);
    }
  };

  return (
    <div className="app-layout">
      {/* PWA Native Install Banner & Offline Status Indicator */}
      <PwaInstallPrompt lang={lang} />

      {/* Clean Navigation Header with Language Selector */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenKofi={() => setIsKofiOpen(true)}
        lang={lang}
        setLang={setLang}
      />

      {/* Hero Section */}
      <Hero searchQuery={searchQuery} setSearchQuery={setSearchQuery} lang={lang} />

      {/* Main PDF Tool Cards Grid with Wrapped Category Filter Bar */}
      <ToolGrid
        currentCategory={currentCategory}
        setCategory={setCategory}
        searchQuery={searchQuery}
        onSelectTool={(tool) => setActiveTool(tool)}
        lang={lang}
      />

      {/* Tool Execution Interactive Modal / Mobile Bottom Drawer */}
      {activeTool && (
        <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} lang={lang} />
      )}

      {/* Ko-fi Donation Modal */}
      {isKofiOpen && (
        <KofiDonateModal onClose={() => setIsKofiOpen(false)} lang={lang} />
      )}

      {/* Native Mobile Bottom Navigation Bar (Dock) */}
      <MobileBottomNav
        onSelectHome={() => {
          setCategory('all');
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectPopular={() => {
          setCategory('all');
          setSearchQuery('Populaire');
        }}
        onOpenScanner={handleOpenScanner}
        onOpenKofi={() => setIsKofiOpen(true)}
        lang={lang}
      />

      {/* Minimalist Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} <strong>StudentPDF</strong> — {t.footerTagline}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              {t.footerLocal}
            </span>
            <button className="btn-kofi" onClick={() => setIsKofiOpen(true)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
              <Coffee size={14} /> {t.kofiText}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
