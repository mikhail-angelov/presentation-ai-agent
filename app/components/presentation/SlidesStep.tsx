"use client";

import { Download as DownloadIcon, Check, ArrowLeft, Copy, RefreshCw } from "lucide-react";
import { useTranslation } from "@/app/hooks/useTranslation";

interface SlidesStepProps {
  slides: string;
  setup: {
    topic: string;
    audience: string;
    duration: string;
    keyPoints: string[];
  };
  onBack: () => void;
  onCompletePresentation: () => void;
  onRegenerateSlides: () => void;
  onUpdateSlides: (content: string) => void;
  onCopyContent: (content: string) => void;
  onDownloadContent: (content: string, filename: string) => void;
}

export default function SlidesStep({
  slides,
  setup,
  onBack,
  onCompletePresentation,
  onRegenerateSlides,
  onUpdateSlides,
  onCopyContent,
  onDownloadContent,
}: SlidesStepProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <DownloadIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t("slidesStep.title")}</h2>
            <p className="text-gray-600">{t("slidesStep.subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("slidesStep.backButton")}
          </button>
          <button
            onClick={onCompletePresentation}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            {t("slidesStep.generateHtmlSlidesButton")}
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">{t("slidesStep.contentTitle")}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onCopyContent(slides)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              {t("app.copy")}
            </button>
            <button
              onClick={() => onDownloadContent(slides, `presentation-slides-${setup.topic.toLowerCase().replace(/\s+/g, '-')}.md`)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <DownloadIcon className="h-3 w-3" />
              {t("app.download")}
            </button>
          </div>
        </div>
        
        <textarea
          value={slides}
          onChange={(e) => onUpdateSlides(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono text-sm"
          placeholder={t("slidesStep.placeholder")}
        />
        
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={onRegenerateSlides}
            className="px-4 py-2 border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg font-medium flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t("slidesStep.regenerateButton")}
          </button>
          <div className="text-sm text-gray-500">
            {t("slidesStep.generatedOn")} {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
