"use client";

import { TrendingUp, CheckCircle, Target, Layout, Mic, FileText, Eye } from "lucide-react";
import { PresentationStep, STEPS, StepType } from "@/app/types/steps";

const steps: PresentationStep[] = [
  {
    id: STEPS[0],
    title: "Setup & Outline",
    description: "Define your topic and generate presentation outline",
    icon: <Target className="h-6 w-6" />,
    completed: false,
    tips: [
      "Be specific about your topic",
      "Identify your target audience",
      "Define key points and duration",
    ],
  },
  {
    id: STEPS[1],
    title: "Speech Generation",
    description: "Convert outline to spoken presentation",
    icon: <Mic className="h-6 w-6" />,
    completed: false,
    tips: [
      "Review and edit the generated speech",
      "Adjust for natural speaking style",
      "Consider timing and pacing",
    ],
  },
  {
    id: STEPS[2],
    title: "Slide Creation",
    description: "Create visual slides from speech content",
    icon: <Layout className="h-6 w-6" />,
    completed: false,
    tips: [
      "Focus on key visual elements",
      "Keep slides simple and clear",
      "Use visuals to support your message",
    ],
  },
  {
    id: STEPS[3],
    title: "HTML Slides Generation",
    description: "Generate HTML presentation from slide content",
    icon: <FileText className="h-6 w-6" />,
    completed: false,
    tips: [
      "Review the generated HTML slides",
      "Make any final adjustments",
      "Prepare for final presentation",
    ],
  },
  {
    id: STEPS[4],
    title: "Review & Download",
    description: "Preview and download HTML presentation slides",
    icon: <Eye className="h-6 w-6" />,
    completed: false,
    tips: [
      "Preview the generated HTML slides",
      "Download or copy the HTML code",
      "Test the presentation in a browser",
    ],
  },
];

interface PreparationStepsProps {
  currentStep: StepType;
  stepHistory: StepType[];
  onStepClick: (step: StepType) => void;
}

export default function PreparationSteps({
  currentStep,
  stepHistory,
  onStepClick,
}: PreparationStepsProps) {
  const getStepCompletion = (step: StepType) => {
    return stepHistory.includes(step);
  };

  // Determine if a step is clickable
  const isStepClickable = (step: StepType) => {
    const completed = getStepCompletion(step);
    const current = step === currentStep;

    return completed || current;
  };

  const handleStepClick = (step: StepType) => {
    if (isStepClickable(step)) {
      onStepClick(step);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-7 w-7 text-purple-600" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Preparation Steps
        </h2>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const completed = getStepCompletion(step.id);
          const current = step.id === currentStep;
          const clickable = isStepClickable(step.id);

          return (
            <div
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                current
                  ? "border-blue-500 bg-blue-50"
                  : completed
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200"
              } ${
                clickable
                  ? "cursor-pointer hover:shadow-md hover:border-blue-300"
                  : "cursor-default"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    current
                      ? "bg-blue-100 text-blue-600"
                      : completed
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    {completed && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {step.description}
                  </p>
                  <div className="space-y-1">
                    {step.tips.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-500"
                      >
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
    </div>
  );
}
