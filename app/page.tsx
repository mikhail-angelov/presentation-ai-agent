"use client";

import { useState, useEffect } from "react";
import Header from "./components/shared/Header";
import PresentationSetup from "./components/presentation/PresentationSetup";
import OutlineStep from "./components/presentation/OutlineStep";
import SpeechStep from "./components/presentation/SpeechStep";
import SlidesStep from "./components/presentation/SlidesStep";
import StreamingDisplay from "./components/presentation/StreamingDisplay";
import UserGuides from "./components/presentation/UserGuides";
import PreparationSteps from "./components/presentation/PreparationSteps";
import AIUsageMonitoring from "./components/monitoring/AIUsageMonitoring";
import { LLMRequest, RateLimit } from "./types";
import { useSession } from "./hooks/useSession";
import { useTranslation } from "./hooks/useTranslation";

// Define step types
type StepType = "setup" | "outline" | "speech" | "slides";

interface StepContent {
  setup: {
    topic: string;
    audience: string;
    duration: string;
    keyPoints: string[];
  };
  outline: string;
  speech: string;
  slides: string;
}

export default function Home() {
  const { session, trackAction } = useSession();
  const { currentLanguage, isLoading } = useTranslation();

  // Step management
  const [activeStep, setActiveStep] = useState<StepType>("setup");
  const [stepHistory, setStepHistory] = useState<StepType[]>(["setup"]);
  const [stepContents, setStepContents] = useState<StepContent>({
    setup: {
      topic: "",
      audience: "",
      duration: "10",
      keyPoints: [""],
    },
    outline: "",
    speech: "",
    slides: "",
  });

  // UI states
  const [llmRequests, setLlmRequests] = useState<LLMRequest[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimit>({
    used: 0,
    limit: 100,
    resetTime: Date.now() + 3600000,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // Helper functions
  const addLLMRequest = (request: LLMRequest) => {
    setLlmRequests((prev) => [request, ...prev.slice(0, 9)]);
    setRateLimit((prev) => ({
      ...prev,
      used: Math.min(prev.used + 1, prev.limit),
    }));
  };

  const navigateToStep = (step: StepType) => {
    setActiveStep(step);
    if (!stepHistory.includes(step)) {
      setStepHistory([...stepHistory, step]);
    }
  };

  const updateStepContent = (step: StepType, content: any) => {
    setStepContents((prev) => ({
      ...prev,
      [step]: content,
    }));
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
    alert("Content copied to clipboard!");
  };

  // Step 1: Generate Outline
  const handleGenerateOutline = async () => {
    const { topic, audience, duration, keyPoints } = stepContents.setup;
    if (!topic.trim()) {
      alert("Please enter a presentation topic first.");
      return;
    }
    setIsGenerating(true);
    setStreamingContent("");
    trackAction("start_presentation", {
      topic,
      audience,
      duration,
      keyPoints: keyPoints.filter((kp) => kp.trim() !== ""),
    });
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          topic,
          audience,
          duration,
          keyPoints: keyPoints.filter((kp) => kp.trim() !== ""),
          stepType: "outline",
          language: currentLanguage,
        }),
      });
      const data = await response.json();
      const durationMs = Date.now() - startTime;
      if (data.success) {
        const content = data.content;
        const metadata = data.metadata;
        // Simulate streaming effect
        let displayedContent = "";
        const words = content.split(" ");
        for (let i = 0; i < words.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          displayedContent += words[i] + " ";
          setStreamingContent(displayedContent);
        }
        // Update outline content
        updateStepContent("outline", content);
        // Add to LLM requests
        const newRequest: LLMRequest = {
          id: requestId,
          timestamp: new Date(),
          endpoint: "/api/generate-content",
          status: "success",
          tokensUsed: metadata.tokensUsed,
          duration: durationMs,
        };
        addLLMRequest(newRequest);
        // Track successful generation in session
        trackAction(
          "generate_presentation_success",
          {
            topic,
            audience,
            duration,
          },
          {
            contentLength: content.length,
            tokensUsed: metadata.tokensUsed,
            sessionId: metadata.sessionId,
            newSessionCreated: metadata.newSessionCreated,
          },
          metadata.tokensUsed,
          durationMs
        );
        // Navigate to outline step after streaming completes
        setTimeout(() => {
          navigateToStep("outline");
        }, 500);
      } else {
        // Track failed generation in session
        trackAction(
          "generate_presentation_error",
          {
            topic,
            audience,
          },
          {
            error: data.error,
          },
          undefined,
          durationMs
        );
        const errorRequest: LLMRequest = {
          id: requestId,
          timestamp: new Date(),
          endpoint: "/api/generate-content",
          status: "error",
          tokensUsed: 0,
          duration: durationMs,
        };
        addLLMRequest(errorRequest);
        alert(`Error: ${data.error || "Failed to generate content"}`);
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error("Error generating content:", error);
      // Track network error in session
      trackAction(
        "generate_presentation_network_error",
        {
          topic,
        },
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        undefined,
        durationMs
      );
      const errorRequest: LLMRequest = {
        id: requestId,
        timestamp: new Date(),
        endpoint: "/api/generate-content",
        status: "error",
        tokensUsed: 0,
        duration: durationMs,
      };
      addLLMRequest(errorRequest);
      alert("Failed to connect to AI service. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 2: Generate Speech from Outline
  const handleGenerateSpeech = async () => {
    setIsGenerating(true);
    setStreamingContent("");

    const { topic, audience, duration } = stepContents.setup;
    const outline = stepContents.outline;

    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          topic,
          audience,
          duration,
          keyPoints: [
            "Convert outline to spoken speech",
            "Natural speaking style",
            "Engaging delivery",
          ],
          stepType: "speech",
          previousContent: outline,
          language: currentLanguage,
        }),
      });

      const data = await response.json();
      const durationMs = Date.now() - startTime;

      if (data.success) {
        const content = data.content;
        const metadata = data.metadata;

        // Simulate streaming effect
        let displayedContent = "";
        const words = content.split(" ");
        for (let i = 0; i < words.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          displayedContent += words[i] + " ";
          setStreamingContent(displayedContent);
        }

        // Update speech content
        updateStepContent("speech", content);

        // Add to LLM requests
        const newRequest: LLMRequest = {
          id: requestId,
          timestamp: new Date(),
          endpoint: "/api/generate-content",
          status: "success",
          tokensUsed: metadata.tokensUsed,
          duration: durationMs,
        };
        addLLMRequest(newRequest);

        // Track successful generation in session
        trackAction(
          "generate_speech_success",
          {
            topic,
            outlineLength: outline.length,
          },
          {
            contentLength: content.length,
            tokensUsed: metadata.tokensUsed,
          },
          metadata.tokensUsed,
          durationMs
        );

        // Navigate to speech step after streaming completes
        setTimeout(() => {
          navigateToStep("speech");
        }, 500);
      } else {
        alert(`Error: ${data.error || "Failed to generate speech"}`);
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      alert("Failed to connect to AI service. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 3: Generate Slides from Speech
  const handleGenerateSlides = async () => {
    setIsGenerating(true);
    setStreamingContent("");

    const { topic, audience, duration } = stepContents.setup;
    const speech = stepContents.speech;

    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          topic,
          audience,
          duration,
          keyPoints: [
            "Create slide content",
            "Visual suggestions",
            "Slide structure",
          ],
          stepType: "slides",
          previousContent: speech,
          language: currentLanguage,
        }),
      });

      const data = await response.json();
      const durationMs = Date.now() - startTime;

      if (data.success) {
        const content = data.content;
        const metadata = data.metadata;

        // Simulate streaming effect
        let displayedContent = "";
        const words = content.split(" ");
        for (let i = 0; i < words.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          displayedContent += words[i] + " ";
          setStreamingContent(displayedContent);
        }

        // Update slides content
        updateStepContent("slides", content);

        // Add to LLM requests
        const newRequest: LLMRequest = {
          id: requestId,
          timestamp: new Date(),
          endpoint: "/api/generate-content",
          status: "success",
          tokensUsed: metadata.tokensUsed,
          duration: durationMs,
        };
        addLLMRequest(newRequest);

        // Track successful generation in session
        trackAction(
          "generate_slides_success",
          {
            topic,
            speechLength: speech.length,
          },
          {
            contentLength: content.length,
            tokensUsed: metadata.tokensUsed,
          },
          metadata.tokensUsed,
          durationMs
        );

        // Navigate to slides step after streaming completes
        setTimeout(() => {
          navigateToStep("slides");
        }, 500);
      } else {
        alert(`Error: ${data.error || "Failed to generate slides"}`);
      }
    } catch (error) {
      console.error("Error generating slides:", error);
      alert("Failed to connect to AI service. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompletePresentation = () => {
    alert("Slides completed! Your presentation is ready.");
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
  }, [session, trackAction]);

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
            onCompletePresentation={handleCompletePresentation}
            onRegenerateSlides={handleGenerateSlides}
            onUpdateSlides={(content) => updateStepContent("slides", content)}
            onCopyContent={handleCopyContent}
            onDownloadContent={handleDownloadContent}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header session={session} />

        <StreamingDisplay
          isGenerating={isGenerating}
          streamingContent={streamingContent}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Current Step Content */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {renderStepContent()}
            <UserGuides />
          </div>

          {/* Right Column - Step-by-Step Flow & API Monitoring */}
          <div className="space-y-6 md:space-y-8">
            <PreparationSteps
              currentStep={
                ["setup", "outline", "speech", "slides"].indexOf(activeStep) + 1
              }
              onPreviousStep={() => {
                const steps = [
                  "setup",
                  "outline",
                  "speech",
                  "slides",
                ] as StepType[];
                const currentIndex = steps.indexOf(activeStep);
                if (currentIndex > 0) {
                  navigateToStep(steps[currentIndex - 1]);
                }
              }}
              onNextStep={() => {
                const steps = [
                  "setup",
                  "outline",
                  "speech",
                  "slides",
                ] as StepType[];
                const currentIndex = steps.indexOf(activeStep);
                if (
                  currentIndex < steps.length - 1 &&
                  stepHistory.includes(steps[currentIndex + 1])
                ) {
                  navigateToStep(steps[currentIndex + 1]);
                }
              }}
            />

            <AIUsageMonitoring
              rateLimit={rateLimit}
              llmRequests={llmRequests}
              session={session}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
