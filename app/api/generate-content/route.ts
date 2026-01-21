import { NextRequest, NextResponse } from "next/server";
import { sessionStore } from "@/app/lib/session/store";
import { SESSION_COOKIE_NAME } from "@/app/types/session";
import { runAgentStream } from "@/app/lib/agent/deepseekAgent";

// Streaming endpoint for real-time LLM feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, audience, duration, keyPoints, stepType, previousContent, language = "en" } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Presentation topic is required" },
        { status: 400 }
      );
    }

    // Get session ID from cookie
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    
    // Create session action for tracking
    const actionStartTime = Date.now();
    const actionId = `act_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;


      const filteredKeyPoints = (keyPoints || []).filter((kp: string) => kp.trim() !== "");
      
      let prompt = "";
      switch (stepType || "outline") {
        case "thesis":
        case "outline":
          prompt = `Generate a presentation outline with these details:

TOPIC: ${topic}
AUDIENCE: ${audience || "General audience"}
DURATION: ${duration || "10"} minutes
KEY POINTS: ${
            filteredKeyPoints.length > 0
              ? filteredKeyPoints.join(", ")
              : "Not specified"
          }

Generate a detailed, practical presentation outline.`;
          break;

        case "speech":
          prompt = `Create a spoken presentation script based on this outline:

PRESENTATION TOPIC: ${topic}
TARGET AUDIENCE: ${audience || "General audience"}
PRESENTATION DURATION: ${duration || "10"} minutes
PRESENTATION OUTLINE:
${previousContent || "No outline provided"}

Create a natural, engaging spoken presentation script.`;
          break;

        case "slides":
          prompt = `Create slide content based on this speech script:

PRESENTATION TOPIC: ${topic}
TARGET AUDIENCE: ${audience || "General audience"}
SPEECH SCRIPT:
${previousContent || "No speech script provided"}

Create comprehensive slide content.`;
          break;

        default:
          prompt = `Develop content for this presentation:

TOPIC: ${topic}
AUDIENCE: ${audience || "General audience"}
DURATION: ${duration || "10"} minutes
KEY POINTS: ${
            filteredKeyPoints.length > 0
              ? filteredKeyPoints.join(", ")
              : "Not specified"
          }

Generate comprehensive presentation content.`;
      }

      // Create a streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const agentStream = runAgentStream(prompt, stepType || "outline", language);
            
            let fullContent = "";
            for await (const chunk of agentStream) {
              fullContent += chunk;
              controller.enqueue(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
            
            // Calculate tokens and duration
            const actionDuration = Date.now() - actionStartTime;
            const tokensUsed = Math.floor(fullContent.length / 4);
            
            // Update session if exists
            if (sessionId) {
              sessionStore.updateSession(sessionId, {
                action: {
                  id: actionId,
                  type: "generate_presentation_stream",
                  timestamp: new Date(),
                  endpoint: "/api/generate-content",
                  data: { topic, audience, duration, keyPoints: keyPoints || [] },
                  result: { success: true, contentLength: fullContent.length },
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
            
            // Send completion event
            controller.enqueue(`data: ${JSON.stringify({ done: true, content: fullContent, tokensUsed, duration: actionDuration })}\n\n`);
            controller.close();
          } catch (error) {
            console.error("Error in streaming:", error);
            controller.enqueue(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate content" })}\n\n`);
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
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
