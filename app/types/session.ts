export const SESSION_COOKIE_NAME = 'prez_ai_session';

export type Session = {
  id: string;
  userId?: string;
  createdAt: Date;
  lastAccessed: Date;
  userAgent?: string;
  ipAddress?: string;
  actions: UserAction[];
  metadata: Record<string, any>;
};

export type UserAction = {
  id: string;
  type: string;
  timestamp: Date;
  endpoint?: string;
  data?: Record<string, any>;
  result?: Record<string, any>;
  tokensUsed?: number;
  duration?: number;
};

export type CreateSessionRequest = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  metadata?: Record<string, any>;
};

export type UpdateSessionRequest = {
  action?: UserAction;
  metadata?: Record<string, any>;
};

export type SessionResponse = {
  session: Session;
  cookie: string;
};
