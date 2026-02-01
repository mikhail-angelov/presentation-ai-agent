import { StepContent } from "@/app/types/steps";

export interface PresentationServiceOptions {
  trackAction: (action: string, data?: any, metadata?: any, tokensUsed?: number, duration?: number) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  t: (key: string, params?: Record<string, any>) => string;
  currentLanguage: string;
}

// Common interface for generate content request
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

// Action creators for presentation service
export const presentationActions = {
  // This file now only contains interfaces and types
  // All action implementations have been moved to store.ts
};
