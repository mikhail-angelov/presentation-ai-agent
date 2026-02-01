export type LLMRequest = {
  id: string;
  timestamp: Date;
  endpoint: string;
  status: "success" | "error" | "pending";
  tokensUsed: number;
  duration: number;
};

export type UserGuide = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

