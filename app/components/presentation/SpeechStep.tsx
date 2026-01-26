"use client";

import { Check, ArrowLeft, ArrowRight, Download, Copy, RefreshCw } from "lucide-react";
import { useTranslation } from "@/app/hooks/useTranslation";

interface SpeechStepProps {
  speech: string;
  setup: {
    topic: string;
    audience: string;
    duration: string;
    keyPoints: string[];
  };
  onBack: () => void;
  onGenerateSlides: () => void;
  onRegenerateSpeech: () => void;
  onUpdateSpeech: (content: string) => void;
  onCopyContent: (content: string) => void;
  onDownloadContent: (content: string, filename: string) => void;
}

export default function SpeechStep({
  speech,
  setup,
  onBack,
  onGenerateSlides,
  onRegenerateSpeech,
  onUpdateSpeech,
  onCopyContent,
  onDownloadContent,
}: SpeechStepProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t("speechStep.title")}</h2>
            <p className="text-gray-600">{t("speechStep.subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("speechStep.backButton")}
          </button>
          <button
            onClick={onGenerateSlides}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            {t("speechStep.generateSlidesButton")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">{t("speechStep.contentTitle")}</h3>
          <div className="flex gap-2">
            <button
              onClick={onRegenerateSpeech}
              className="px-3 py-1.5 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              {t("speechStep.regenerateButton")}
            </button>
            <button
              onClick={() => onCopyContent(speech)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              {t("app.copy")}
            </button>
            <button
              onClick={() => onDownloadContent(speech, `presentation-speech-${setup.topic.toLowerCase().replace(/\s+/g, '-')}.md`)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              {t("app.download")}
            </button>
          </div>
        </div>
        
        <textarea
          value={speech}
          onChange={(e) => onUpdateSpeech(e.target.value)}
          className="w-full flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono text-sm resize-none"
          placeholder={t("speechStep.placeholder")}
        />
      </div>
    </div>
  );
}
