"use client";

import { useTranslation } from "@/app/hooks/useTranslation";
import { RATE_LIMIT, SessionData } from "@/app/lib/flux/store";

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: SessionData | null;
  onFeedbackClick: () => void;
}

export default function RateLimitModal({
  isOpen,
  onClose,
  session,
  onFeedbackClick,
}: RateLimitModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-100 to-blue-100">
            <svg
              className="h-6 w-6 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {t("rateLimitModal.title") || "Thank You for Using Our App!"}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {t("rateLimitModal.subtitle") ||
              "You've reached the usage limit for this demo."}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
            <p className="text-sm text-gray-700">
              {t("rateLimitModal.appreciation") ||
                "We appreciate you trying out our AI-powered presentation tool!"}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900">
              {t("rateLimitModal.purposeTitle") || "About This Demo"}
            </h4>
            <p className="text-sm text-gray-600">
              {t("rateLimitModal.purposeDescription") ||
                "This application demonstrates how AI agents can generate useful presentation content including outlines, speeches, and slides."}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900">
              {t("rateLimitModal.limitsTitle") || "Usage Limits"}
            </h4>
            <p className="text-sm text-gray-600">
              {t("rateLimitModal.limitsDescription") ||
                "Each AI request requires token budget and is limited for free usage. You've used "}
              <span className="font-semibold text-purple-600">
                {session?.mlRequestCount||0}/{RATE_LIMIT}
              </span>
              {t("rateLimitModal.limitsSuffix") || " requests."}
            </p>
          </div>

          {/* Feedback Section */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-blue-900">
              {t("rateLimitModal.feedbackTitle") || "Share Your Feedback"}
            </h4>
            <p className="mb-4 text-sm text-blue-700">
              {t("rateLimitModal.feedbackDescription") ||
                "We'd love to hear your thoughts about this AI presentation tool!"}
            </p>
            <button
              onClick={onFeedbackClick}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700"
            >
              {t("rateLimitModal.feedbackButton") || "Share Feedback"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t("rateLimitModal.closeButton") || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
