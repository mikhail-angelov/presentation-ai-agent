"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/app/hooks/useTranslation";

interface StreamingDisplayProps {
  isGenerating: boolean;
  streamingContent: string;
  onCancel?: () => void;
  imageGenerationProgress?: {
    isGenerating: boolean;
    current: number;
    total: number;
    currentPrompt: string;
  };
}

export default function StreamingDisplay({
  isGenerating,
  streamingContent,
  onCancel,
  imageGenerationProgress,
}: StreamingDisplayProps) {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const prevContentLengthRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (!contentRef.current) return;

    const contentElement = contentRef.current;
    const isAtBottom =
      contentElement.scrollHeight - contentElement.scrollTop <=
      contentElement.clientHeight + 100; // 100px threshold

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Only auto-scroll if user is already at the bottom or content just started
    if (isAtBottom || streamingContent.length <= prevContentLengthRef.current) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        contentElement.scrollTop = contentElement.scrollHeight;
      });

      // Also schedule another scroll after a short delay to handle multiple line updates
      scrollTimeoutRef.current = setTimeout(() => {
        if (
          contentElement.scrollHeight - contentElement.scrollTop >
          contentElement.clientHeight + 50
        ) {
          contentElement.scrollTop = contentElement.scrollHeight;
        }
      }, 50);
    }

    prevContentLengthRef.current = streamingContent.length;

    // Cleanup timeout on unmount
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [streamingContent]);

  if (!isGenerating && !imageGenerationProgress?.isGenerating) return null;

  return (
    <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold text-gray-900">
          {imageGenerationProgress?.isGenerating
            ? t("streamingDisplay.imageGenerationTitle") || "Generating Images"
            : t("streamingDisplay.title")}
        </h3>
      </div>

      {/* Image Generation Progress */}
      {imageGenerationProgress?.isGenerating && (
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-purple-600"
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
              <span className="text-sm font-medium text-gray-900">
                {t("streamingDisplay.generatingImage") || "Generating image"}{" "}
                {imageGenerationProgress.current}{" "}
                {t("streamingDisplay.of") || "of"}{" "}
                {imageGenerationProgress.total}
              </span>
            </div>
            <span className="text-sm font-semibold text-purple-600">
              {Math.round(
                (imageGenerationProgress.current /
                  imageGenerationProgress.total) *
                  100,
              )}
              %
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(imageGenerationProgress.current / imageGenerationProgress.total) * 100}%`,
              }}
            ></div>
          </div>

          {/* Current Prompt */}
          {imageGenerationProgress.currentPrompt && (
            <div className="text-xs text-gray-600 italic truncate">
              {t("streamingDisplay.currentPrompt") || "Prompt"}:{" "}
              {imageGenerationProgress.currentPrompt}
            </div>
          )}
        </div>
      )}
      {!imageGenerationProgress?.isGenerating && (
        <div
          ref={contentRef}
          className="bg-gray-50 rounded-xl p-4 min-h-[200px] max-h-[400px] overflow-y-auto"
        >
          <div className="prose prose-blue max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-800">
              {streamingContent}
              {!streamingContent && t("streamingDisplay.startingMessage")}
              <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
            </pre>
          </div>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {t("streamingDisplay.waitMessage")}
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
          >
            {t("streamingDisplay.cancelButton")}
          </button>
        )}
      </div>
    </div>
  );
}
