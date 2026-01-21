export type StepType = keyof StepContent;

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
}

export const STEPS: StepType[] = ["setup", "outline", "speech", "slides"];

export type PresentationStep = {
  id: StepType;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  tips: string[];
};