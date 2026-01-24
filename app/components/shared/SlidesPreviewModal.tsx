"use client";

import { useToast } from "@/app/contexts/ToastContext";
import { useTranslation } from "@/app/hooks/useTranslation";

interface SlidesPreviewModalProps {
  onClose: () => void;
  htmlContent: string;
  topic?: string;
}

export default function SlidesPreviewModal({
  onClose,
  htmlContent,
  topic = "Presentation",
}: SlidesPreviewModalProps) {
  const { addToast } = useToast();
  const { t } = useTranslation();

  if (!htmlContent) return null;

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(htmlContent);
    addToast("HTML code copied to clipboard!", "success");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t("slidesPreviewModal.title")}
            </h2>
            <p className="text-gray-600 mt-1">
              {t("slidesPreviewModal.subtitle")}
            </p>
            {topic && (
              <p className="text-sm text-gray-500 mt-1">
                {t("slidesPreviewModal.topicLabel")}: <span className="font-medium">{topic}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body - Iframe with slides */}
        <div className="flex-1 min-h-0 p-2">
          <div className="w-full h-full border-2 border-gray-200 rounded-lg overflow-auto">
            <iframe
              srcDoc={htmlContent}
              title="Presentation Slides Preview"
              className="w-full min-h-[600px]"
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {t("slidesPreviewModal.features.aiGenerated")}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {t("slidesPreviewModal.features.interactive")}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  ></path>
                </svg>
                {Math.ceil(htmlContent.length / 1024)} {t("slidesPreviewModal.features.kb")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHTML}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("slidesPreviewModal.buttons.copy")}
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([htmlContent], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `slides-${topic.replace(/\s+/g, "-").toLowerCase()}.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  addToast("HTML file downloaded!", "success");
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("slidesPreviewModal.buttons.download")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
