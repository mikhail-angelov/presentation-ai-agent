import { NextRequest, NextResponse } from "next/server";
import { sessionStore } from "@/app/lib/services/supabaseStore";
import { SESSION_COOKIE_NAME, UserAction } from "@/app/types/session";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      console.error("Error addUserAction, no sessionId");
      return NextResponse.json({ error: "No session found" }, { status: 404 });
    }

    const body = await request.json();
    const action = body as UserAction;

    await sessionStore.addUserAction(sessionId, action);

    return NextResponse.json({
      success: true,
      status: {
        ok: true,
      },
    });
  } catch (error) {
    console.error("Error add user action:", error);
    return NextResponse.json(
      { error: "Failed to add user action" },
      { status: 500 },
    );
  }
}
