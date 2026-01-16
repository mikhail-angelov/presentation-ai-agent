"use client";

import { Check } from "lucide-react";

type StepType = "setup" | "outline" | "speech" | "slides";

interface StepNavigationProps {
  activeStep: StepType;
  stepHistory: StepType[];
  onNavigate: (step: StepType) => void;
}

export default function StepNavigation({
  activeStep,
  stepHistory,
  onNavigate,
}: StepNavigationProps) {
  const steps: StepType[] = ["setup", "outline", "speech", "slides"];
  const stepLabels = {
    setup: "Setup",
    outline: "Outline", 
    speech: "Speech",
    slides: "Slides"
  };

  return (
    <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
          <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 -z-10">
          {/* Progress line */}
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300"
            style={{ 
              width: `${(steps.indexOf(activeStep) / (steps.length - 1)) * 100}%` 
            }}
          ></div>
        </div>

        <div className="flex">
          {steps.map((step, index) => {
            const isActive = activeStep === step;
            const isCompleted = stepHistory.includes(step);
            const isAccessible = stepHistory.includes(step) || step === "setup";
            
            return (
              <div key={step} className="flex flex-col items-center relative">
                {/* Step circle with connecting line segments */}
                <div className="flex items-center">
                  {/* Left connector for all except first */}
                  {index > 0 && (
                    <div className={`w-8 h-0.5 ${
                      isCompleted || isActive ? 'bg-blue-500' : 'bg-gray-200'
                    }`}></div>
                  )}
                  
                  {/* Step circle */}
                  <button
                    onClick={() => isAccessible && onNavigate(step)}
                    disabled={!isAccessible}
                    className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      isActive
                        ? "border-blue-500 bg-blue-500 text-white"
                        : isCompleted
                        ? "border-green-500 bg-green-500 text-white"
                        : isAccessible
                        ? "border-gray-300 bg-white text-gray-600 hover:border-blue-400"
                        : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isCompleted && !isActive ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="font-medium text-sm">{index + 1}</span>
                    )}
                  </button>
                  
                  {/* Right connector for all except last */}
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ${
                      (isCompleted || isActive) && stepHistory.includes(steps[index + 1]) 
                        ? 'bg-blue-500' 
                        : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>

                {/* Step label */}
                <div className="mt-3 text-center">
                  <div className={`text-sm font-medium ${
                    isActive
                      ? "text-blue-600"
                      : isCompleted
                      ? "text-green-600"
                      : isAccessible
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}>
                    {stepLabels[step]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
