"use client";

import { useState, useEffect, useRef } from "react";
import Header from "./components/shared/Header";
import PresentationSetup from "./components/presentation/PresentationSetup";
import UserGuides from "./components/presentation/UserGuides";
import PreparationSteps from "./components/presentation/PreparationSteps";
import AIUsageMonitoring from "./components/monitoring/AIUsageMonitoring";
import { LLMRequest, RateLimit } from "./types";
import { useSession } from "./hooks/useSession";

export default function Home() {
  const { session, trackAction } = useSession();
  const [presentationTopic, setPresentationTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [presentationDuration, setPresentationDuration] = useState("10");
  const [keyPoints, setKeyPoints] = useState<string[]>([""]);
  const [currentStep, setCurrentStep] = useState(0);
  const [llmRequests, setLlmRequests] = useState<LLMRequest[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimit>({
    used: 0,
    limit: 100,
    resetTime: Date.now() + 3600000,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [showContentModal, setShowContentModal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const addLLMRequest = (request: LLMRequest) => {
    setLlmRequests((prev) => [request, ...prev.slice(0, 9)]);
    setRateLimit((prev) => ({
      ...prev,
      used: Math.min(prev.used + 1, prev.limit),
    }));
  };

  const handleStartPresentation = async () => {
    if (!presentationTopic.trim()) {
      alert("Please enter a presentation topic first.");
      return;
    }

    setIsGenerating(true);
    setStreamingContent("");
    setGeneratedContent("");
    setCurrentStep(1);

    // Track presentation start in session
    trackAction("start_presentation", {
      topic: presentationTopic,
      audience: targetAudience,
      duration: presentationDuration,
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
          topic: presentationTopic,
          audience: targetAudience,
          duration: presentationDuration,
          keyPoints: keyPoints.filter((kp) => kp.trim() !== ""),
        }),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (data.success) {
        const content = data.content;
        const metadata = data.metadata;

        // Simulate streaming effect
        let displayedContent = "";
        const words = content.split(" ");
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          displayedContent += words[i] + " ";
          setStreamingContent(displayedContent);
        }

        setGeneratedContent(content);
        
        // Add to LLM requests
        const newRequest: LLMRequest = {
          id: requestId,
          timestamp: new Date(),
          endpoint: "/api/generate-content",
          status: "success",
          tokensUsed: metadata.tokensUsed,
          duration: duration,
        };
        addLLMRequest(newRequest);

        // Track successful generation in session
        trackAction(
          "generate_presentation_success",
          {
            topic: presentationTopic,
            audience: targetAudience,
            duration: presentationDuration,
          },
          {
            contentLength: content.length,
            tokensUsed: metadata.tokensUsed,
            sessionId: metadata.sessionId,
            newSessionCreated: metadata.newSessionCreated,
          },
          metadata.tokensUsed,
          duration
        );

        // Move to next step after streaming completes
        setTimeout(() => {
          setCurrentStep(2);
          setShowContentModal(true);
        }, 500);

      } else {
        // Track failed generation in session
        trackAction(
          "generate_presentation_error",
          {
            topic: presentationTopic,
            audience: targetAudience,
          },
          {
            error: data.error,
          },
          undefined,
          duration
        );

        const errorRequest: LLMRequest = {
          id: requestId,
          timestamp: new Date(),
          endpoint: "/api/generate-content",
          status: "error",
          tokensUsed: 0,
          duration: duration,
        };
        addLLMRequest(errorRequest);

        alert(`Error: ${data.error || "Failed to generate content"}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("Error generating content:", error);

      // Track network error in session
      trackAction(
        "generate_presentation_network_error",
        {
          topic: presentationTopic,
        },
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        undefined,
        duration
      );

      const errorRequest: LLMRequest = {
        id: requestId,
        timestamp: new Date(),
        endpoint: "/api/generate-content",
        status: "error",
        tokensUsed: 0,
        duration: duration,
      };
      addLLMRequest(errorRequest);

      alert("Failed to connect to AI service. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);

      // Track step progression in session
      trackAction("presentation_step", {
        fromStep: currentStep,
        toStep: currentStep + 1,
        totalSteps: 6,
      });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);

      // Track step back in session
      trackAction("presentation_step_back", {
        fromStep: currentStep,
        toStep: currentStep - 1,
      });
    }
  };

  const handleDownloadContent = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `presentation-${presentationTopic.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    alert("Content copied to clipboard!");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header session={session} />

        {/* Session Info Banner */}
        {session && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Session Active</span>
                <span className="mx-2">•</span>
                <span className="text-blue-600">
                  {session.actions.length} actions tracked
                </span>
                <span className="mx-2">•</span>
                <span className="text-blue-600">
                  Started {new Date(session.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-xs opacity-75">
                Session ID: {session.id.substring(0, 8)}...
              </div>
            </div>
          </div>
        )}

        {/* Streaming Content Display */}
        {isGenerating && (
          <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-gray-900">AI is generating your presentation...</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
              <div className="prose prose-blue max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-800">
                  {streamingContent}
                  {!streamingContent && "Starting AI generation..."}
                  <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                </pre>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Please wait while our AI creates a comprehensive presentation plan for you.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Input Form & User Guides */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <PresentationSetup
              presentationTopic={presentationTopic}
              setPresentationTopic={setPresentationTopic}
              targetAudience={targetAudience}
              setTargetAudience={setTargetAudience}
              presentationDuration={presentationDuration}
              setPresentationDuration={setPresentationDuration}
              keyPoints={keyPoints}
              setKeyPoints={setKeyPoints}
              onStartPresentation={handleStartPresentation}
            />

            <UserGuides />
          </div>

          {/* Right Column - Step-by-Step Flow & API Monitoring */}
          <div className="space-y-6 md:space-y-8">
            <PreparationSteps
              currentStep={currentStep}
              onPreviousStep={handlePreviousStep}
              onNextStep={handleNextStep}
            />

            <AIUsageMonitoring
              rateLimit={rateLimit}
              llmRequests={llmRequests}
              session={session}
            />
          </div>
        </div>

        {/* Generated Content Modal */}
        {showContentModal && generatedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Your AI-Generated Presentation</h3>
                  <p className="text-gray-600 mt-1">
                    Topic: {presentationTopic} | Audience: {targetAudience || "General"} | Duration: {presentationDuration} minutes
                  </p>
                </div>
                <button
                  onClick={() => setShowContentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div 
                  ref={contentRef}
                  className="prose prose-blue max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: generatedContent
                      .replace(/\n/g, '<br>')
                      .replace(/# (.*?)(\n|$)/g, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                      .replace(/## (.*?)(\n|$)/g, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
                      .replace(/### (.*?)(\n|$)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n\s*-\s*(.*?)(\n|$)/g, '<li class="ml-4 mb-1">$1</li>')
                      .replace(/\n\s*\d+\.\s*(.*?)(\n|$)/g, '<li class="ml-4 mb-1">$1</li>')
                  }}
                />
              </div>
              
              <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Ready for the next step? Your presentation outline is complete.
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyContent}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                    >
                      Copy Text
                    </button>
                    <button
                      onClick={handleDownloadContent}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      Download as Markdown
                    </button>
                    <button
                      onClick={() => {
                        setShowContentModal(false);
                        handleNextStep();
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                      Continue to Next Step
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
