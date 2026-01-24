"use client";

import { TrendingUp, CheckCircle, Target, Layout, Mic, FileText, Eye } from "lucide-react";
import { PresentationStep, STEPS, StepType } from "@/app/types/steps";
import { useTranslation } from "@/app/hooks/useTranslation";


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
  const { t } = useTranslation();
  
  const steps: PresentationStep[] = [
    {
      id: STEPS[0],
      title: t("preparationSteps.steps.setupOutline.title"),
      description: t("preparationSteps.steps.setupOutline.description"),
      icon: <Target className="h-6 w-6" />,
      completed: false,
      tips: [
        t("preparationSteps.steps.setupOutline.tips.0"),
        t("preparationSteps.steps.setupOutline.tips.1"),
        t("preparationSteps.steps.setupOutline.tips.2"),
      ],
    },
    {
      id: STEPS[1],
      title: t("preparationSteps.steps.speechGeneration.title"),
      description: t("preparationSteps.steps.speechGeneration.description"),
      icon: <Mic className="h-6 w-6" />,
      completed: false,
      tips: [
        t("preparationSteps.steps.speechGeneration.tips.0"),
        t("preparationSteps.steps.speechGeneration.tips.1"),
        t("preparationSteps.steps.speechGeneration.tips.2"),
      ],
    },
    {
      id: STEPS[2],
      title: t("preparationSteps.steps.slideCreation.title"),
      description: t("preparationSteps.steps.slideCreation.description"),
      icon: <Layout className="h-6 w-6" />,
      completed: false,
      tips: [
        t("preparationSteps.steps.slideCreation.tips.0"),
        t("preparationSteps.steps.slideCreation.tips.1"),
        t("preparationSteps.steps.slideCreation.tips.2"),
      ],
    },
    {
      id: STEPS[3],
      title: t("preparationSteps.steps.htmlSlidesGeneration.title"),
      description: t("preparationSteps.steps.htmlSlidesGeneration.description"),
      icon: <FileText className="h-6 w-6" />,
      completed: false,
      tips: [
        t("preparationSteps.steps.htmlSlidesGeneration.tips.0"),
        t("preparationSteps.steps.htmlSlidesGeneration.tips.1"),
        t("preparationSteps.steps.htmlSlidesGeneration.tips.2"),
      ],
    },
    {
      id: STEPS[4],
      title: t("preparationSteps.steps.reviewDownload.title"),
      description: t("preparationSteps.steps.reviewDownload.description"),
      icon: <Eye className="h-6 w-6" />,
      completed: false,
      tips: [
        t("preparationSteps.steps.reviewDownload.tips.0"),
        t("preparationSteps.steps.reviewDownload.tips.1"),
        t("preparationSteps.steps.reviewDownload.tips.2"),
      ],
    },
  ];
  
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
          {t("preparationSteps.title")}
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
