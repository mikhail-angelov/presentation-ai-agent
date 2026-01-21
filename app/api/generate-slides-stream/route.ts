import { NextRequest } from "next/server";
import { sessionStore } from "@/app/lib/session/store";
import { SESSION_COOKIE_NAME } from "@/app/types/session";
import { runAgentStream } from "@/app/lib/agent/deepseekAgent";

// Generate HTML/CSS slides using LLM with streaming
async function* generateSlidesHTMLStream(
  topic: string,
  audience: string,
  duration: string,
  slidesContent: string,
  language: string = "en"
): AsyncGenerator<string> {
  const prompt = `Generate COMPLETE, professional HTML/CSS code for presentation slides based on the following content:

PRESENTATION TOPIC: ${topic}
TARGET AUDIENCE: ${audience || "General audience"}
PRESENTATION DURATION: ${duration || "10"} minutes

SLIDES CONTENT:
${slidesContent || "No slides content provided"}

Generate clean, modern HTML/CSS code for a presentation with the following requirements:

1. Design requirements:
   - Professional, clean design
   - Simple CSS for good layout for html2canvas render
   - ok to include some resources from cdn
   - Use a color scheme that matches a professional presentation

2. Code requirements:
   - Single HTML file with embedded CSS
   - preferable inline css styles

3. Content requirements:
   - Extract key information from the provided content
   - Create clear, concise bullet points where appropriate
   - Use appropriate typography (font sizes, weights)
   - Ensure text is readable with good contrast

4. Diagram requirements:
   - Create simple CSS-based diagrams for key concepts
   - Use CSS shapes (circles, rectangles, lines) to represent relationships
   - Use color coding for different elements
   - Include labels for diagram components

5. COMPLETENESS REQUIREMENTS:
   - Generate the ENTIRE HTML document from start to finish
   - MUST start with <!DOCTYPE html>
   - MUST include complete <html>, <head>, and <body> tags
   - MUST include CSS styles in <style> tag in head
   - MUST include at least 5 slides with proper structure
   - MUST end with the closing </html> tag
   - DO NOT truncate or leave the HTML incomplete
   - Ensure all tags are properly closed

Generate ONLY the HTML/CSS code. Do not include any explanations, markdown formatting, or additional text outside of the HTML document.`;

  try {
    const stream = runAgentStream(prompt, "html_slides", language);
    for await (const chunk of stream) {
      yield chunk;
    }
  } catch (error) {
    console.error("Error generating slides HTML stream:", error);
    yield `Error: ${error instanceof Error ? error.message : "Failed to generate slides HTML"}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      topic, 
      audience, 
      duration, 
      slidesContent, 
      language = "en" 
    } = body;

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Presentation topic is required" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get session ID from cookie
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const actionStartTime = Date.now();
    const actionId = `act_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = "";
          
          // Send initial metadata
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "metadata",
                sessionId,
                actionId,
                topic,
                audience: audience || "",
                duration: duration || "10",
                language,
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );

          // Stream the HTML content
          const htmlStream = generateSlidesHTMLStream(
            topic,
            audience || "",
            duration || "10",
            slidesContent || "",
            language
          );

          let chunkCount = 0;
          for await (const chunk of htmlStream) {
            fullContent += chunk;
            chunkCount++;
            
            // Send chunk immediately
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ chunk })}\n\n`
              )
            );
            
            // Add small delay to prevent overwhelming the client
            if (chunkCount % 10 === 0) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }
          
          console.log(`Streamed ${chunkCount} chunks, total length: ${fullContent.length} chars`);

          // Calculate processing time and token usage
          const actionDuration = Date.now() - actionStartTime;
          const tokensUsed = Math.floor(fullContent.length / 4);

          // Update session with this action if session exists
          if (sessionId) {
            sessionStore.updateSession(sessionId, {
              action: {
                id: actionId,
                type: "generate_slides_html_stream",
                timestamp: new Date(),
                endpoint: "/api/generate-slides-stream",
                data: { topic, audience, duration },
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
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                done: true,
                content: fullContent,
                tokensUsed,
                duration: actionDuration,
                sessionId,
                actionId,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error("Error in stream:", error);
          
          // Log error in session if exists
          if (sessionId) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            sessionStore.updateSession(sessionId, {
              action: {
                id: `err_${Date.now()}`,
                type: "generate_slides_html_stream_error",
                timestamp: new Date(),
                endpoint: "/api/generate-slides-stream",
                data: {},
                result: { error: errorMessage },
                duration: 0,
              },
            });
          }

          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                error: error instanceof Error ? error.message : "Failed to generate slides HTML",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("Error in generate-slides-stream:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate slides HTML stream" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
