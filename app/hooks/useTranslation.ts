"use client";

import { useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'ru';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
}

export const supportedLanguages: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];

export interface TranslationData {
  [key: string]: string | TranslationData;
}

export interface UseTranslationReturn {
  t: (key: string, variables?: Record<string, string | number>) => string;
  currentLanguage: Language;
  supportedLanguages: LanguageInfo[];
  changeLanguage: (lang: Language) => void;
  isLoading: boolean;
}

// Cache for loaded translations
const translationCache: Record<Language, TranslationData> = {
  en: {},
  ru: {},
};

export function useTranslation(): UseTranslationReturn {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations for a specific language
  const loadTranslations = useCallback(async (lang: Language): Promise<TranslationData> => {
    // Check cache first
    if (Object.keys(translationCache[lang]).length > 0) {
      return translationCache[lang];
    }

    try {
      const response = await fetch(`/locales/${lang}/common.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${lang}`);
      }
      
      const data = await response.json();
      translationCache[lang] = data;
      return data;
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);
      
      // Fallback to English if Russian fails
      if (lang === 'ru') {
        return loadTranslations('en');
      }
      
      // Return empty object as last resort
      return {};
    }
  }, []);

  // Initialize language from localStorage or browser
  useEffect(() => {
    const initializeLanguage = async () => {
      setIsLoading(true);
      
      // Try to get language from localStorage
      const savedLang = localStorage.getItem('prez-ai-language') as Language;
      
      // Or detect from browser
      const browserLang = navigator.language.split('-')[0] as Language;
      
      // Determine language to use
      let lang: Language = 'en';
      if (savedLang && supportedLanguages.some(l => l.code === savedLang)) {
        lang = savedLang;
      } else if (browserLang === 'ru') {
        lang = 'ru';
      }
      
      // Load translations
      const loadedTranslations = await loadTranslations(lang);
      setTranslations(loadedTranslations);
      setCurrentLanguage(lang);
      setIsLoading(false);
    };

    initializeLanguage();
  }, [loadTranslations]);

  // Change language
  const changeLanguage = useCallback(async (lang: Language) => {
    if (lang === currentLanguage) return;
    
    setIsLoading(true);
    
    // Load new translations
    const loadedTranslations = await loadTranslations(lang);
    setTranslations(loadedTranslations);
    setCurrentLanguage(lang);
    
    // Save to localStorage
    localStorage.setItem('prez-ai-language', lang);
    
    setIsLoading(false);
  }, [currentLanguage, loadTranslations]);

  // Translation function
  const t = useCallback((key: string, variables?: Record<string, string | number>): string => {
    // Split key by dots to navigate nested objects
    const keys = key.split('.');
    let value: any = translations;
    
    // Navigate through the translation object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found, return the key itself
        return key;
      }
    }
    
    // If we found a string, process variables
    if (typeof value === 'string') {
      let result = value;
      
      // Replace variables if provided
      if (variables) {
        Object.entries(variables).forEach(([varKey, varValue]) => {
          const regex = new RegExp(`\\{${varKey}\\}`, 'g');
          result = result.replace(regex, String(varValue));
        });
      }
      
      return result;
    }
    
    // If value is not a string, return the key
    return key;
  }, [translations]);

  return {
    t,
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    isLoading,
  };
}

// Helper function to get nested value from object
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}
