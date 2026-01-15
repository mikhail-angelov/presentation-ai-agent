import { NextRequest, NextResponse } from "next/server";
import { sessionStore } from "@/app/lib/session/store";
import {
  CreateSessionRequest,
  UpdateSessionRequest,
  SESSION_COOKIE_NAME,
} from "@/app/types/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAgent, ipAddress, userId, metadata } =
      body as CreateSessionRequest;

    // Get client IP from request headers
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      ipAddress;

    // Get user agent from request headers
    const clientUserAgent = request.headers.get("user-agent") || userAgent;

    // Create new session
    const session = sessionStore.createSession({
      userAgent: clientUserAgent,
      ipAddress: clientIp,
      userId,
      metadata,
    });

    // Create response with session
    const response = NextResponse.json({
      success: true,
      session: {
        id: session.id,
        createdAt: session.createdAt,
        userId: session.userId,
        metadata: session.metadata,
        actions: session.actions.slice(-10), // Last 10 actions
      },
    });

    // Set session cookie (HttpOnly, Secure in production)
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days (fits in 32-bit signed integer)
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 404 });
    }

    // Get session from store
    const session = sessionStore.getSession(sessionId);

    if (!session) {
      // Clear invalid cookie
      const response = NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        lastAccessed: session.lastAccessed,
        actions: session.actions.slice(-10), // Last 10 actions
        metadata: session.metadata,
      },
      stats: {
        totalActions: session.actions.length,
        recentActions: session.actions.slice(-5),
      },
    });
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, metadata } = body as UpdateSessionRequest;

    // Update session with new action or metadata
    const updatedSession = sessionStore.updateSession(sessionId, {
      action,
      metadata,
    });

    if (!updatedSession) {
      // Clear invalid cookie
      const response = NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        lastAccessed: updatedSession.lastAccessed,
        actions: updatedSession.actions.slice(-10),
        metadata: updatedSession.metadata,
      },
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
      sessionStore.deleteSession(sessionId);
    }

    // Clear session cookie
    const response = NextResponse.json({
      success: true,
      message: "Session deleted successfully",
    });

    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}

// Admin endpoint to get session statistics (protected in production)
export async function OPTIONS(request: NextRequest) {
  // Check for admin token in production
  if (process.env.NODE_ENV === "production") {
    const adminToken = request.headers.get("x-admin-token");
    if (adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const stats = sessionStore.getStats();
  const sessions = Array.from(sessionStore["sessions"].values() || []);

  return NextResponse.json({
    success: true,
    stats,
    sessions: sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed,
      actionCount: session.actions.length,
      userAgent: session.userAgent?.substring(0, 50),
      ipAddress: session.ipAddress,
    })),
  });
}
