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

// Common interface for generate content request
interface GenerateContentRequest {
  topic: string;
  audience: string;
  duration: string;
  keyPoints: string[];
  stepType: "outline" | "speech" | "slides";
  previousContent?: string;
  language: string;
}

// Common interface for generate content response
interface GenerateContentResponse {
  chunk?: string;
  content?: string;
  done?: boolean;
  tokensUsed?: number;
  duration?: number;
  error?: string;
  sessionId?: string;
  newSessionCreated?: boolean;
}

// Common function for generating content via /api/generate-content
async function generateContent(
  request: GenerateContentRequest,
  options: PresentationServiceOptions,
  step: "outline" | "speech" | "slides",
  successAction: string,
  errorAction: string,
  additionalData?: Record<string, any>
): Promise<void> {
  const { topic, audience, duration, keyPoints, stepType, previousContent, language } = request;
  const { trackAction, addToast, t, sessionActionsLength } = options;
  
  if (step === "outline" && !topic.trim()) {
    addToast(t("toasts.enterTopicFirst"), "warning");
    return;
  }

  if (step === "outline") {
    trackAction("start_presentation", {
      topic,
      audience,
      duration,
      keyPoints: keyPoints.filter((kp) => kp.trim() !== ""),
    });
  }

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
        stepType,
        previousContent,
        language,
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
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      buffer += chunk;
      
      // Process complete lines
      const lines = buffer.split("\n");
      // Keep the last incomplete line in buffer
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data: GenerateContentResponse = JSON.parse(line.slice(6));

            if (data.chunk) {
              fullContent += data.chunk;
              dispatcher.setStreamingContent(fullContent);
            }

            if (data.done) {
              const durationMs = Date.now() - startTime;
              dispatcherHelpers.updateStepContentWithHtmlSync(step, data.content || fullContent);
              
              const newRequest = {
                id: requestId,
                timestamp: new Date(),
                endpoint: "/api/generate-content",
                status: "success" as const,
                tokensUsed: data.tokensUsed || Math.floor(fullContent.length / 4),
                duration: data.duration || durationMs,
              };
              dispatcherHelpers.addLLMRequestWithRateLimit(newRequest, sessionActionsLength);
              
              const trackData = {
                topic,
                ...additionalData,
              };
              
              const resultData = {
                contentLength: fullContent.length,
                tokensUsed: data.tokensUsed || Math.floor(fullContent.length / 4),
                ...(data.sessionId && { sessionId: data.sessionId }),
                ...(data.newSessionCreated && { newSessionCreated: data.newSessionCreated }),
              };
              
              trackAction(
                successAction,
                trackData,
                resultData,
                data.tokensUsed || Math.floor(fullContent.length / 4),
                data.duration || durationMs,
              );
              
              setTimeout(() => {
                dispatcherHelpers.navigateToStep(step);
              }, 500);
            }

            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
            // Don't throw here, just log and continue
            // The error might be due to incomplete JSON that will be completed in next chunk
          }
        }
      }
    }
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`Error generating ${step}:`, error);
    
    trackAction(
      errorAction,
      {
        topic,
        ...additionalData,
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
}

// Action creators for presentation service
export const presentationActions = {
  // Generate Outline
  async generateOutline(
    setup: StepContent['setup'],
    options: PresentationServiceOptions
  ): Promise<void> {
    const { topic, audience, duration, keyPoints } = setup;
    const { currentLanguage } = options;
    
    const request: GenerateContentRequest = {
      topic,
      audience,
      duration,
      keyPoints: keyPoints.filter((kp) => kp.trim() !== ""),
      stepType: "outline",
      language: currentLanguage,
    };
    
    await generateContent(
      request,
      options,
      "outline",
      "generate_presentation_success",
      "generate_presentation_network_error",
      {
        audience,
        duration,
      }
    );
  },

  // Generate Speech from Outline
  async generateSpeech(
    setup: StepContent['setup'],
    outline: string,
    options: PresentationServiceOptions
  ): Promise<void> {
    const { topic, audience, duration } = setup;
    const { currentLanguage } = options;
    
    const request: GenerateContentRequest = {
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
    };
    
    await generateContent(
      request,
      options,
      "speech",
      "generate_speech_success",
      "generate_speech_network_error",
      {
        outlineLength: outline.length,
      }
    );
  },

  // Generate Slides from Speech
  async generateSlides(
    setup: StepContent['setup'],
    speech: string,
    options: PresentationServiceOptions
  ): Promise<void> {
    const { topic, audience, duration } = setup;
    const { currentLanguage } = options;
    
    const request: GenerateContentRequest = {
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
    };
    
    await generateContent(
      request,
      options,
      "slides",
      "generate_slides_success",
      "generate_slides_network_error",
      {
        speechLength: speech.length,
      }
    );
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
      let tempContent = "";
      let fullContent = "";
      let imagePlaceholders: ImagePlaceholder[] = [];
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        buffer += chunk;
        
        // Process complete lines
        const lines = buffer.split("\n");
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                tempContent += data.chunk;
                dispatcher.setStreamingContent(tempContent);
              } else if (data.type === "content_chunk" && data.fullChunk) {
                fullContent += data.fullChunk;
                dispatcher.setStreamingContent(fullContent);
              } else if (data.type === "final_completion" && data.done) {
                const htmlContent = fullContent;
                dispatcherHelpers.updateStepContentWithHtmlSync("htmlSlides", htmlContent);
                imagePlaceholders = data.imagePlaceholders;

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
              // Don't throw here, just log and continue
              // The error might be due to incomplete JSON that will be completed in next chunk
            }
          }
        }
      }
      
      dispatcherHelpers.navigateToStep("htmlSlides");
      
      if (imagePlaceholders.length > 0) {
        setTimeout(() => {
          presentationActions.generateImages(fullContent, imagePlaceholders, options);
        }, 1000);
      } else {
        addToast(t("toasts.htmlSlidesGenerated"), "success");
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

  // Generate images for placeholders - one by one
  async generateImages(
    htmlContent: string,
    placeholders: ImagePlaceholder[],
    options: PresentationServiceOptions
  ): Promise<void> {
    const { addToast, t, trackAction } = options;
    
    try {
      dispatcher.setImageGenerationProgress({
        isGenerating: true,
        current: 0,
        total: placeholders.length,
        currentPrompt: "",
      });
      
      addToast(t("toasts.imageGenerationStarted") || `Generating ${placeholders.length} images...`, "info");

      let processedHtml = htmlContent;
      let imagesGenerated = 0;

      // Process each placeholder one by one
      for (let i = 0; i < placeholders.length; i++) {
        const placeholder = placeholders[i];
        
        // Update progress for current placeholder
        dispatcher.setImageGenerationProgress({
          isGenerating: true,
          current: i,
          total: placeholders.length,
          currentPrompt: placeholder.prompt,
        });

        try {
          // Call API to generate single image
          const response = await fetch("/api/generate-images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              htmlContent: processedHtml,
              placeholderIndex: i,
              placeholder: {
                prompt: placeholder.prompt,
                description: placeholder.description,
                type: placeholder.type,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.success && result.htmlContent) {
            processedHtml = result.htmlContent;
            imagesGenerated++;
            
            // Update the displayed HTML after each image
            dispatcherHelpers.updateStepContentWithHtmlSync("htmlSlides", processedHtml);
            dispatcher.setStreamingContent(processedHtml);
            
            console.log(`✅ Generated image ${i + 1}/${placeholders.length}: "${placeholder.prompt}"`);
          } else {
            console.error(`❌ Failed to generate image ${i + 1}:`, result.error);
          }
        } catch (error) {
          console.error(`❌ Error generating image ${i + 1}:`, error);
          // Continue with next placeholder even if one fails
        }
      }

      // Update progress to show completion
      dispatcher.setImageGenerationProgress({
        isGenerating: false,
        current: placeholders.length,
        total: placeholders.length,
        currentPrompt: "",
      });
      
      addToast(t("toasts.imageGenerationCompleted") || `Generated ${imagesGenerated} of ${placeholders.length} images`, "success");
      
      // Track completion
      if (trackAction) {
        trackAction("image_generation_completed", {
          totalPlaceholders: placeholders.length,
          imagesGenerated,
        });
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
     