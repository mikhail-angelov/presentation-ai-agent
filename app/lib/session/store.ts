import { Session, UserAction, CreateSessionRequest, UpdateSessionRequest } from '@/app/types/session';

// In-memory session store (in production, use Redis, database, etc.)
class SessionStore {
  private sessions: Map<string, Session> = new Map();
  private sessionExpiry: Map<string, NodeJS.Timeout> = new Map();
  private readonly SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days (fits in 32-bit signed integer)

  createSession(request: CreateSessionRequest): Session {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    const session: Session = {
      id: sessionId,
      userId: request.userId,
      createdAt: now,
      lastAccessed: now,
      userAgent: request.userAgent,
      ipAddress: request.ipAddress,
      actions: [],
      metadata: request.metadata || {},
    };

    this.sessions.set(sessionId, session);
    this.setExpiry(sessionId);
    
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessed = new Date();
      this.setExpiry(sessionId);
    }
    return session;
  }

  updateSession(sessionId: string, request: UpdateSessionRequest): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }

    session.lastAccessed = new Date();
    
    if (request.action) {
      session.actions.push(request.action);
      // Keep only last 100 actions to prevent memory issues
      if (session.actions.length > 100) {
        session.actions = session.actions.slice(-100);
      }
    }

    if (request.metadata) {
      session.metadata = { ...session.metadata, ...request.metadata };
    }

    this.setExpiry(sessionId);
    return session;
  }

  deleteSession(sessionId: string): boolean {
    this.clearExpiry(sessionId);
    return this.sessions.delete(sessionId);
  }

  getUserSessions(userId: string): Session[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
  }

  getSessionActions(sessionId: string, limit = 50): UserAction[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    return session.actions.slice(-limit);
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setExpiry(sessionId: string): void {
    // Clear existing expiry
    this.clearExpiry(sessionId);
    
    // Set new expiry
    const timeout = setTimeout(() => {
      this.sessions.delete(sessionId);
      this.sessionExpiry.delete(sessionId);
    }, this.SESSION_TTL);
    
    this.sessionExpiry.set(sessionId, timeout);
  }

  private clearExpiry(sessionId: string): void {
    const timeout = this.sessionExpiry.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionExpiry.delete(sessionId);
    }
  }

  // Cleanup method for expired sessions
  cleanup(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccessed.getTime() > this.SESSION_TTL) {
        this.deleteSession(sessionId);
      }
    }
  }

  // Statistics
  getStats() {
    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(
        s => Date.now() - s.lastAccessed.getTime() < 30 * 60 * 1000 // 30 minutes
      ).length,
      totalActions: Array.from(this.sessions.values()).reduce(
        (sum, session) => sum + session.actions.length, 0
      ),
    };
  }
}

// Export singleton instance
export const sessionStore = new SessionStore();
