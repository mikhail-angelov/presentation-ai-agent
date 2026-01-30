"use client";

import { useTranslation } from "@/app/hooks/useTranslation";

interface ImageGenerationProgressDisplayProps {
  imageGenerationProgress: {
    isGenerating: boolean;
    current: number;
    total: number;
    currentPrompt: string;
  };
  onCancel?: () => void;
}

export default function ImageGenerationProgressDisplay({
  imageGenerationProgress,
  onCancel,
}: ImageGenerationProgressDisplayProps) {
  const { t } = useTranslation();

  if (!imageGenerationProgress.isGenerating) return null;
  const current = imageGenerationProgress.current + 1;
  const progressPercentage = (current / imageGenerationProgress.total) * 100;

  return (
    <div className="mb-6 bg-white rounded-2xl shadow-lg p-4 md:p-6 w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse flex-shrink-0"></div>
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {t("streamingDisplay.imageGenerationTitle")}
        </h3>
      </div>

      {/* Image Generation Progress */}
      <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <svg
              className="animate-spin h-5 w-5 text-purple-600 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm font-medium text-gray-900 truncate">
              {t("streamingDisplay.generatingImage")} {current}{" "}
              {t("streamingDisplay.of")} {imageGenerationProgress.total}
            </span>
          </div>
          <span className="text-sm font-semibold text-purple-600 flex-shrink-0">
            {Math.round((current / imageGenerationProgress.total) * 100)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(progressPercentage, 100)}%`,
            }}
          ></div>
        </div>

        {/* Current Prompt */}
        {imageGenerationProgress.currentPrompt && (
          <div className="text-xs text-gray-600 italic break-words overflow-hidden">
            <span className="font-medium">{t("streamingDisplay.currentPrompt")}:</span>{" "}
            <span className="truncate">{imageGenerationProgress.currentPrompt}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {t("streamingDisplay.waitMessage")}
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 flex-shrink-0"
          >
            {t("streamingDisplay.cancelButton")}
          </button>
        )}
      </div>
    </div>
  );
}
