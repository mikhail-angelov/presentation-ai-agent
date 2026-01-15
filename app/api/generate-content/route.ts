import { NextRequest, NextResponse } from "next/server";
import { sessionStore } from "@/app/lib/session/store";
import { SESSION_COOKIE_NAME } from "@/app/types/session";
import { runAgent } from "@/app/lib/agent/deepseekAgent";

// AI response generator for presentation content using DeepSeek agent
async function generatePresentationContent(
  topic: string,
  audience: string,
  duration: string,
  keyPoints: string[]
): Promise<string> {
  const filteredKeyPoints = keyPoints.filter((kp) => kp.trim() !== "");

  // Create a prompt that will use the general LLM response (not specific tools)
  // Avoid keywords that trigger tool routing: "plan", "create", "schedule", "critique", "thinking", "analyze", "advice", "steps", "help"
  const prompt = `You are a presentation expert. Develop a comprehensive presentation outline with these details:

TOPIC: ${topic}
AUDIENCE: ${audience || "General audience"}
DURATION: ${duration} minutes
KEY POINTS: ${
    filteredKeyPoints.length > 0
      ? filteredKeyPoints.join(", ")
      : "Not specified"
  }

Generate a detailed, practical presentation outline that includes:
1. Title and engaging introduction
2. Structured framework with time allocations
3. Content development for each key point
4. Visual design suggestions
5. Audience engagement strategies
6. Delivery techniques
7. Q&A preparation
8. Clear call to action

Format in markdown with clear headings and bullet points.`;

  try {
    const content = await runAgent(prompt);
    return content;
  } catch (error) {
    console.error("Error generating content with DeepSeek agent:", error);

    // Fallback to mock content if agent fails
    const mockContent = `
# Presentation Plan: ${topic}

## Target Audience
${audience || "General audience"}

## Duration
${duration} minutes

## Key Points
${
  filteredKeyPoints.length > 0
    ? filteredKeyPoints.map((kp, i) => `${i + 1}. ${kp}`).join("\n")
    : "1. Define your main message\n2. Support with evidence\n3. Call to action"
}

## Structure
1. **Introduction (${Math.floor(parseInt(duration) * 0.1)} min)**
   - Hook: Start with a compelling question or statistic
   - Agenda: Outline what you'll cover
   - Relevance: Explain why this matters to ${audience || "your audience"}

2. **Main Content (${Math.floor(parseInt(duration) * 0.7)} min)**
   ${
     filteredKeyPoints
       .map((kp, i) => `   - Point ${i + 1}: ${kp}`)
       .join("\n   ") ||
     "   - Present your main arguments\n   - Support with data and examples\n   - Address potential counter-arguments"
   }

3. **Conclusion (${Math.floor(parseInt(duration) * 0.2)} min)**
   - Summary: Recap key points
   - Call to Action: What should ${audience || "the audience"} do next?
   - Q&A: Prepare for questions

## Design Tips
- Use consistent color scheme and fonts
- Limit text to 6 lines per slide
- Include relevant visuals (charts, images, diagrams)
- Practice timing: ${Math.floor(parseInt(duration) / 3)} minutes per section

## Delivery Tips
- Speak clearly and vary your tone
- Make eye contact with different audience members
- Use gestures to emphasize points
- Pause after important statements
- Prepare answers to likely questions
`;

    return mockContent;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, audience, duration, keyPoints } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Presentation topic is required" },
        { status: 400 }
      );
    }

    // Get session ID from cookie
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    let session = null;

    // Create session action for tracking
    const actionStartTime = Date.now();
    const actionId = `act_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Simulate API processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const content = await generatePresentationContent(
      topic,
      audience,
      duration || "10",
      keyPoints || []
    );

    // Calculate processing time and token usage
    const actionDuration = Date.now() - actionStartTime;
    const tokensUsed =
      Math.floor(content.length / 4) + Math.floor(Math.random() * 100);

    // Update session with this action if session exists
    if (sessionId) {
      session = sessionStore.updateSession(sessionId, {
        action: {
          id: actionId,
          type: "generate_presentation",
          timestamp: new Date(),
          endpoint: "/api/generate-content",
          data: { topic, audience, duration, keyPoints: keyPoints || [] },
          result: { success: true, contentLength: content.length },
          tokensUsed,
          duration: actionDuration,
        },
        metadata: {
          lastPresentationTopic: topic,
          lastGeneratedAt: new Date().toISOString(),
          totalTokensUsed:
            (sessionStore.getSession(sessionId)?.metadata?.totalTokensUsed ||
              0) + tokensUsed,
        },
      });
    }

    // Prepare response data
    const metadata: any = {
      topic,
      audience: audience || "Not specified",
      duration: duration || "10",
      keyPoints: (keyPoints || []).filter((kp: string) => kp.trim() !== ""),
      generatedAt: new Date().toISOString(),
      tokensUsed,
      estimatedReadingTime: `${Math.ceil(
        content.split(" ").length / 200
      )} minutes`,
      sessionId,
      actionId,
    };

    // If no session exists, create one for new users
    if (!sessionId) {
      const clientIp =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip");
      const clientUserAgent = request.headers.get("user-agent");

      const newSession = sessionStore.createSession({
        userAgent: clientUserAgent || undefined,
        ipAddress: clientIp || undefined,
        metadata: {
          firstAction: "generate_presentation",
          firstTopic: topic,
          totalTokensUsed: tokensUsed,
        },
      });

      // Add the action to the new session
      sessionStore.updateSession(newSession.id, {
        action: {
          id: actionId,
          type: "generate_presentation",
          timestamp: new Date(),
          endpoint: "/api/generate-content",
          data: { topic, audience, duration, keyPoints: keyPoints || [] },
          result: { success: true, contentLength: content.length },
          tokensUsed,
          duration: actionDuration,
        },
      });

      metadata.sessionId = newSession.id;
      metadata.newSessionCreated = true;

      // Set session cookie in response
      const response = NextResponse.json({
        success: true,
        content,
        metadata,
      });
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: newSession.id,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60,
        path: "/",
      });
      return response;
    }

    return NextResponse.json({
      success: true,
      content,
      metadata,
    });
  } catch (error) {
    console.error("Error generating content:", error);

    // Log error in session if exists
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (sessionId) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      sessionStore.updateSession(sessionId, {
        action: {
          id: `err_${Date.now()}`,
          type: "generate_presentation_error",
          timestamp: new Date(),
          endpoint: "/api/generate-content",
          data: {},
          result: { error: errorMessage },
          duration: 0,
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to generate presentation content" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      "Use POST method with JSON body containing: topic, audience, duration, keyPoints",
    example: {
      topic: "The Future of AI in Education",
      audience: "educators",
      duration: "15",
      keyPoints: ["Personalized learning", "Automated grading", "AI tutors"],
    },
  });
}
