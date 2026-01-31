"use client";

import { Presentation, Zap, Menu, Save, FolderOpen, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "@/app/hooks/useTranslation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useToast } from "@/app/contexts/ToastContext";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  onFeedback: () => void;
  onSave: () => void;
  onLoad: (data: any) => void;
  onClear: () => void;
  sessionId?: string | null;
}

export default function Header({ onFeedback, onSave, onLoad, onClear, sessionId }: HeaderProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
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

  const handleClearClick = () => {
    setMenuOpen(false);
    // Show confirmation dialog before clearing
    if (window.confirm(t("alerts.confirmClearPresentation") || "Are you sure you want to clear the presentation? This will reset all steps and clear saved data.")) {
      onClear();
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

  const handleFeedbackSubmit = async (feedback: {
    type: "feedback" | "recommendation" | "issue";
    message: string;
    email?: string;
  }) => {
    try {
      // Include session ID if available
      const feedbackWithSession = {
        ...feedback,
        session_id: sessionId || null,
      };

      // Send feedback to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackWithSession),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success toast
        addToast(
          t("feedback.submit") + " " + t("feedback.thankYou"),
          'success',
          5000
        );
      } else {
        // Show error toast
        addToast(
          t("feedback.submitFailed") + ": " + (result.error || 'Unknown error'),
          'error',
          5000
        );
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Show error toast
      addToast(
        t("feedback.submitFailed") + ": " + (error instanceof Error ? error.message : 'Network error'),
        'error',
        5000
      );
    }
  };

  return (
    <>
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
            {/* Sparkling Feedback Button */}
            <button
              onClick={onFeedback}
              className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl active:scale-95 group overflow-hidden"
              aria-label="Share feedback"
            >
              {/* Sparkling animation dots */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full animate-sparkle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1 + Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>
              <Sparkles className="h-4 w-4 relative z-10 group-hover:rotate-12 transition-transform" />
              <span className="relative z-10 hidden sm:inline">
                {t("feedback.button")}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

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
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleClearClick}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="font-medium">{t('menu.clearPresentation') || "Clear Presentation"}</span>
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

      <style jsx global>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-sparkle {
          animation: sparkle 2s infinite;
        }
      `}</style>
    </>
  );
}
