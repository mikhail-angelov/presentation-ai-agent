import { useEffect, useState } from "react";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useToast } from "@/app/contexts/ToastContext";
import {
  presentationActions,
  PresentationServiceOptions,
} from "./presentationActions";
import {
  IndexedDBService,
  indexedDBService,
  StepContentsAutoSaver,
} from "@/app/lib/services/indexedDBService";

import { StepContent, StepType } from "@/app/types/steps";
import { LLMRequest, RateLimit } from "@/app/types";

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

export interface AppState {
  // Step management
  activeStep: StepType;
  stepHistory: StepType[];
  stepContents: StepContent;

  // UI states
  llmRequests: LLMRequest[];
  rateLimit: RateLimit;
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
  rateLimit: {
    used: 0,
    limit: 10,
    tokensUsed: 0,
  },
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
  SET_RATE_LIMIT = "SET_RATE_LIMIT",
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

interface SetRateLimitAction {
  type: ActionType.SET_RATE_LIMIT;
  payload: RateLimit;
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
  payload: SessionData;
}

export type Action =
  | SetActiveStepAction
  | UpdateStepContentAction
  | AddLLMRequestAction
  | SetRateLimitAction
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

  setRateLimit: (rateLimit: RateLimit): SetRateLimitAction => ({
    type: ActionType.SET_RATE_LIMIT,
    payload: rateLimit,
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

    case ActionType.SET_RATE_LIMIT:
      return {
        ...state,
        rateLimit: action.payload,
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
      return {
        ...state,
        session: action.payload,
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
}

// Create singleton store instance
export const store = new Store(initialState, reducer);

// Hook for React components

export function useStore(): AppState & {
  presentationActions: typeof presentationActions;
  presentationOptions: PresentationServiceOptions;
  trackAction: (
    type: string,
    data?: Record<string, any>,
    result?: Record<string, any>,
    tokensUsed?: number,
    duration?: number
  ) => Promise<void>;
} {
  const [state, setState] = useState(store.getState());
  const { t, currentLanguage } = useTranslation();
  const { addToast } = useToast();

  // Initialize or get existing session
  const initializeSession = async () => {
    try {
      store.dispatch({
        type: ActionType.SET_SESSION_LOADING,
        payload: true,
      });

      const response = await fetch('/api/sessions', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 404) {
        // No session exists, create a new one
        const createResponse = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            metadata: {
              initializedAt: new Date().toISOString(),
              userAgent: navigator.userAgent,
            },
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create session');
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
        throw new Error('Failed to get session');
      }
    } catch (err) {
      store.dispatch({
        type: ActionType.SET_SESSION_ERROR,
        payload: err instanceof Error ? err.message : 'Unknown error',
      });
      console.error('Session initialization error:', err);
    }
  };

  // Track user action
  const trackAction = async (
    type: string,
    data?: Record<string, any>,
    result?: Record<string, any>,
    tokensUsed?: number,
    duration?: number
  ) => {
    if (!state.session) return;
    
    try {
      const action = {
        type,
        timestamp: new Date().toISOString(),
        data,
        result,
        tokensUsed,
        duration,
      };

      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const updated = await response.json();
        store.dispatch({
          type: ActionType.UPDATE_SESSION,
          payload: updated.session,
        });
      }
    } catch (err) {
      console.error('Failed to track action:', err);
    }
  };

  // Update session metadata
  const updateMetadata = async (metadata: Record<string, any>) => {
    if (!state.session) return;

    try {
      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ metadata }),
      });

      if (response.ok) {
        const updated = await response.json();
        store.dispatch({
          type: ActionType.UPDATE_SESSION,
          payload: updated.session,
        });
      }
    } catch (err) {
      console.error('Failed to update metadata:', err);
    }
  };

  // Clear session (logout)
  const clearSession = async () => {
    try {
      await fetch('/api/sessions', {
        method: 'DELETE',
        credentials: 'include',
      });
      store.dispatch({
        type: ActionType.SET_SESSION,
        payload: null,
      });
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  };

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

  // Compose presentation options
  const presentationOptions: PresentationServiceOptions = {
    trackAction,
    addToast,
    t,
    currentLanguage,
    sessionActionsLength: state.session?.actions?.length,
  };

  return {
    ...state,
    presentationActions,
    presentationOptions,
    trackAction,
  };
}
