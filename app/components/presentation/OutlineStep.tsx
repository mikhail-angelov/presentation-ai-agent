"use client";

import { Edit, ArrowLeft, ArrowRight, Download, Copy, RefreshCw } from "lucide-react";

interface OutlineStepProps {
  outline: string;
  setup: {
    topic: string;
    audience: string;
    duration: string;
    keyPoints: string[];
  };
  onBack: () => void;
  onGenerateSpeech: () => void;
  onRegenerateOutline: () => void;
  onUpdateOutline: (content: string) => void;
  onCopyContent: (content: string) => void;
  onDownloadContent: (content: string, filename: string) => void;
}

export default function OutlineStep({
  outline,
  setup,
  onBack,
  onGenerateSpeech,
  onRegenerateOutline,
  onUpdateOutline,
  onCopyContent,
  onDownloadContent,
}: OutlineStepProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Edit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Presentation Outline</h2>
            <p className="text-gray-600">Review and edit your presentation outline</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Setup
          </button>
          <button
            onClick={onGenerateSpeech}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            Generate Speech
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Outline Content</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onCopyContent(outline)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy
            </button>
            <button
              onClick={() => onDownloadContent(outline, `presentation-outline-${setup.topic.toLowerCase().replace(/\s+/g, '-')}.md`)}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        </div>
        
        <textarea
          value={outline}
          onChange={(e) => onUpdateOutline(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono text-sm"
          placeholder="Your presentation outline will appear here..."
        />
        
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={onRegenerateOutline}
            className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate Outline
          </button>
          <div className="text-sm text-gray-500">
            Outline generated on {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
