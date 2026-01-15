"use client";

import { useState, useEffect, useCallback } from 'react';

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
};

export type SessionStats = {
  totalActions: number;
  recentActions: Array<any>;
};

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize or get existing session
  const initializeSession = useCallback(async () => {
    try {
      setLoading(true);
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
        setSession(data.session);
      } else if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      } else {
        throw new Error('Failed to get session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Session initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Track user action
  const trackAction = useCallback(async (
    type: string,
    data?: Record<string, any>,
    result?: Record<string, any>,
    tokensUsed?: number,
    duration?: number
  ) => {
    if (!session) return;
console.log('trackAction called with:', type, data, result, tokensUsed, duration);
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
        setSession(updated.session);
      }
    } catch (err) {
      console.error('Failed to track action:', err);
    }
  }, []);

  // Update session metadata
  const updateMetadata = useCallback(async (metadata: Record<string, any>) => {
    if (!session) return;

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
        setSession(updated.session);
      }
    } catch (err) {
      console.error('Failed to update metadata:', err);
    }
  }, []);

  // Clear session (logout)
  const clearSession = useCallback(async () => {
    try {
      await fetch('/api/sessions', {
        method: 'DELETE',
        credentials: 'include',
      });
      setSession(null);
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return {
    session,
    loading,
    error,
    initializeSession,
    trackAction,
    updateMetadata,
    clearSession,
  };
}
