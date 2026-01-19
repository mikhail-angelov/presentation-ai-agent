"use client";

import { useState, useEffect, useCallback } from "react";

export type Language = "en" | "ru";

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
}

export const supportedLanguages: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
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

// Global initialization state (not nice, but avoids multiple initializations)
let globalInitialized = false;
let globalInitializationPromise: Promise<void> | null = null;

export function useTranslation(): UseTranslationReturn {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en");
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load translations for a specific language
  const loadTranslations = useCallback(
    async (lang: Language): Promise<TranslationData> => {
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
        if (lang === "ru") {
          return loadTranslations("en");
        }

        // Return empty object as last resort
        return {};
      }
    },
    []
  );

  // Initialize language from localStorage or browser
  useEffect(() => {
    const initializeLanguage = async () => {
      // If already initialized globally, just set the state
      if (globalInitialized) {
        const savedLang = localStorage.getItem("prez-ai-language") as Language;
        const browserLang = navigator.language.split("-")[0] as Language;

        let lang: Language = "en";
        if (savedLang && supportedLanguages.some((l) => l.code === savedLang)) {
          lang = savedLang;
        } else if (browserLang === "ru") {
          lang = "ru";
        }

        // Use cached translations
        if (Object.keys(translationCache[lang]).length > 0) {
          setTranslations(translationCache[lang]);
          setCurrentLanguage(lang);
        } else {
          // If cache is empty but global is initialized, we need to load
          // This can happen if component mounts before cache is populated
          const loadedTranslations = await loadTranslations(lang);
          setTranslations(loadedTranslations);
          setCurrentLanguage(lang);
        }
        return;
      }

      // If initialization is in progress, wait for it
      if (globalInitializationPromise) {
        await globalInitializationPromise;
        // After waiting, set the state from cache
        const savedLang = localStorage.getItem("prez-ai-language") as Language;
        const browserLang = navigator.language.split("-")[0] as Language;

        let lang: Language = "en";
        if (savedLang && supportedLanguages.some((l) => l.code === savedLang)) {
          lang = savedLang;
        } else if (browserLang === "ru") {
          lang = "ru";
        }

        if (Object.keys(translationCache[lang]).length > 0) {
          setTranslations(translationCache[lang]);
          setCurrentLanguage(lang);
        }
        return;
      }

      // Start global initialization
      globalInitializationPromise = (async () => {
        try {
          setIsLoading(true);
          // Try to get language from localStorage
          const savedLang = localStorage.getItem(
            "prez-ai-language"
          ) as Language;

          // Or detect from browser
          const browserLang = navigator.language.split("-")[0] as Language;

          // Determine language to use
          let lang: Language = "en";
          if (
            savedLang &&
            supportedLanguages.some((l) => l.code === savedLang)
          ) {
            lang = savedLang;
          } else if (browserLang === "ru") {
            lang = "ru";
          }

          // Load translations
          const loadedTranslations = await loadTranslations(lang);
          console.log(
            `Loaded translations for ${lang}:`,
            Object.keys(loadedTranslations).length > 0 ? "Success" : "Failed"
          );

          // Update global state
          globalInitialized = true;

          // Update local state for this component
          setTranslations(loadedTranslations);
          setCurrentLanguage(lang);
        } catch (error) {
          console.error("Failed to initialize translations:", error);
        } finally {
          setIsLoading(false);
          globalInitializationPromise = null;
        }
      })();

      await globalInitializationPromise;
    };

    initializeLanguage();
  }, [loadTranslations]);

  // Change language
  const changeLanguage = useCallback(
    async (lang: Language) => {
      if (lang === currentLanguage) return;
      localStorage.setItem('prez-ai-language', lang);
      //reload page
      window.location.href = "/";
    },
    [currentLanguage, loadTranslations]
  );

  // Translation function
  const t = useCallback(
    (key: string, variables?: Record<string, string | number>): string => {
      // If translations are not loaded yet, return a loading placeholder
      if (Object.keys(translations).length === 0) {
        // Return a placeholder that shows we're loading
        // For common keys, we can return sensible defaults

        return key;
      }

      // Split key by dots to navigate nested objects
      const keys = key.split(".");
      let value: any = translations;

      // Navigate through the translation object
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          // Key not found, return the key itself
          return key;
        }
      }

      // If we found a string, process variables
      if (typeof value === "string") {
        let result = value;

        // Replace variables if provided
        if (variables) {
          Object.entries(variables).forEach(([varKey, varValue]) => {
            const regex = new RegExp(`\\{${varKey}\\}`, "g");
            result = result.replace(regex, String(varValue));
          });
        }

        return result;
      }

      // If value is not a string, return the key
      return key;
    },
    [translations]
  );

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
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}
