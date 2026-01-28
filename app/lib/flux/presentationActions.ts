import { StepContent } from "@/app/types/steps";
import { dispatcher, dispatcherHelpers } from "./dispatcher";

export interface ImagePlaceholder {
  prompt: string;
  description: string;
  type: string;
}

export interface PresentationServiceOptions {
  trackAction: (action: string, data?: any, metadata?: any, tokensUsed?: number, duration?: number) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  t: (key: string, params?: Record<string, any>) => string;
  currentLanguage: string;
  sessionActionsLength?: number;
}

// Action creators for presentation service
export const presentationActions = {
  // Generate Outline
  async generateOutline(
    setup: StepContent['setup'],
    options: PresentationServiceOptions
  ): Promise<void> {
    const { topic, audience, duration, keyPoints } = setup;
    const { trackAction, addToast, t, currentLanguage, sessionActionsLength } = options;
    
    if (!topic.trim()) {
      addToast(t("toasts.enterTopicFirst"), "warning");
      return;
    }

    trackAction("start_presentation", {
      topic,
      audience,
      duration,
      keyPoints: keyPoints.filter((kp) => kp.trim() !== ""),
    });

    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    // Create abort controller and set it in state
    const abortController = new AbortController();
    
    // Set initial states
    dispatcher.setIsGenerating(true);
    dispatcher.setStreamingContent("");
    dispatcher.setAbortController(abortController);

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal: abortController.signal,
        body: JSON.stringify({
          topic,
          audience,
          duration,
          keyPoints: keyPoints.filter((kp) => kp.trim() !== ""),
          stepType: "outline",
          language: currentLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                fullContent += data.chunk;
                dispatcher.setStreamingContent(fullContent);
              }

              if (data.done) {
                const durationMs = Date.now() - startTime;
                dispatcherHelpers.updateStepContentWithHtmlSync("outline", data.content || fullContent);
                
                const newRequest = {
                  id: requestId,
                  timestamp: new Date(),
                  endpoint: "/api/generate-content",
                  status: "success" as const,
                  tokensUsed: data.tokensUsed || Math.floor(fullContent.length / 4),
                  duration: data.duration || durationMs,
                };
                dispatcherHelpers.addLLMRequestWithRateLimit(newRequest, sessionActionsLength);
                
                trackAction(
                  "generate_presentation_success",
                  {
                    topic,
                    audience,
                    duration,
                  },
                  {
                    contentLength: fullContent.length,
                    tokensUsed: data.tokensUsed || Math.floor(fullContent.length / 4),
                    sessionId: data.sessionId,
                    newSessionCreated: data.newSessionCreated,
                  },
                  data.tokensUsed || Math.floor(fullContent.length / 4),
                  data.duration || durationMs,
                );
                
                setTimeout(() => {
                  dispatcherHelpers.navigateToStep("outline");
                }, 500);
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error("Error generating content:", error);
      
      trackAction(
        "generate_presentation_network_error",
        {
          topic,
        },
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        undefined,
        durationMs,
      );
      
      const errorRequest = {
        id: requestId,
        timestamp: new Date(),
        endpoint: "/api/generate-content",
        status: "error" as const,
        tokensUsed: 0,
        duration: durationMs,
      };
      dispatcherHelpers.addLLMRequestWithRateLimit(errorRequest, sessionActionsLength);
      addToast(t("toasts.aiServiceFailed"), "error");
      throw error;
    } finally {
      dispatcher.setIsGenerating(false);
    }
  },

  // Generate Speech from Outline
  async generateSpeech(
    setup: StepContent['setup'],
    outline: string,
    options: PresentationServiceOptions
  ): Promise<void> {
    const { topic, audience, duration } = setup;
    const { trackAction, addToast, t, currentLanguage, sessionActionsLength } = options;
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    // Create abort controller and set it in state
    const abortController = new AbortController();
    
    // Set initial states
    dispatcher.setIsGenerating(true);
    dispatcher.setStreamingContent("");
    dispatcher.setAbortController(abortController);

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal: abortController.signal,
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                fullContent += data.chunk;
                dispatcher.setStreamingContent(fullContent);
              }

              if (data.done) {
                const durationMs = Date.now() - startTime;
                dispatcherHelpers.updateStepContentWithHtmlSync("speech", data.content || fullContent);
                
                const newRequest = {
                  id: requestId,
                  timestamp: new Date(),
                  endpoint: "/api/generate-content",
                  status: "success" as const,
                  tokensUsed: data.tokensUsed || Math.floor(fullContent.length / 4),
                  duration: data.duration || durationMs,
                };
                dispatcherHelpers.addLLMRequestWithRateLimit(newRequest, sessionActionsLength);
                
                trackAction(
                  "generate_speech_success",
                  {
                    topic,
                    outlineLength: outline.length,
                  },
                  {
                    contentLength: fullContent.length,
                    tokensUsed: data.tokensUsed || Math.floor(fullContent.length / 4),
                  },
                  data.tokensUsed || Math.floor(fullContent.length / 4),
                  data.duration || durationMs,
                );
                
                setTimeout(() => {
                  dispatcherHelpers.navigateToStep("speech");
                }, 500);
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error("Error generating speech:", error);
      
      trackAction(
        "generate_speech_network_error",
        {
          topic,
        },
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        undefined,
        durationMs,
      );
      
      const errorRequest = {
        id: requestId,
        timestamp: new Date(),
        endpoint: "/api/generate-content",
        status: "error" as const,
        tokensUsed: 0,
        duration: durationMs,
      };
      dispatcherHelpers.addLLMRequestWithRateLimit(errorRequest, sessionActionsLength);
      addToast(t("toasts.aiServiceFailed"), "error");
      throw error;
    } finally {
      dispatcher.setIsGenerating(false);
    }
  },

  // Generate Slides from Speech
  async generateSlides(
    setup: StepContent['setup'],
    speech: string,
    options: PresentationServiceOptions
  ): Promise<void> {
    const { topic, audience, duration } = setup;
    const { trackAction, addToast, t, currentLanguage, sessionActionsLength } = options;
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    // Create abort controller and set it in state
    const abortController = new AbortController();
    
    // Set initial states
    dispatcher.setIsGenerating(true);
    dispatcher.setStreamingContent("");
    dispatcher.setAbortController(abortController);

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal: abortController.signal,
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                fullContent += data.chunk;
                dispatcher.setStreamingContent(fullContent);
              }

              if (data.done) {
                const durationMs = Date.now() - startTime;
                dispatcherHelpers.updateStepContentWithHtmlSync("slides", data.content || fullContent);
                
                const newRequest = {
                  id: requestId,
                  timestamp: new Date(),
                  endpoint: "/api/generate-content",
                  status: "success" as const,
                  tokensUsed: data.tokensUsed || Math.floor(fullContent.length / 4),
                  duration: data.duration || durationMs,
                };
                dispatcherHelpers.addLLMRequestWithRateLimit(newRequest, sessionActionsLength);
                
                trackAction(
                  "generate_slides_success",
                  {
                    topic,
                    speechLength: speech.length,
                  },
                  {
                    contentLength: fullContent.length,
                    tokensUsed: data.tokensUsed || Math.floor(fullContent.length / 4),
                  },
                  data.tokensUsed || Math.floor(fullContent.length / 4),
                  data.duration || durationMs,
                );
                
                setTimeout(() => {
                  dispatcherHelpers.navigateToStep("slides");
                }, 500);
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error("Error generating slides:", error);
      
      trackAction(
        "generate_slides_network_error",
        {
          topic,
        },
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        undefined,
        durationMs,
      );
      
      const errorRequest = {
        id: requestId,
        timestamp: new Date(),
        endpoint: "/api/generate-content",
        status: "error" as const,
        tokensUsed: 0,
        duration: durationMs,
      };
      dispatcherHelpers.addLLMRequestWithRateLimit(errorRequest, sessionActionsLength);
      addToast(t("toasts.aiServiceFailed"), "error");
      throw error;
    } finally {
      dispatcher.setIsGenerating(false);
    }
  },

  // Complete Presentation - Generate HTML Slides
  async generateHtmlSlides(
    setup: StepContent['setup'],
    slidesContent: string,
    options: PresentationServiceOptions
  ): Promise<void> {
    const { topic, audience, duration } = setup;
    const { trackAction, addToast, t, currentLanguage } = options;

    addToast(t("toasts.generatingHtmlSlides"), "info");

    // Create abort controller and set it in state
    const abortController = new AbortController();
    
    // Set initial states
    dispatcher.setIsGenerating(true);
    dispatcher.setStreamingContent("");
    dispatcher.setAbortController(abortController);

    try {
      // Read example presentation HTML
      const templateResponse = await fetch("/presentation.html");
      const templateHtml = await templateResponse.text();
      const exampleResponse = await fetch("/example-slides.html");
      const exampleHtml = await exampleResponse.text();

      // Step 1: Generate HTML slides with placeholders
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: abortController.signal,
        body: JSON.stringify({
          topic,
          audience,
          duration,
          slidesContent,
          exampleHtml,
          templateHtml,
          language: currentLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let imagePlaceholders: ImagePlaceholder[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                fullContent += data.chunk;
                dispatcher.setStreamingContent(fullContent);
              } else if (data.type === "slides_generation_completed") {
                imagePlaceholders = data.placeholders || [];
                addToast(t("toasts.slidesGenerationCompleted") || "Slides generated, ready to generate images...", "info");
                
                dispatcherHelpers.updateStepContentWithHtmlSync("htmlSlides", fullContent);
                dispatcherHelpers.navigateToStep("htmlSlides");
                
                if (imagePlaceholders.length > 0) {
                  setTimeout(() => {
                    presentationActions.generateImages(fullContent, imagePlaceholders, options);
                  }, 1000);
                } else {
                  addToast(t("toasts.htmlSlidesGenerated"), "success");
                }
              } else if (data.type === "final_completion" && data.done) {
                const htmlContent = fullContent;
                dispatcherHelpers.updateStepContentWithHtmlSync("htmlSlides", htmlContent);

                trackAction("generate_slides_html_stream_success", {
                  topic,
                  htmlLength: htmlContent.length,
                  tokensUsed: data.tokensUsed,
                  duration: data.duration,
                });

                if (imagePlaceholders.length === 0) {
                  addToast(t("toasts.htmlSlidesGenerated"), "success");
                }
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating slides:", error);
      addToast(
        t("toasts.generateSlidesFailed", {
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        "error",
      );

      trackAction("generate_slides_html_stream_error", {
        topic: setup.topic,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      dispatcher.setIsGenerating(false);
    }
  },

  // Generate images for placeholders
  async generateImages(
    htmlContent: string,
    placeholders: ImagePlaceholder[],
    options: PresentationServiceOptions
  ): Promise<void> {
    const { addToast, t } = options;
    
    try {
      dispatcher.setImageGenerationProgress({
        isGenerating: true,
        current: 0,
        total: placeholders.length,
        currentPrompt: "",
      });
      
      addToast(t("toasts.imageGenerationStarted") || `Generating ${placeholders.length} images...`, "info");

      // Call the new image generation API to process all placeholders at once
      const response = await fetch("/api/generate-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          htmlContent: htmlContent,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.htmlContent) {
        // Update progress to show completion
        dispatcher.setImageGenerationProgress({
          isGenerating: false,
          current: result.imagesGenerated || 0,
          total: result.totalPlaceholders || placeholders.length,
          currentPrompt: "",
        });
        
        // Update the displayed HTML with all images
        dispatcherHelpers.updateStepContentWithHtmlSync("htmlSlides", result.htmlContent);
        dispatcher.setStreamingContent(result.htmlContent);
        
        addToast(t("toasts.imageGenerationCompleted") || `Generated ${result.imagesGenerated || 0} of ${result.totalPlaceholders || placeholders.length} images`, "success");
      } else {
        throw new Error(result.error || "Failed to generate images");
      }

    } catch (error) {
      console.error("Error in image generation:", error);
      addToast(
        t("toasts.imageGenerationFailed", {
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        "error",
      );
      
      dispatcher.setImageGenerationProgress({
        isGenerating: false,
        current: 0,
        total: 0,
        currentPrompt: "",
      });
      throw error;
    }
  },
};
     