"use client";

import { Presentation, Zap, User, Menu, Save, FolderOpen } from "lucide-react";
import { SessionData } from "@/app/hooks/useSession";
import { useTranslation } from "@/app/hooks/useTranslation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  onSave: () => void;
  onLoad: (data: any) => void;
}

export default function Header({ onSave, onLoad }: HeaderProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSaveClick = () => {
    setMenuOpen(false);
    onSave();
  };

  const handleLoadClick = () => {
    setMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        onLoad(data);
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        alert(t("alerts.invalidJsonFile"));
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="mb-8 md:mb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Presentation className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <div className="flex gap-4 items-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {t('app.title')}
              </h1>
              <div className="px-4 h-[24px] bg-blue-600 text-white rounded-full font-medium">
                Beta
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{t('app.subtitle')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          {/* Hamburger menu button and dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={t('menu.menu')}
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={handleSaveClick}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Save className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-800 font-medium">{t('menu.savePresentation')}</span>
                  </button>
                  <button
                    onClick={handleLoadClick}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <FolderOpen className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-800 font-medium">{t('menu.loadPresentation')}</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Hidden file input for load */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
