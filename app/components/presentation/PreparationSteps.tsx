"use client";

import { TrendingUp, CheckCircle, Target, Users, Layout, Palette, Mic } from "lucide-react";
import { PresentationStep } from "@/app/types";

const steps: PresentationStep[] = [
  {
    id: 1,
    title: "Setup & Outline",
    description: "Define your topic and generate presentation outline",
    icon: <Target className="h-6 w-6" />,
    completed: false,
    tips: [
      "Be specific about your topic",
      "Identify your target audience",
      "Define key points and duration"
    ]
  },
  {
    id: 2,
    title: "Speech Generation",
    description: "Convert outline to spoken presentation",
    icon: <Mic className="h-6 w-6" />,
    completed: false,
    tips: [
      "Review and edit the generated speech",
      "Adjust for natural speaking style",
      "Consider timing and pacing"
    ]
  },
  {
    id: 3,
    title: "Slide Creation",
    description: "Create visual slides from speech content",
    icon: <Layout className="h-6 w-6" />,
    completed: false,
    tips: [
      "Focus on key visual elements",
      "Keep slides simple and clear",
      "Use visuals to support your message"
    ]
  },
  {
    id: 4,
    title: "Final Review",
    description: "Polish and perfect your presentation",
    icon: <CheckCircle className="h-6 w-6" />,
    completed: false,
    tips: [
      "Review all content for consistency",
      "Practice timing and delivery",
      "Prepare for questions and feedback"
    ]
  }
];

interface PreparationStepsProps {
  currentStep: number;
  onPreviousStep: () => void;
  onNextStep: () => void;
}

export default function PreparationSteps({
  currentStep,
  onPreviousStep,
  onNextStep,
}: PreparationStepsProps) {
  const getStepCompletion = (stepId: number) => {
    if (stepId < currentStep) return true;
    if (stepId === currentStep && currentStep > 0) return true;
    return false;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-7 w-7 text-purple-600" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Preparation Steps</h2>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const completed = getStepCompletion(step.id);
          const current = step.id === currentStep;
          return (
            <div
              key={step.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                current
                  ? "border-blue-500 bg-blue-50"
                  : completed
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  current
                    ? "bg-blue-100 text-blue-600"
                    : completed
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    {completed && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  <div className="space-y-1">
                    {step.tips.map((tip, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="h-1 w-1 rounded-full bg-gray-400" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {currentStep > 0 && (
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onPreviousStep}
            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl transition"
          >
            Previous
          </button>
          <button
            onClick={onNextStep}
            disabled={currentStep >= steps.length}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep >= steps.length ? "Completed!" : "Next Step"}
          </button>
        </div>
      )}
    </div>
  );
}
