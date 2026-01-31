"use client";

import { useState } from "react";
import { FileText, Eye, Download, Copy, ChevronLeft, Share2, Check } from "lucide-react";
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
  sessionId?: string | null;
}

export default function HtmlSlidesStep({
  htmlSlides,
  setup,
  onBack,
  onShowPreview,
  onCopyContent,
  onDownloadContent,
  onUpdateHtmlSlides,
  sessionId,
}: HtmlSlidesStepProps) {
  const { t } = useTranslation();
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDownloadHTML = () => {
    const filename = `presentation-${setup.topic.replace(/\s+/g, "-").toLowerCase()}.html`;
    onDownloadContent(htmlSlides, filename);
  };

  const handleCopyHTML = () => {
    onCopyContent(htmlSlides);
  };

  const handleSharePresentation = async () => {
    if (!sessionId) {
      setShareError(t("htmlSlidesStep.share.noSessionError"));
      return;
    }

    if (!htmlSlides || htmlSlides.trim().length === 0) {
      setShareError(t("htmlSlidesStep.share.noContentError"));
      return;
    }

    setIsSharing(true);
    setShareError(null);

    try {
      const response = await fetch("/api/share-presentation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          htmlContent: htmlSlides,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShareUrl(data.url);
        // Copy to clipboard automatically
        await navigator.clipboard.writeText(data.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        setShareError(data.error || data.message || t("htmlSlidesStep.share.failedError"));
      }
    } catch (error) {
      console.error("Error sharing presentation:", error);
      setShareError(t("htmlSlidesStep.share.failedError"));
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
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

        {/* Share Status */}
        {shareUrl && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 mb-1">
                  {t("htmlSlidesStep.share.successTitle")}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 text-sm border border-green-300 rounded-lg bg-white text-gray-700 truncate"
                  />
                  <button
                    onClick={handleCopyShareUrl}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        {t("htmlSlidesStep.share.copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        {t("htmlSlidesStep.share.copyButton")}
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  {t("htmlSlidesStep.share.successMessage")}
                </p>
              </div>
            </div>
          </div>
        )}

        {shareError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">{shareError}</p>
          </div>
        )}

        {/* HTML Preview */}
        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col flex-1">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSharePresentation}
                  disabled={isSharing || !sessionId}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSharing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t("htmlSlidesStep.share.sharing")}
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      {t("htmlSlidesStep.buttons.share")}
                    </>
                  )}
                </button>
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
