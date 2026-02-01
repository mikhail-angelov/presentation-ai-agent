import { createClient } from "@supabase/supabase-js";
import {
  Session,
  UserAction,
  CreateSessionRequest,
  UpdateSessionRequest,
} from "@/app/types/session";

// Generate a UUID v4
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Initialize Supabase client
const supabaseProjectUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseProjectUrl || !supabaseAnonKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required",
  );
}

// Create Supabase client
const supabase = createClient(supabaseProjectUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: "public",
  },
});

class SupabaseSessionStore {
  private readonly SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  async createSession(request: CreateSessionRequest): Promise<Session|undefined> {
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
      tokensUsed: 0,
      mlRequestCount: 0,
    };

    try {
      // Insert session into database
      const { error } = await supabase.from("sessions").insert({
        id: sessionId,
        user_id: request.userId,
        created_at: now.toISOString(),
        last_accessed: now.toISOString(),
        user_agent: request.userAgent,
        ip_address: request.ipAddress,
        metadata: request.metadata || {},
        tokens_used: 0,
        ml_request_count: 0,
      });

      if (error) {
        console.warn(
          "Supabase table might not exist yet, using in-memory fallback:",
          error.message,
        );
        return undefined
      }
    } catch (error) {
      console.warn(
        "Supabase connection failed, using in-memory fallback:",
        error,
      );
      return undefined;
    }

    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    try {
      // Try to get session from database first
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      // Update last accessed time in database
      const now = new Date();
      await supabase
        .from("sessions")
        .update({ last_accessed: now.toISOString() })
        .eq("id", sessionId);

      // Get recent actions for this session
      const { data: actionsData } = await supabase
        .from("user_actions")
        .select("*")
        .eq("session_id", sessionId)
        .order("timestamp", { ascending: false })
        .limit(100);

      const actions: UserAction[] = (actionsData || []).map((action) => ({
        id: action.id,
        type: action.type,
        timestamp: new Date(action.timestamp),
        endpoint: action.endpoint,
        data: action.data,
        result: action.result,
        tokensUsed: action.tokens_used,
        duration: action.duration_ms,
      }));

      return {
        id: data.id,
        userId: data.user_id,
        createdAt: new Date(data.created_at),
        lastAccessed: new Date(data.last_accessed),
        userAgent: data.user_agent,
        ipAddress: data.ip_address,
        actions,
        metadata: data.metadata || {},
        tokensUsed: data.tokens_used || 0,
        mlRequestCount: data.ml_request_count || 0,
      };
    } catch (error) {
      console.warn(
        "Error getting session from Supabase, checking in-memory:",
        error,
      );
      return undefined;
    }
  }

  async updateSession(
    sessionId: string,
    request: UpdateSessionRequest,
  ): Promise<Session | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return undefined;
    }

    const now = new Date();
    const { tokensUsed, mlRequestCount, metadata } = request;
    // Update last accessed time
    console.log(`update session ${sessionId}: ${tokensUsed}, ${mlRequestCount}`)
    await supabase
      .from("sessions")
      .update({ last_accessed: now.toISOString(), tokens_used:tokensUsed, ml_request_count: mlRequestCount })
      .eq("id", sessionId);

    // Update metadata if provided
    if (metadata) {
      const updatedMetadata = { ...session.metadata, ...metadata };
      const { error } = await supabase
        .from("sessions")
        .update({ metadata: updatedMetadata })
        .eq("id", sessionId);

      if (error) {
        console.error("Error updating session metadata in Supabase:", error);
      } else {
        session.metadata = updatedMetadata;
      }
    }

    return session;
  }
  async addUserAction(sessionId: string, request: UserAction): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      console.error("Error addUserAction, no sessionId");
      return undefined;
    }

    const now = new Date();

    const actionId = this.generateActionId();
    // Ensure timestamp is a Date object
    const timestamp =
      request.timestamp instanceof Date
        ? request.timestamp
        : new Date(request.timestamp);

    const { error } = await supabase.from("user_actions").insert({
      id: actionId,
      session_id: sessionId,
      type: request.type,
      timestamp: timestamp.toISOString(),
      endpoint: request.endpoint,
      data: request.data || {},
      result: request.result || {},
      tokens_used: request.tokensUsed || 0,
      duration_ms: request.duration || 0,
    });

    if (error) {
      console.error("Error adding action to Supabase:", error);
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);

    return !error;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .order("last_accessed", { ascending: false });

    if (error || !data) {
      return [];
    }

    // For each session, get action count
    const sessions = await Promise.all(
      data.map(async (sessionData) => {
        const { count } = await supabase
          .from("user_actions")
          .select("*", { count: "exact", head: true })
          .eq("session_id", sessionData.id);

        return {
          id: sessionData.id,
          userId: sessionData.user_id,
          createdAt: new Date(sessionData.created_at),
          lastAccessed: new Date(sessionData.last_accessed),
          userAgent: sessionData.user_agent,
          ipAddress: sessionData.ip_address,
          actions: [], // We don't load all actions for list view
          metadata: sessionData.metadata || {},
          tokensUsed: sessionData.tokens_used || 0,
          mlRequestCount: sessionData.ml_request_count || 0,
          actionCount: count || 0,
        };
      }),
    );

    return sessions;
  }

  async getSessionActions(
    sessionId: string,
    limit = 50,
  ): Promise<UserAction[]> {
    const { data, error } = await supabase
      .from("user_actions")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((action) => ({
      id: action.id,
      type: action.type,
      timestamp: new Date(action.timestamp),
      endpoint: action.endpoint,
      data: action.data,
      result: action.result,
      tokensUsed: action.tokens_used,
      duration: action.duration_ms,
    }));
  }

  async cleanup(): Promise<void> {
    // Expired sessions are automatically deleted by the database
    // This method is kept for compatibility
    console.log(
      "Supabase store cleanup: Expired sessions are automatically deleted by database",
    );
  }

  async getStats() {
    // Use the session_stats view
    const { data, error } = await supabase
      .from("session_stats")
      .select("*")
      .single();

    if (error || !data) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        totalActions: 0,
        totalTokensUsed: 0,
        totalMLRequests: 0,
      };
    }

    return {
      totalSessions: data.total_sessions || 0,
      activeSessions: data.active_sessions || 0,
      totalActions: data.total_actions || 0,
      totalTokensUsed: data.total_tokens_used || 0,
      totalMLRequests: data.total_ml_requests || 0,
    };
  }

  // Increment session metrics
  async incrementSessionMetrics(
    sessionId: string,
    tokensUsed: number = 0,
    mlRequestCount: number = 0,
  ): Promise<boolean> {
    try {
      // Use the increment_session_metrics function if it exists
      const { error } = await supabase.rpc("increment_session_metrics", {
        p_session_id: sessionId,
        p_tokens_used: tokensUsed,
        p_ml_request_count: mlRequestCount,
      });

      if (error) {
        // Fallback to direct update if function doesn't exist
        console.warn(
          "increment_session_metrics function not found, using direct update:",
          error.message,
        );

        // First get current values
        const { data: currentData, error: fetchError } = await supabase
          .from("sessions")
          .select("tokens_used, ml_request_count")
          .eq("id", sessionId)
          .single();

        if (fetchError || !currentData) {
          console.error("Error fetching current session metrics:", fetchError);
          return false;
        }

        // Then update with incremented values
        const { error: updateError } = await supabase
          .from("sessions")
          .update({
            tokens_used: (currentData.tokens_used || 0) + tokensUsed,
            ml_request_count:
              (currentData.ml_request_count || 0) + mlRequestCount,
            last_accessed: new Date().toISOString(),
          })
          .eq("id", sessionId);

        if (updateError) {
          console.error("Error updating session metrics:", updateError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error incrementing session metrics:", error);
      return false;
    }
  }

  // Get session metrics
  async getSessionMetrics(sessionId: string): Promise<{
    tokensUsed: number;
    mlRequestCount: number;
    actionCount: number;
  } | null> {
    try {
      // Try to use the get_session_metrics function if it exists
      const { data, error } = await supabase.rpc("get_session_metrics", {
        p_session_id: sessionId,
      });

      if (error || !data || data.length === 0) {
        // Fallback to direct query if function doesn't exist
        console.warn(
          "get_session_metrics function not found, using direct query:",
          error?.message,
        );

        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("tokens_used, ml_request_count")
          .eq("id", sessionId)
          .single();

        if (sessionError || !sessionData) {
          console.error("Error getting session metrics:", sessionError);
          return null;
        }

        const { count } = await supabase
          .from("user_actions")
          .select("*", { count: "exact", head: true })
          .eq("session_id", sessionId);

        return {
          tokensUsed: sessionData.tokens_used || 0,
          mlRequestCount: sessionData.ml_request_count || 0,
          actionCount: count || 0,
        };
      }

      return {
        tokensUsed: data[0]?.tokens_used || 0,
        mlRequestCount: data[0]?.ml_request_count || 0,
        actionCount: Number(data[0]?.action_count) || 0,
      };
    } catch (error) {
      console.error("Error getting session metrics:", error);
      return null;
    }
  }

  private generateSessionId(): string {
    return generateUUID();
  }

  private generateActionId(): string {
    return generateUUID();
  }
}

// Export singleton instance
export const sessionStore = new SupabaseSessionStore();
