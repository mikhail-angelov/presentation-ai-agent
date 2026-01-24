export type ContentStepType = keyof StepContent;
export type NavigationStepType = ContentStepType | "review";
export type StepType = NavigationStepType;

export interface StepContent {
  setup: {
    topic: string;
    audience: string;
    duration: string;
    keyPoints: string[];
  };
  outline: string;
  speech: string;
  slides: string;
  htmlSlides: string;
}

export const STEPS: StepType[] = ["setup", "outline", "speech", "slides", "htmlSlides"];

export type PresentationStep = {
  id: StepType;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  tips: string[];
};
