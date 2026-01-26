"use client";

import { Edit, ArrowLeft, ArrowRight, Download, Copy, RefreshCw } from "lucide-react";
import { useTranslation } from "@/app/hooks/useTranslation";

interface OutlineStepProps {
  outline: string;
  setup: {
    topic: string;
    audience: string;
    duration: string;
    keyPoints: string[];
  };
  onBack: () => void;
  onGenerateSpeech: () => void;
  onRegenerateOutline: () => void;
  onUpdateOutline: (content: string) => void;
  onCopyContent: (content: string) => void;
  onDownloadContent: (content: string, filename: string) => void;
}

export default function OutlineStep({
  outline,
  setup,
  onBack,
  onGenerateSpeech,
  onRegenerateOutline,
  onUpdateOutline,
  onCopyContent,
  onDownloadContent,
}: OutlineStepProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Edit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t("outlineStep.title")}</h2>
            <p className="text-gray-600">{t("outlineStep.subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("outlineStep.backButton")}
          </button>
          <button
            onClick={onGenerateSpeech}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            {t("outlineStep.generateSpeechButton")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">{t("outlineStep.contentTitle")}</h3>
          <div className="flex gap-2">
            <button
              onClick={onRegenerateOutline}
              className="px-3 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              {t("outlineStep.regenerateButton")}
            </button>
            <button
              onClick={() => onCopyContent(outline)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              {t("app.copy")}
            </button>
            <button
              onClick={() => onDownloadContent(outline, `presentation-outline-${setup.topic.toLowerCase().replace(/\s+/g, '-')}.md`)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              {t("app.download")}
            </button>
          </div>
        </div>
        
        <textarea
          value={outline}
          onChange={(e) => onUpdateOutline(e.target.value)}
          className="w-full flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono text-sm resize-none"
          placeholder={t("outlineStep.placeholder")}
        />
      </div>
    </div>
  );
}
