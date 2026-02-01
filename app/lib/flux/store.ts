import { useEffect, useState } from "react";
import {
  IndexedDBService,
  indexedDBService,
  StepContentsAutoSaver,
} from "@/app/lib/services/indexedDBService";

import { StepContent, StepType } from "@/app/types/steps";
import { LLMRequest } from "@/app/types";

export interface GenerateContentRequest {
  topic: string;
  audience: string;
  duration: string;
  keyPoints: string[];
  stepType: "outline" | "speech" | "slides";
  previousContent?: string;
  language: string;
}

// Common interface for generate content response
export interface GenerateContentResponse {
  chunk?: string;
  content?: string;
  done?: boolean;
  tokensUsed?: number;
  duration?: number;
  error?: string;
  sessionId?: string;
  newSessionCreated?: boolean;
}
export interface ImagePlaceholder {
  prompt: string;
  description: string;
  type: string;
}

// Session types moved from useSession.ts
export type SessionData = {
  id: string;
  userId?: string;
  createdAt: string;
  lastAccessed: string;
  actions: Array<{
    id: string;
    type: string;
    timestamp: string;
    endpoint?: string;
    tokensUsed?: number;
    duration?: number;
  }>;
  metadata: Record<string, any>;
  tokensUsed: number;
  mlRequestCount: number;
};

export type SessionStats = {
  totalActions: number;
  recentActions: Array<any>;
};

export const RATE_LIMIT = 10;

export interface AppState {
  // Step management
  activeStep: StepType;
  stepHistory: StepType[];
  stepContents: StepContent;

  // UI states
  llmRequests: LLMRequest[];
  isGenerating: boolean;
  streamingContent: string;
  abortController: AbortController | null;

  // Modal state for slides preview
  showSlidesModal: boolean;
  generatedSlidesHTML: string;

  // Image generation progress state
  imageGenerationProgress: {
    isGenerating: boolean;
    current: number;
    total: number;
    currentPrompt: string;
  };

  // Session state
  session: SessionData | null;
  sessionLoading: boolean;
  sessionError: string | null;
}

// Initial state
const initialState: AppState = {
  activeStep: "setup",
  stepHistory: ["setup"],
  stepContents: {
    setup: {
      topic: "",
      audience: "",
      duration: "10",
      keyPoints: [""],
    },
    outline: "",
    speech: "",
    slides: "",
    htmlSlides: "",
  },
  llmRequests: [],
  isGenerating: false,
  streamingContent: "",
  abortController: null,
  showSlidesModal: false,
  generatedSlidesHTML: "",
  imageGenerationProgress: {
    isGenerating: false,
    current: 0,
    total: 0,
    currentPrompt: "",
  },
  // Session state
  session: null,
  sessionLoading: true,
  sessionError: null,
};

// Action types
export enum ActionType {
  SET_ACTIVE_STEP = "SET_ACTIVE_STEP",
  UPDATE_STEP_CONTENT = "UPDATE_STEP_CONTENT",
  ADD_LLM_REQUEST = "ADD_LLM_REQUEST",
  SET_IS_GENERATING = "SET_IS_GENERATING",
  SET_STREAMING_CONTENT = "SET_STREAMING_CONTENT",
  SET_ABORT_CONTROLLER = "SET_ABORT_CONTROLLER",
  SET_SHOW_SLIDES_MODAL = "SET_SHOW_SLIDES_MODAL",
  SET_GENERATED_SLIDES_HTML = "SET_GENERATED_SLIDES_HTML",
  SET_IMAGE_GENERATION_PROGRESS = "SET_IMAGE_GENERATION_PROGRESS",
  RESET_STATE = "RESET_STATE",
  LOAD_PRESENTATION = "LOAD_PRESENTATION",
  // Session actions
  SET_SESSION = "SET_SESSION",
  SET_SESSION_LOADING = "SET_SESSION_LOADING",
  SET_SESSION_ERROR = "SET_SESSION_ERROR",
  UPDATE_SESSION = "UPDATE_SESSION",
}

// Action interfaces
interface SetActiveStepAction {
  type: ActionType.SET_ACTIVE_STEP;
  payload: StepType;
}

interface UpdateStepContentAction {
  type: ActionType.UPDATE_STEP_CONTENT;
  payload: {
    step: StepType;
    content: any;
  };
}

interface AddLLMRequestAction {
  type: ActionType.ADD_LLM_REQUEST;
  payload: LLMRequest;
}

interface SetIsGeneratingAction {
  type: ActionType.SET_IS_GENERATING;
  payload: boolean;
}

interface SetStreamingContentAction {
  type: ActionType.SET_STREAMING_CONTENT;
  payload: string;
}

interface SetAbortControllerAction {
  type: ActionType.SET_ABORT_CONTROLLER;
  payload: AbortController | null;
}

interface SetShowSlidesModalAction {
  type: ActionType.SET_SHOW_SLIDES_MODAL;
  payload: boolean;
}

interface SetGeneratedSlidesHTMLAction {
  type: ActionType.SET_GENERATED_SLIDES_HTML;
  payload: string;
}

interface SetImageGenerationProgressAction {
  type: ActionType.SET_IMAGE_GENERATION_PROGRESS;
  payload: {
    isGenerating: boolean;
    current: number;
    total: number;
    currentPrompt: string;
  };
}

interface ResetStateAction {
  type: ActionType.RESET_STATE;
}

interface LoadPresentationAction {
  type: ActionType.LOAD_PRESENTATION;
  payload: {
    stepContents: StepContent;
    generatedSlidesHTML?: string;
  };
}

// Session action interfaces
interface SetSessionAction {
  type: ActionType.SET_SESSION;
  payload: SessionData | null;
}

interface SetSessionLoadingAction {
  type: ActionType.SET_SESSION_LOADING;
  payload: boolean;
}

interface SetSessionErrorAction {
  type: ActionType.SET_SESSION_ERROR;
  payload: string | null;
}

interface UpdateSessionAction {
  type: ActionType.UPDATE_SESSION;
  payload: number;
}

export type Action =
  | SetActiveStepAction
  | UpdateStepContentAction
  | AddLLMRequestAction
  | SetIsGeneratingAction
  | SetStreamingContentAction
  | SetAbortControllerAction
  | SetShowSlidesModalAction
  | SetGeneratedSlidesHTMLAction
  | SetImageGenerationProgressAction
  | ResetStateAction
  | LoadPresentationAction
  | SetSessionAction
  | SetSessionLoadingAction
  | SetSessionErrorAction
  | UpdateSessionAction;

// Action creators
export const actionCreators = {
  setActiveStep: (step: StepType): SetActiveStepAction => ({
    type: ActionType.SET_ACTIVE_STEP,
    payload: step,
  }),

  updateStepContent: (
    step: StepType,
    content: any,
  ): UpdateStepContentAction => ({
    type: ActionType.UPDATE_STEP_CONTENT,
    payload: { step, content },
  }),

  addLLMRequest: (request: LLMRequest): AddLLMRequestAction => ({
    type: ActionType.ADD_LLM_REQUEST,
    payload: request,
  }),

  setIsGenerating: (isGenerating: boolean): SetIsGeneratingAction => ({
    type: ActionType.SET_IS_GENERATING,
    payload: isGenerating,
  }),

  setStreamingContent: (content: string): SetStreamingContentAction => ({
    type: ActionType.SET_STREAMING_CONTENT,
    payload: content,
  }),

  setAbortController: (
    controller: AbortController | null,
  ): SetAbortControllerAction => ({
    type: ActionType.SET_ABORT_CONTROLLER,
    payload: controller,
  }),

  setShowSlidesModal: (show: boolean): SetShowSlidesModalAction => ({
    type: ActionType.SET_SHOW_SLIDES_MODAL,
    payload: show,
  }),

  setGeneratedSlidesHTML: (html: string): SetGeneratedSlidesHTMLAction => ({
    type: ActionType.SET_GENERATED_SLIDES_HTML,
    payload: html,
  }),

  setImageGenerationProgress: (progress: {
    isGenerating: boolean;
    current: number;
    total: number;
    currentPrompt: string;
  }): SetImageGenerationProgressAction => ({
    type: ActionType.SET_IMAGE_GENERATION_PROGRESS,
    payload: progress,
  }),

  resetState: (): ResetStateAction => ({
    type: ActionType.RESET_STATE,
  }),

  loadPresentation: (
    stepContents: StepContent,
    generatedSlidesHTML?: string,
  ): LoadPresentationAction => ({
    type: ActionType.LOAD_PRESENTATION,
    payload: { stepContents, generatedSlidesHTML },
  }),
};

// Reducer
function reducer(state: AppState = initialState, action: Action): AppState {
  switch (action.type) {
    case ActionType.SET_ACTIVE_STEP:
      return {
        ...state,
        activeStep: action.payload,
        stepHistory: state.stepHistory.includes(action.payload)
          ? state.stepHistory
          : [...state.stepHistory, action.payload],
      };

    case ActionType.UPDATE_STEP_CONTENT:
      const { step, content } = action.payload;

      // Type-safe update of stepContents
      const newStepContents = { ...state.stepContents };

      // Only update if step is a valid key of StepContent
      if (
        step === "setup" ||
        step === "outline" ||
        step === "speech" ||
        step === "slides" ||
        step === "htmlSlides"
      ) {
        newStepContents[step] = content;
      }

      // Also update generatedSlidesHTML if htmlSlides is being updated
      let newGeneratedSlidesHTML = state.generatedSlidesHTML;
      if (step === "htmlSlides" && typeof content === "string") {
        newGeneratedSlidesHTML = content;
      }

      return {
        ...state,
        stepContents: newStepContents,
        generatedSlidesHTML: newGeneratedSlidesHTML,
      };

    case ActionType.ADD_LLM_REQUEST:
      return {
        ...state,
        llmRequests: [action.payload, ...state.llmRequests.slice(0, 9)],
      };

    case ActionType.SET_IS_GENERATING:
      return {
        ...state,
        isGenerating: action.payload,
      };

    case ActionType.SET_STREAMING_CONTENT:
      return {
        ...state,
        streamingContent: action.payload,
      };

    case ActionType.SET_ABORT_CONTROLLER:
      return {
        ...state,
        abortController: action.payload,
      };

    case ActionType.SET_SHOW_SLIDES_MODAL:
      return {
        ...state,
        showSlidesModal: action.payload,
      };

    case ActionType.SET_GENERATED_SLIDES_HTML:
      return {
        ...state,
        generatedSlidesHTML: action.payload,
      };

    case ActionType.SET_IMAGE_GENERATION_PROGRESS:
      return {
        ...state,
        imageGenerationProgress: action.payload,
      };

    case ActionType.RESET_STATE:
      return { ...initialState };

    case ActionType.LOAD_PRESENTATION:
      const { stepContents, generatedSlidesHTML } = action.payload;

      // Recompose stepHistory based on stepContents
      const newStepHistory: StepType[] = ["setup"];

      // Check each step for content
      if (stepContents.outline && stepContents.outline.trim() !== "") {
        newStepHistory.push("outline");
      }
      if (stepContents.speech && stepContents.speech.trim() !== "") {
        newStepHistory.push("speech");
      }
      if (stepContents.slides && stepContents.slides.trim() !== "") {
        newStepHistory.push("slides");
      }
      if (stepContents.htmlSlides && stepContents.htmlSlides.trim() !== "") {
        newStepHistory.push("htmlSlides");
      }

      return {
        ...state,
        stepContents,
        generatedSlidesHTML: generatedSlidesHTML || "",
        activeStep: "setup",
        stepHistory: newStepHistory,
      };

    // Session actions
    case ActionType.SET_SESSION:
      return {
        ...state,
        session: action.payload,
        sessionLoading: false,
        sessionError: null,
      };

    case ActionType.SET_SESSION_LOADING:
      return {
        ...state,
        sessionLoading: action.payload,
      };

    case ActionType.SET_SESSION_ERROR:
      return {
        ...state,
        sessionError: action.payload,
        sessionLoading: false,
      };

    case ActionType.UPDATE_SESSION:
      const session = state.session;
      if (session) {
        session.mlRequestCount += 1;
        session.tokensUsed += action.payload;
        session.lastAccessed = new Date().toISOString();
      }
      return {
        ...state,
        session,
      };

    default:
      return state;
  }
}

// Store class
class Store {
  private state: AppState;
  private listeners: Array<() => void> = [];
  private reducer: (state: AppState, action: Action) => AppState;
  private autoSaver: StepContentsAutoSaver | null = null;

  constructor(
    initialState: AppState,
    reducer: (state: AppState, action: Action) => AppState,
  ) {
    this.state = initialState;
    this.reducer = reducer;

    // Initialize auto-saver for step contents
    if (typeof window !== "undefined" && IndexedDBService.isSupported()) {
      this.autoSaver = new StepContentsAutoSaver(
        async (stepContents, generatedSlidesHTML) => {
          try {
            await indexedDBService.saveStepContents(
              stepContents,
              generatedSlidesHTML,
            );
          } catch (error) {
            console.error("Failed to auto-save step contents:", error);
          }
        },
      );
    }
  }

  getState(): AppState {
    return this.state;
  }

  dispatch(action: Action): void {
    const previousState = this.state;
    this.state = this.reducer(this.state, action);

    // Auto-save step contents when they change
    if (
      action.type === ActionType.UPDATE_STEP_CONTENT ||
      action.type === ActionType.LOAD_PRESENTATION
    ) {
      this.autoSaveStepContents();
    }

    // Clear saved data on reset
    if (action.type === ActionType.RESET_STATE) {
      this.clearSavedStepContents();
    }

    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Load saved step contents from IndexedDB
   */
  async loadSavedStepContents(): Promise<void> {
    try {
      const savedData = await indexedDBService.loadStepContents();
      if (savedData) {
        // Dispatch LOAD_PRESENTATION action to update state with saved data
        const loadAction: LoadPresentationAction = {
          type: ActionType.LOAD_PRESENTATION,
          payload: savedData,
        };
        this.dispatch(loadAction);
      }
    } catch (error) {
      console.error("Failed to load saved step contents:", error);
    }
  }

  /**
   * Auto-save current step contents
   */
  private autoSaveStepContents(): void {
    if (this.autoSaver) {
      this.autoSaver
        .save(this.state.stepContents, this.state.generatedSlidesHTML)
        .catch((error) => {
          console.error("Failed to auto-save step contents:", error);
        });
    }
  }

  /**
   * Clear saved step contents from IndexedDB
   */
  private async clearSavedStepContents(): Promise<void> {
    try {
      await indexedDBService.clearStepContents();
    } catch (error) {
      console.error("Failed to clear saved step contents:", error);
    }
  }

  async generateContent(
    request: GenerateContentRequest,
    step: "outline" | "speech" | "slides",
  ): Promise<void> {
    const {
      topic,
      audience,
      duration,
      keyPoints,
      stepType,
      previousContent,
      language,
    } = request;

    if (step === "outline") {
      this.trackAction("start_generate-content", {
        topic,
        audience,
        duration,
        keyPoints: keyPoints.filter((kp) => kp.trim() !== ""),
      });
    }

    // Create abort controller and set it in state
    const abortController = new AbortController();

    // Set initial states
    this.dispatch({ type: ActionType.SET_STREAMING_CONTENT, payload: "" });
    this.dispatch({ type: ActionType.SET_IS_GENERATING, payload: true });
    this.dispatch({
      type: ActionType.SET_ABORT_CONTROLLER,
      payload: abortController,
    });

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
                this.dispatch({
                  type: ActionType.SET_STREAMING_CONTENT,
                  payload: fullContent,
                });
              }

              if (data.done) {
                const content = data.content || fullContent;
                this.dispatch({
                  type: ActionType.UPDATE_STEP_CONTENT,
                  payload: { step, content },
                });
                this.dispatch({
                  type: ActionType.UPDATE_SESSION,
                  payload: content.length / 4,
                });

                setTimeout(() => {
                  this.dispatch({
                    type: ActionType.SET_ACTIVE_STEP,
                    payload: step,
                  });
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
      console.error(`Error generating ${step}:`, error);
      throw error;
    } finally {
      this.dispatch({ type: ActionType.SET_IS_GENERATING, payload: false });
    }
  }
  //actions
  async generateOutline(
    setup: StepContent["setup"],
    language: string,
  ): Promise<void> {
    const { topic, audience, duration, keyPoints } = setup;

    const request: GenerateContentRequest = {
      topic,
      audience,
      duration,
      keyPoints: keyPoints.filter((kp) => kp.trim() !== ""),
      stepType: "outline",
      language,
    };

    await this.generateContent(request, "outline");
  }

  async generateSpeech(
    setup: StepContent["setup"],
    outline: string,
    language: string,
  ): Promise<void> {
    const { topic, audience, duration } = setup;

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
      language,
    };

    await this.generateContent(request, "speech");
  }

  async generateSlides(
    setup: StepContent["setup"],
    speech: string,
    language: string,
  ): Promise<void> {
    const { topic, audience, duration } = setup;

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
      language,
    };

    await this.generateContent(request, "slides");
  }

  async generateHtmlSlides(
    setup: StepContent["setup"],
    slidesContent: string,
    language: string,
  ): Promise<{ fullContent: string; imagePlaceholders: ImagePlaceholder[] }> {
    const { topic, audience, duration } = setup;

    // Create abort controller and set it in state
    const abortController = new AbortController();

    // Set initial states
    this.dispatch({ type: ActionType.SET_IS_GENERATING, payload: true });
    this.dispatch({ type: ActionType.SET_STREAMING_CONTENT, payload: "" });
    this.dispatch({
      type: ActionType.SET_ABORT_CONTROLLER,
      payload: abortController,
    });

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
                this.dispatch({
                  type: ActionType.SET_STREAMING_CONTENT,
                  payload: tempContent,
                });
              } else if (data.type === "content_chunk" && data.fullChunk) {
                fullContent += data.fullChunk;
                this.dispatch({
                  type: ActionType.SET_STREAMING_CONTENT,
                  payload: fullContent,
                });
              } else if (data.type === "final_completion" && data.done) {
                const htmlContent = fullContent;
                this.dispatch({
                  type: ActionType.UPDATE_STEP_CONTENT,
                  payload: { step: "htmlSlides", content: htmlContent },
                });
                this.dispatch({
                  type: ActionType.UPDATE_SESSION,
                  payload: htmlContent.length / 4,
                });
                imagePlaceholders = data.imagePlaceholders;
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

      this.dispatch({
        type: ActionType.SET_ACTIVE_STEP,
        payload: "htmlSlides",
      });

      return { imagePlaceholders: imagePlaceholders || [], fullContent };
    } catch (error) {
      console.error("Error generating slides:", error);

      throw error;
    } finally {
      this.dispatch({ type: ActionType.SET_IS_GENERATING, payload: false });
    }
  }

  async generateImages(
    htmlContent: string,
    placeholders: ImagePlaceholder[],
  ): Promise<void> {
    try {
      this.dispatch({
        type: ActionType.SET_IMAGE_GENERATION_PROGRESS,
        payload: {
          isGenerating: true,
          current: 0,
          total: 1,
          currentPrompt: "",
        },
      });

      let processedHtml = htmlContent;
      let imagesGenerated = 0;

      // Process only first one
      for (let i = 0; i < 1; i++) {
        const placeholder = placeholders[i];

        // Update progress for current placeholder
        this.dispatch({
          type: ActionType.SET_IMAGE_GENERATION_PROGRESS,
          payload: {
            isGenerating: true,
            current: i,
            total: 1,
            currentPrompt: placeholder.prompt,
          },
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
            this.dispatch({
              type: ActionType.UPDATE_STEP_CONTENT,
              payload: { step: "htmlSlides", content: processedHtml },
            });
            this.dispatch({
              type: ActionType.SET_STREAMING_CONTENT,
              payload: processedHtml,
            });

            console.log(
              `✅ Generated image ${i + 1}/${placeholders.length}: "${placeholder.prompt}"`,
            );
          } else {
            console.error(
              `❌ Failed to generate image ${i + 1}:`,
              result.error,
            );
          }
        } catch (error) {
          console.error(`❌ Error generating image ${i + 1}:`, error);
          // Continue with next placeholder even if one fails
        }
      }

      // Update progress to show completion
      this.dispatch({
        type: ActionType.SET_IMAGE_GENERATION_PROGRESS,
        payload: {
          isGenerating: false,
          current: 1,
          total: 1,
          currentPrompt: "",
        },
      });

      // Track completion
      this.trackAction("image_generation_completed", {
        totalPlaceholders: placeholders.length,
        imagesGenerated,
      });
    } catch (error) {
      console.error("Error in image generation:", error);

      this.dispatch({
        type: ActionType.SET_IMAGE_GENERATION_PROGRESS,
        payload: {
          isGenerating: false,
          current: 0,
          total: 0,
          currentPrompt: "",
        },
      });
      throw error;
    }
  }

  // Track user action
  async trackAction(type: string, data?: Record<string, any>) {
    if (!this.state.session) return;

    try {
      const action = {
        type,
        timestamp: new Date().toISOString(),
        data,
      };

      const response = await fetch("/api/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(action),
      });
    } catch (err) {
      console.error("Failed to track action:", err);
    }
  }
}

// Create singleton store instance
export const store = new Store(initialState, reducer);

// Initialize or get existing session
const initializeSession = async () => {
  try {
    store.dispatch({
      type: ActionType.SET_SESSION_LOADING,
      payload: true,
    });

    const response = await fetch("/api/sessions", {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 404) {
      // No session exists, create a new one
      const createResponse = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            initializedAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
          },
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create session");
      }

      const data = await createResponse.json();
      store.dispatch({
        type: ActionType.SET_SESSION,
        payload: data.session,
      });
    } else if (response.ok) {
      const data = await response.json();
      store.dispatch({
        type: ActionType.SET_SESSION,
        payload: data.session,
      });
    } else {
      throw new Error("Failed to get session");
    }
  } catch (err) {
    store.dispatch({
      type: ActionType.SET_SESSION_ERROR,
      payload: err instanceof Error ? err.message : "Unknown error",
    });
    console.error("Session initialization error:", err);
  }
};

// Hook for React components
export function useStore(): AppState & {
  trackAction: (
    type: string,
    data?: Record<string, any>,
    result?: Record<string, any>,
    tokensUsed?: number,
    duration?: number,
  ) => Promise<void>;
  // Store actions
  generateOutline: (
    setup: StepContent["setup"],
    language: string,
  ) => Promise<void>;
  generateSpeech: (
    setup: StepContent["setup"],
    outline: string,
    language: string,
  ) => Promise<void>;
  generateSlides: (
    setup: StepContent["setup"],
    speech: string,
    language: string,
  ) => Promise<void>;
  generateHtmlSlides: (
    setup: StepContent["setup"],
    slidesContent: string,
    language: string,
  ) => Promise<{ fullContent: string; imagePlaceholders: ImagePlaceholder[] }>;
  generateImages: (
    htmlContent: string,
    placeholders: ImagePlaceholder[],
  ) => Promise<void>;
} {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });

    // Load saved step contents on initialization
    store.loadSavedStepContents();

    // Initialize session on mount
    initializeSession();

    return unsubscribe;
  }, []);

  return {
    ...state,
    trackAction: store.trackAction.bind(store),
    generateOutline: store.generateOutline.bind(store),
    generateSpeech: store.generateSpeech.bind(store),
    generateSlides: store.generateSlides.bind(store),
    generateHtmlSlides: store.generateHtmlSlides.bind(store),
    generateImages: store.generateImages.bind(store),
  };
}
