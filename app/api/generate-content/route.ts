import { NextRequest, NextResponse } from "next/server";
import { sessionStore } from "@/app/lib/session/store";
import { SESSION_COOKIE_NAME } from "@/app/types/session";
import { runAgent } from "@/app/lib/agent/deepseekAgent";

// AI response generator for presentation content using DeepSeek agent
async function generatePresentationContent(
  topic: string,
  audience: string,
  duration: string,
  keyPoints: string[],
  stepType: string = "outline",
  previousContent?: string
): Promise<string> {
  const filteredKeyPoints = keyPoints.filter((kp) => kp.trim() !== "");

  let prompt = "";
  
  switch (stepType) {
    case "thesis":
    case "outline":
      prompt = `You are a presentation expert. Develop a comprehensive presentation outline with these details:

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
      break;

    case "speech":
      prompt = `You are a professional speech writer. Create a spoken presentation script based on this outline:

PRESENTATION TOPIC: ${topic}
TARGET AUDIENCE: ${audience || "General audience"}
PRESENTATION DURATION: ${duration} minutes
PRESENTATION OUTLINE:
${previousContent || "No outline provided"}

Create a natural, engaging spoken presentation script that:
1. Has a conversational tone suitable for ${audience || "general audience"}
2. Includes speaker notes and delivery suggestions
3. Incorporates rhetorical devices (questions, pauses, emphasis)
4. Provides timing guidance for ${duration} minute presentation
5. Includes audience interaction points
6. Has clear transitions between sections
7. Ends with a memorable conclusion

Format as a speaker's script with clear indications for pacing, emphasis, and audience engagement.`;
      break;

    case "slides":
      prompt = `You are a presentation design expert. Create slide content based on this speech script:

PRESENTATION TOPIC: ${topic}
TARGET AUDIENCE: ${audience || "General audience"}
SPEECH SCRIPT:
${previousContent || "No speech script provided"}

Create comprehensive slide content that:
1. Breaks the speech into logical slides (approximately 1 slide per minute)
2. Provides concise bullet points for each slide (not full sentences)
3. Suggests visual elements (charts, images, diagrams) where appropriate
4. Includes slide titles that summarize key messages
5. Provides speaker notes for each slide
6. Follows good presentation design principles (contrast, repetition, alignment, proximity)
7. Creates a visual story flow

Format as markdown with clear slide separators and visual suggestions.`;
      break;

    default:
      prompt = `You are a presentation expert. Develop content for this presentation:

TOPIC: ${topic}
AUDIENCE: ${audience || "General audience"}
DURATION: ${duration} minutes
KEY POINTS: ${
        filteredKeyPoints.length > 0
          ? filteredKeyPoints.join(", ")
          : "Not specified"
      }

Generate comprehensive presentation content in markdown format.`;
  }

  try {
    const content = await runAgent(prompt);
    return content;
  } catch (error) {
    console.error("Error generating content with DeepSeek agent:", error);
    throw new Error("Failed to generate presentation content");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, audience, duration, keyPoints, stepType, previousContent } = body;

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
      audience || "",
      duration || "10",
      keyPoints || [],
      stepType || "outline",
      previousContent
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
