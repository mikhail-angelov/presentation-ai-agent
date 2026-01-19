"use client";

import { Brain } from "lucide-react";
import { useTranslation } from "@/app/hooks/useTranslation";

interface PresentationSetupProps {
  presentationTopic: string;
  setPresentationTopic: (topic: string) => void;
  targetAudience: string;
  setTargetAudience: (audience: string) => void;
  presentationDuration: string;
  setPresentationDuration: (duration: string) => void;
  keyPoints: string[];
  setKeyPoints: (points: string[]) => void;
  onStartPresentation: () => void;
}

export default function PresentationSetup({
  presentationTopic,
  setPresentationTopic,
  targetAudience,
  setTargetAudience,
  presentationDuration,
  setPresentationDuration,
  keyPoints,
  setKeyPoints,
  onStartPresentation,
}: PresentationSetupProps) {
  const { t } = useTranslation();

  const handleKeyPointsChange = (value: string) => {
    // Keep all lines including empty ones for textarea display
    // Empty lines will be filtered when actually using the key points
    const points = value.split("\n");
    setKeyPoints(points);
  };

  const getKeyPointsText = () => {
    return keyPoints.join("\n");
  };

  // Helper to get filtered key points (without empty lines)
  const getFilteredKeyPoints = () => {
    return keyPoints.filter((point) => point.trim() !== "");
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-7 w-7 text-blue-600" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          {t('setup.title')}
        </h2>
      </div>

      <p className="text-gray-600 mb-6">
        {t('setup.description')}
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('setup.topicLabel')} *
          </label>
          <input
            type="text"
            value={presentationTopic}
            onChange={(e) => setPresentationTopic(e.target.value)}
            placeholder={t('setup.topicPlaceholder')}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('setup.audienceLabel')}
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">{t('setup.audiencePlaceholder')}</option>
              <option value="executives">Executives</option>
              <option value="developers">Developers</option>
              <option value="students">Students</option>
              <option value="clients">Clients</option>
              <option value="general">General Public</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('setup.durationLabel')}
            </label>
            <select
              value={presentationDuration}
              onChange={(e) => setPresentationDuration(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="5">5 {t('app.minutes')}</option>
              <option value="10">10 {t('app.minutes')}</option>
              <option value="15">15 {t('app.minutes')}</option>
              <option value="30">30 {t('app.minutes')}</option>
              <option value="45">45 {t('app.minutes')}</option>
              <option value="60">60 {t('app.minutes')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('setup.keyPointsLabel')}
          </label>
          <textarea
            value={getKeyPointsText()}
            onChange={(e) => handleKeyPointsChange(e.target.value)}
            placeholder={t('setup.keyPointsPlaceholder')}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y"
          />
          <p className="mt-1 text-sm text-gray-500">
            {t('setup.keyPointsDescription')}
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={onStartPresentation}
            disabled={!presentationTopic.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('setup.startPresentation')}
          </button>
        </div>
      </div>
    </div>
  );
}
