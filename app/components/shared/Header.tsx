"use client";

import { Presentation, Zap, User } from "lucide-react";
import { SessionData } from "@/app/hooks/useSession";
import { useTranslation } from "@/app/hooks/useTranslation";
import LanguageSwitcher from "./LanguageSwitcher";

interface HeaderProps {
  session?: SessionData | null;
}

export default function Header({ session }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="mb-8 md:mb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Presentation className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t('app.title')}
            </h1>
            <p className="text-gray-600">{t('app.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {session && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {t('header.session')}: {session.actions.length} {t('header.actions')}
              </span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">AI Assistant Active</span>
          </div>
          <LanguageSwitcher />
          <div className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium">
            Beta
          </div>
        </div>
      </div>
    </header>
  );
}
