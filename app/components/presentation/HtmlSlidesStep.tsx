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
     
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
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
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("htmlSlidesStep.backToSlidesButton")}
          </button>
        </div>

        {/* HTML Preview */}
        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col flex-1">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">{t("htmlSlidesStep.preview.title")}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onShowPreview}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  {t("htmlSlidesStep.buttons.preview")}
                </button>
                <button
                  onClick={handleDownloadHTML}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  {t("htmlSlidesStep.buttons.download")}
                </button>
                <button
                  onClick={handleCopyHTML}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  {t("htmlSlidesStep.buttons.copy")}
                </button>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-900 text-gray-100 font-mono text-sm overflow-hidden flex-1">
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
      </div>
    </div>
  );
}
