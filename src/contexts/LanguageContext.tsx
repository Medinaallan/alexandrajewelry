import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Language, LanguageContextType } from '../types';
import { en } from '../i18n/en';
import { es } from '../i18n/es';

const translations: Record<Language, Record<string, string>> = { en, es };

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('alexandra-lang') as Language | null;
    return saved === 'es' ? 'es' : 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('alexandra-lang', lang);
  }, []);

  const t = useCallback(
    (key: string): string => translations[language][key] ?? key,
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
