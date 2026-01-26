"use client";

import { X, Star, MessageSquare, AlertCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/app/hooks/useTranslation";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    type: "feedback" | "recommendation" | "issue";
    message: string;
    email?: string;
  }) => void;
}

export default function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const { t } = useTranslation();
  const [feedbackType, setFeedbackType] = useState<"feedback" | "recommendation" | "issue">("feedback");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onSubmit({
      type: feedbackType,
      message: message.trim(),
      email: email.trim() || undefined,
    });

    setIsSubmitting(false);
    setMessage("");
    setEmail("");
    onClose();
  };

  const feedbackTypes = [
    {
      id: "feedback",
      label: t("feedback.types.feedback"),
      description: t("feedback.types.feedbackDesc"),
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    {
      id: "recommendation",
      label: t("feedback.types.recommendation"),
      description: t("feedback.types.recommendationDesc"),
      icon: MessageSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      id: "issue",
      label: t("feedback.types.issue"),
      description: t("feedback.types.issueDesc"),
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Sparkling header */}
        <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-sparkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {t("feedback.title")}
                </h2>
                <p className="text-white/80 text-sm">
                  {t("feedback.subtitle")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Feedback type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t("feedback.typeLabel")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFeedbackType(type.id as any)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      feedbackType === type.id
                        ? `${type.bgColor} ${type.borderColor} border-2 scale-105`
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className={`h-5 w-5 mx-auto mb-2 ${type.color}`} />
                    <div className="text-xs font-medium text-gray-900">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message input */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              {t("feedback.messageLabel")}
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("feedback.messagePlaceholder")}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Optional email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t("feedback.emailLabel")}
              <span className="text-gray-400 text-sm font-normal ml-1">
                {t("feedback.emailOptional")}
              </span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Submit button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("feedback.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("feedback.sending")}
                </span>
              ) : (
                <>
                  <span className="relative z-10">
                    {t("feedback.submit")}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-gray-500">
            {t("feedback.privacyNote")}
          </p>
        </form>
      </div>

      <style jsx global>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-sparkle {
          animation: sparkle 2s infinite;
        }
      `}</style>
    </div>
  );
}