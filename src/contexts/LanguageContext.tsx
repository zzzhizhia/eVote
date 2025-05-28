
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import enMessages from '@/locales/en.json';
import zhCNMessages from '@/locales/zh-CN.json';

export type Locale = 'en' | 'zh-CN';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: Record<string, string>;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translationsData: Record<Locale, Record<string, string>> = {
  en: enMessages,
  'zh-CN': zhCNMessages,
};

const LOCALE_STORAGE_KEY = 'eVote_locale';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en'); // Default to English

  useEffect(() => {
    // Get stored locale from localStorage on initial client-side load
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (storedLocale && (storedLocale === 'en' || storedLocale === 'zh-CN')) {
      setLocaleState(storedLocale);
      document.documentElement.lang = storedLocale;
    } else {
      // If no stored locale, or invalid, use browser preference or default to 'en'
      const browserLang = navigator.language.startsWith('zh') ? 'zh-CN' : 'en';
      setLocaleState(browserLang);
      document.documentElement.lang = browserLang;
      localStorage.setItem(LOCALE_STORAGE_KEY, browserLang);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  };

  const currentTranslations = useMemo(() => {
    return translationsData[locale] || translationsData.en;
  }, [locale]);

  const t = (key: string, replacements?: Record<string, string>): string => {
    let translation = currentTranslations[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach((placeholder) => {
        translation = translation.replace(new RegExp(`{{${placeholder}}}`, 'g'), replacements[placeholder]);
      });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, translations: currentTranslations, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
