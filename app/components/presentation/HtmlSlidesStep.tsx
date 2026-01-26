"use client";

import { FileText, Eye, Download, Copy, ChevronLeft } from "lucide-react";
import { StepContent } from "@/app/types/steps";
import { useTranslation } from "@/app/hooks/useTranslation";

interface HtmlSlidesStepProps {
  htmlSlides: string;
  setup: StepContent["setup"];
  onBack: () => void;
  onShowPreview: () => void;
  onCopyContent: (content: string) => void;
  onDownloadContent: (content: string, filename: string) => void;
  onUpdateHtmlSlides?: (content: string) => void;
}

export default function HtmlSlidesStep({
  htmlSlides,
  setup,
  onBack,
  onShowPreview,
  onCopyContent,
  onDownloadContent,
  onUpdateHtmlSlides,
}: HtmlSlidesStepProps) {
  const { t } = useTranslation();
  const handleDownloadHTML = () => {
    const filename = `presentation-${setup.topic.replace(/\s+/g, "-").toLowerCase()}.html`;
    onDownloadContent(htmlSlides, filename);
  };

  const handleCopyHTML = () => {
    onCopyContent(htmlSlides);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium">{t("htmlSlidesStep.backButton")}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {t("htmlSlidesStep.badge")}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t("htmlSlidesStep.title")}</h2>
            <p className="text-gray-600">
              {t("htmlSlidesStep.subtitle")}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">{t("htmlSlidesStep.stats.topic")}</div>
            <div className="font-semibold text-gray-900 truncate">{setup.topic}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">{t("htmlSlidesStep.stats.audience")}</div>
            <div className="font-semibold text-gray-900">{setup.audience}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">{t("htmlSlidesStep.stats.fileSize")}</div>
            <div className="font-semibold text-gray-900">
              {Math.ceil(htmlSlides.length / 1024)} KB
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={onShowPreview}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="h-5 w-5" />
            {t("htmlSlidesStep.buttons.preview")}
          </button>
          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-5 w-5" />
            {t("htmlSlidesStep.buttons.download")}
          </button>
          <button
            onClick={handleCopyHTML}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Copy className="h-5 w-5" />
            {t("htmlSlidesStep.buttons.copy")}
          </button>
        </div>

        {/* HTML Preview */}
        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col flex-1">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">{t("htmlSlidesStep.preview.title")}</span>
              <span className="text-sm text-gray-500">
                {t("htmlSlidesStep.preview.subtitle")}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-x-auto flex-1">
            <textarea
              value={htmlSlides}
              onChange={(e) => {
                if (onUpdateHtmlSlides) {
                  onUpdateHtmlSlides(e.target.value);
                }
              }}
              className="w-full h-full bg-gray-900 text-gray-100 font-mono text-sm border-0 focus:ring-0 focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">{t("htmlSlidesStep.instructions.title")}</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• {t("htmlSlidesStep.instructions.preview")}</li>
            <li>• {t("htmlSlidesStep.instructions.download")}</li>
            <li>• {t("htmlSlidesStep.instructions.open")}</li>
            <li>• {t("htmlSlidesStep.instructions.navigate")}</li>
            <li>• {t("htmlSlidesStep.instructions.selfContained")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
