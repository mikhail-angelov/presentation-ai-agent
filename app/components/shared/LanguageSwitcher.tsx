"use client";

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, Language, supportedLanguages } from '@/app/hooks/useTranslation';

export default function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, isLoading } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    changeLanguage(lang);
    setIsOpen(false);
  };

  const currentLangInfo = supportedLanguages.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Change language"
        disabled={isLoading}
      >
        <Globe className="h-4 w-4" />
        <span className="font-medium">{currentLangInfo?.nativeName || currentLangInfo?.name}</span>
        {isLoading && (
          <span className="ml-2 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="py-1">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={isLoading}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentLanguage === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-sm text-gray-500">{lang.name}</span>
                  </div>
                  {currentLanguage === lang.code && (
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
