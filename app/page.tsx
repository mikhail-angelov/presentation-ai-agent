"use client";

import { useEffect, useState } from "react";
import Header from "./components/shared/Header";
import PresentationSetup from "./components/presentation/PresentationSetup";
import OutlineStep from "./components/presentation/OutlineStep";
import SpeechStep from "./components/presentation/SpeechStep";
import SlidesStep from "./components/presentation/SlidesStep";
import HtmlSlidesStep from "./components/presentation/HtmlSlidesStep";
import RequestStreamingDisplay from "./components/presentation/RequestStreamingDisplay";
import ImageGenerationProgressDisplay from "./components/presentation/ImageGenerationProgressDisplay";
import PreparationSteps from "./components/presentation/PreparationSteps";
import Footer from "./components/shared/Footer";
import { useSession } from "./hooks/useSession";
import { useTranslation } from "./hooks/useTranslation";
import { StepType } from "./types/steps";
import { useToast } from "./contexts/ToastContext";
import SlidesPreviewModal from "./components/shared/SlidesPreviewModal";
import RateLimitModal from "./components/shared/RateLimitModal";
import FeedbackModal from "./components/shared/FeedbackModal";
import { useStore } from "./lib/flux/store";
import { dispatcher, dispatcherHelpers } from "./lib/flux/dispatcher";

export default function Home() {
  const { session, trackAction } = useSession();
  const { isLoading, t } = useTranslation();
  const { addToast } = useToast();

  // Get state from Flux store
  const {
    activeStep,
    stepHistory,
    stepContents,
    rateLimit,
    isGenerating,
    streamingContent,
    showSlidesModal,
    generatedSlidesHTML,
    imageGenerationProgress,
    presentationActions,
    presentationOptions,
  } = useStore();

  // Modal states
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Check if user has exceeded rate limit
  const hasExceededRateLimit = rateLimit.used >= rateLimit.limit;

  // Helper function to check rate limit before performing actions
  const checkRateLimit = (actionName: string) => {
    if (hasExceededRateLimit) {
      setShowRateLimitModal(true);
      trackAction("rate_limit_exceeded", {
        action: actionName,
        used: rateLimit.used,
        limit: rateLimit.limit,
      });
      return false;
    }
    return true;
  };

  // Helper functions
  const navigateToStep = (step: StepType) => {
    dispatcherHelpers.navigateToStep(step);
  };

  const updateStepContent = (step: StepType, content: any) => {
    dispatcherHelpers.updateStepContentWithHtmlSync(step, content);
  };

  // Cancel generation function
  const handleCancelGeneration = () => {
    dispatcherHelpers.cancelGeneration();
    addToast(t("toasts.generationCancelled"), "info");
    trackAction("cancel_generation", {
      step: activeStep,
      topic: stepContents.setup.topic,
    });
  };

  // Helper functions for content actions
  const handleDownloadContent = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    addToast(t("toasts.contentCopied"), "success");
  };

  // Save presentation data to JSON file
  const handleSavePresentation = () => {
    // Save only stepContents as requested
    const saveData = {
      stepContents,
      timestamp: new Date().toISOString(),
      version: "1.0",
      appName: "Presentation AI",
    };

    const jsonString = JSON.stringify(saveData, null, 2);
    const element = document.createElement("a");
    const file = new Blob([jsonString], { type: "application/json" });
    element.href = URL.createObjectURL(file);

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const topic = stepContents.setup.topic || "presentation";
    const filename = `presentation-ai-${topic.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.json`;

    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    // Track save action
    trackAction("save_presentation", {
      topic: stepContents.setup.topic,
      filename,
    });
  };

  // Load presentation data from JSON file
  const handleLoadPresentation = (data: any) => {
    try {
      // Validate loaded data
      if (!data.stepContents || typeof data.stepContents !== "object") {
        throw new Error("Invalid save file: missing stepContents");
      }

      // Load presentation using dispatcher
      dispatcher.loadPresentation(
        data.stepContents,
        data.stepContents.htmlSlides
      );

      // Track load action
      trackAction("load_presentation", {
        topic: data.stepContents?.setup?.topic || "unknown",
        timestamp: data.timestamp || "unknown",
      });

      addToast(t("toasts.presentationLoaded"), "success");
    } catch (error) {
      console.error("Error loading presentation:", error);
      addToast(
        t("toasts.loadPresentationFailed", {
          error: error instanceof Error ? error.message : "Invalid file format",
        }),
        "error",
      );
    }
  };

  // Step 1: Generate Outline
  const handleGenerateOutline = async () => {
    if (!checkRateLimit("generate_outline")) return;
    
    try {
      await presentationActions.generateOutline(
        stepContents.setup,
        presentationOptions
      );
    } catch (error) {
      console.error("Error generating outline:", error);
    }
  };

  // Step 2: Generate Speech from Outline
  const handleGenerateSpeech = async () => {
    if (!checkRateLimit("generate_speech")) return;
    
    try {
      await presentationActions.generateSpeech(
        stepContents.setup,
        stepContents.outline,
        presentationOptions
      );
    } catch (error) {
      console.error("Error generating speech:", error);
    }
  };

  // Step 3: Generate Slides from Speech
  const handleGenerateSlides = async () => {
    if (!checkRateLimit("generate_slides")) return;
    
    try {
      await presentationActions.generateSlides(
        stepContents.setup,
        stepContents.speech,
        presentationOptions
      );
    } catch (error) {
      console.error("Error generating slides:", error);
    }
  };

  const handleGenerateHtmlSlides = async () => {
    if (!checkRateLimit("generate_html_slides")) return;
    
    try {
      await presentationActions.generateHtmlSlides(
        stepContents.setup,
        stepContents.slides,
        presentationOptions
      );
    } catch (error) {
      console.error("Error completing presentation:", error);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: {
    type: "feedback" | "recommendation" | "issue";
    message: string;
    email?: string;
  }) => {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedback),
      });

      if (response.ok) {
        addToast(t("feedback.thankYou"), "success");
        trackAction("feedback_submitted", {
          type: feedback.type,
          hasEmail: !!feedback.email,
        });
      } else {
        addToast(t("feedback.submitFailed"), "error");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      addToast(t("feedback.submitFailed"), "error");
    }
  };

  // Track initial page load in session
  useEffect(() => {
    if (session) {
      trackAction("page_loaded", {
        path: "/",
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      });
    }
  }, []);


  // Render step content based on active step
  const renderStepContent = () => {
    switch (activeStep) {
      case "setup":
        return (
          <PresentationSetup
            presentationTopic={stepContents.setup.topic}
            setPresentationTopic={(topic) =>
              updateStepContent("setup", { ...stepContents.setup, topic })
            }
            targetAudience={stepContents.setup.audience}
            setTargetAudience={(audience) =>
              updateStepContent("setup", { ...stepContents.setup, audience })
            }
            presentationDuration={stepContents.setup.duration}
            setPresentationDuration={(duration) =>
              updateStepContent("setup", { ...stepContents.setup, duration })
            }
            keyPoints={stepContents.setup.keyPoints}
            setKeyPoints={(keyPoints) =>
              updateStepContent("setup", { ...stepContents.setup, keyPoints })
            }
            onStartPresentation={handleGenerateOutline}
          />
        );

      case "outline":
        return (
          <OutlineStep
            outline={stepContents.outline}
            setup={stepContents.setup}
            onBack={() => navigateToStep("setup")}
            onGenerateSpeech={handleGenerateSpeech}
            onRegenerateOutline={handleGenerateOutline}
            onUpdateOutline={(content) => updateStepContent("outline", content)}
            onCopyContent={handleCopyContent}
            onDownloadContent={handleDownloadContent}
          />
        );

      case "speech":
        return (
          <SpeechStep
            speech={stepContents.speech}
            setup={stepContents.setup}
            onBack={() => navigateToStep("outline")}
            onGenerateSlides={handleGenerateSlides}
            onRegenerateSpeech={handleGenerateSpeech}
            onUpdateSpeech={(content) => updateStepContent("speech", content)}
            onCopyContent={handleCopyContent}
            onDownloadContent={handleDownloadContent}
          />
        );

      case "slides":
        return (
          <SlidesStep
            slides={stepContents.slides}
            setup={stepContents.setup}
            onBack={() => navigateToStep("speech")}
            onGenerateHtmlSlides={handleGenerateHtmlSlides}
            onRegenerateSlides={handleGenerateSlides}
            onUpdateSlides={(content) => updateStepContent("slides", content)}
            onCopyContent={handleCopyContent}
            onDownloadContent={handleDownloadContent}
          />
        );

      case "htmlSlides":
        return (
          <HtmlSlidesStep
            htmlSlides={stepContents.htmlSlides}
            setup={stepContents.setup}
            onBack={() => navigateToStep("slides")}
            onShowPreview={() => dispatcher.setShowSlidesModal(true)}
            onCopyContent={handleCopyContent}
            onDownloadContent={handleDownloadContent}
            onUpdateHtmlSlides={(content) =>
              updateStepContent("htmlSlides", content)
            }
          />
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <span className="text-lg text-blue-700 font-semibold">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <div className="flex-1 flex flex-col p-4 md:p-8 h-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col h-full">
          <Header
            onFeedback={()=>setShowFeedbackModal(true)}
            onSave={handleSavePresentation}
            onLoad={handleLoadPresentation}
          />

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 min-h-0">
            {/* Left Column - Current Step Content */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8 overflow-y-auto">
              {/* Show image generation progress if it's active */}
              {imageGenerationProgress?.isGenerating ? (
                <ImageGenerationProgressDisplay
                  imageGenerationProgress={imageGenerationProgress}
                  onCancel={handleCancelGeneration}
                />
              ) : isGenerating ? (
                <RequestStreamingDisplay
                  isGenerating={isGenerating}
                  streamingContent={streamingContent}
                  onCancel={handleCancelGeneration}
                />
              ) : null}
              {renderStepContent()}
            </div>

            {/* Right Column - Step-by-Step Flow */}
            <div className="space-y-6 md:space-y-8 overflow-y-auto">
              <PreparationSteps
                currentStep={activeStep}
                stepHistory={stepHistory}
                onStepClick={(step: StepType) => {
                  if (step && stepHistory.includes(step)) {
                    navigateToStep(step);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Always visible at bottom */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <Footer rateLimit={rateLimit} session={session} />
        </div>
      </div>

      {showSlidesModal && (
        <SlidesPreviewModal
          onClose={() => dispatcher.setShowSlidesModal(false)}
          htmlContent={generatedSlidesHTML}
          topic={stepContents.setup.topic}
        />
      )}

      {/* Rate Limit Modal */}
      <RateLimitModal
        isOpen={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        rateLimit={rateLimit}
        onFeedbackClick={() => {
          setShowRateLimitModal(false);
          setShowFeedbackModal(true);
        }}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
