import { useEffect, useState } from "react";
import { useSession } from "@/app/hooks/useSession";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useToast } from "@/app/contexts/ToastContext";
import { presentationActions, PresentationServiceOptions } from "./presentationActions";
import { IndexedDBService, indexedDBService, StepContentsAutoSaver } from "@/app/lib/services/indexedDBService";

import { StepContent, StepType } from "@/app/types/steps";
import { LLMRequest, RateLimit } from "@/app/types";


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
  | LoadPresentationAction;

// Action creators
export const actionCreators = {
  setActiveStep: (step: StepType): SetActiveStepAction => ({
    type: ActionType.SET_ACTIVE_STEP,
    payload: step,
  }),

  updateStepContent: (step: StepType, content: any): UpdateStepContentAction => ({
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

  setAbortController: (controller: AbortController | null): SetAbortControllerAction => ({
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

  setImageGenerationProgress: (
    progress: {
      isGenerating: boolean;
      current: number;
      total: number;
      currentPrompt: string;
    }
  ): SetImageGenerationProgressAction => ({
    type: ActionType.SET_IMAGE_GENERATION_PROGRESS,
    payload: progress,
  }),

  resetState: (): ResetStateAction => ({
    type: ActionType.RESET_STATE,
  }),

  loadPresentation: (
    stepContents: StepContent,
    generatedSlidesHTML?: string
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
      if (step === "setup" || step === "outline" || step === "speech" || step === "slides" || step === "htmlSlides") {
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

  constructor(initialState: AppState, reducer: (state: AppState, action: Action) => AppState) {
    this.state = initialState;
    this.reducer = reducer;
    
    // Initialize auto-saver for step contents
    if (typeof window !== "undefined" && IndexedDBService.isSupported()) {
      this.autoSaver = new StepContentsAutoSaver(async (stepContents, generatedSlidesHTML) => {
        try {
          await indexedDBService.saveStepContents(stepContents, generatedSlidesHTML);
        } catch (error) {
          console.error("Failed to auto-save step contents:", error);
        }
      });
      
      // Load saved step contents on initialization
      this.loadSavedStepContents();
    }
  }

  getState(): AppState {
    return this.state;
  }

  dispatch(action: Action): void {
    const previousState = this.state;
    this.state = this.reducer(this.state, action);
    
    // Auto-save step contents when they change
    if (action.type === ActionType.UPDATE_STEP_CONTENT || action.type === ActionType.LOAD_PRESENTATION) {
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
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Load saved step contents from IndexedDB
   */
  private async loadSavedStepContents(): Promise<void> {
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
      this.autoSaver.save(this.state.stepContents, this.state.generatedSlidesHTML).catch(error => {
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
} {
  const [state, setState] = useState(store.getState());
  const { session, trackAction } = useSession();
  const { t, currentLanguage } = useTranslation();
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });

    return unsubscribe;
  }, []);

  // Compose presentation options
  const presentationOptions: PresentationServiceOptions = {
    trackAction,
    addToast,
    t,
    currentLanguage,
    sessionActionsLength: session?.actions?.length,
  };

  return {
    ...state,
    presentationActions,
    presentationOptions,
  };
}
