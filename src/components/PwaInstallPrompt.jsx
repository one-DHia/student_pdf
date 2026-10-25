import React, { useState, useEffect } from 'react';
import { Download, WifiOff, X, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translations';

export default function PwaInstallPrompt({ lang = 'fr' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  if (isOffline) {
    return (
      <div className="pwa-top-bar offline">
        <div className="pwa-text-box">
          <WifiOff size={15} style={{ flexShrink: 0 }} />
          <span className="pwa-text">
            <strong>{t.offlineModeTitle}</strong> — {t.offlineModeSub}
          </span>
        </div>
        <button className="pwa-close-btn" onClick={() => setIsVisible(false)} title={t.closeBtn}>
          <X size={14} />
        </button>
      </div>
    );
  }

  if (deferredPrompt && !isInstalled) {
    return (
      <div className="pwa-top-bar install">
        <div className="pwa-text-box">
          <Sparkles size={15} style={{ flexShrink: 0 }} />
          <span className="pwa-text">
            <strong>{t.pwaInstallTitle}</strong> — {t.pwaInstallSub}
          </span>
        </div>
        <div className="pwa-actions-box">
          <button className="btn-install" onClick={handleInstallClick}>
            <Download size={13} /> {t.installBtn}
          </button>
          <button className="pwa-close-btn" onClick={() => setIsVisible(false)} title={t.closeBtn}>
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
