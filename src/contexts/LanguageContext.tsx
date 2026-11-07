import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Language, LanguageContextType } from '../types';
import { es } from '../i18n/es';
import { translateSite } from '../lib/googleTranslate';

const LanguageContext = createContext<LanguageContextType | null>(null);

// Pages are always rendered in Spanish; Google Translate translates them in the
// visitor's browser into `targetLanguage`. The admin panel is never translated.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const [targetLanguage, setTargetLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('alexandra-lang') as Language | null;
    return saved === 'es' ? 'es' : 'en';
  });

  // Keep Google away from the admin panel (also covers its pop-up modals)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('notranslate', isAdmin);
    html.setAttribute('translate', isAdmin ? 'no' : 'yes');
  }, [isAdmin]);

  // On load, the widget translates the page by itself from its cookie
  useEffect(() => {
    if (!isAdmin) void translateSite(targetLanguage, true);
    // only when entering / leaving the admin; language changes go through setLanguage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const setLanguage = useCallback((lang: Language) => {
    setTargetLanguage(lang);
    localStorage.setItem('alexandra-lang', lang);
    void translateSite(lang);
  }, []);

  const t = useCallback((key: string): string => es[key] ?? key, []);

  return (
    <LanguageContext.Provider value={{ language: 'es', targetLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
