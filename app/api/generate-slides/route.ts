import { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/app/types/session";
import { runAgentForSlides } from "@/app/lib/agent/deepseekAgentForSlides";
import { sessionStore, generateUUID } from "@/app/lib/session/supabaseStore";

// Helper function to safely stringify HTML content for JSON
function safeStringifyForSSE(data: any): string {
  try {
    // Create a copy of the data
    const processedData = { ...data };
    
    // If there's HTML content, encode it as base64 to avoid JSON escaping issues
    if (processedData.content && typeof processedData.content === 'string') {
      // Convert to base64
      processedData.contentBase64 = Buffer.from(processedData.content).toString('base64');
      // Remove the raw content to avoid JSON parsing issues
      delete processedData.content;
    }
    
    // Use JSON.stringify - it should handle base64 strings fine
    return JSON.stringify(processedData);
  } catch (error) {
    console.error('Error stringifying data for SSE:', error);
    // Fallback: send minimal data
    return JSON.stringify({
      type: data.type || 'error',
      done: data.done || false,
      error: 'Failed to serialize content',
      fallback: true
    });
  }
}

// Generate HTML/CSS slides using LLM with streaming
async function* generateSlidesHTMLStream(
  topic: string,
  audience: string,
  duration: string,
  slidesContent: string,
  exampleHtml: string,
  templateHtml: string,
  language: string = "en",
): AsyncGenerator<string> {
  const prompt = `Generate HTML sections for individual presentation slides based on the following content. DO NOT generate the full HTML document - only generate the slide sections.

PRESENTATION TOPIC: ${topic}
TARGET AUDIENCE: ${audience || "General audience"}
PRESENTATION DURATION: ${duration || "10"} minutes

SLIDES CONTENT:
${slidesContent || "No slides content provided"}

BASE PRESENTATION TEMPLATE (use as reference for available CSS classes and structure):
${templateHtml || "No example provided"}
USE THOSE EXAMPLE OF SLIDES TO GENERATE REAL SLIDES
${exampleHtml || "No example provided"}

IMPORTANT INSTRUCTIONS:
1. Generate ONLY the slide sections (<section> elements) - NOT the full HTML document
2. Each slide should be a separate <section> element with appropriate classes
3. Use the CSS classes from the base template when possible (e.g., .slide, .slide-title, .content-block, .points-list, etc.)
4. You can also use inline styles if needed for specific styling
5. Each slide should have:
   - A title (use <h1> or <h2> with appropriate classes)
   - Content (paragraphs, lists, etc.)
   - A slide number indicator (use <div class="slide-number">Slide X of Y</div>)
6. First slide should have class="slide first-slide" and be a title slide - MUST include an AI-generated image that visually represents the main presentation topic
7. Last slide should have class="slide last-slide" and be a conclusion slide
8. Other slides should have class="slide" - include images where they help explain concepts or make the slide more engaging
9. Make sure content is well-organized and visually appealing

IMAGE REQUIREMENTS:
- FIRST SLIDE MUST include an image placeholder that visually represents the main presentation topic
- Other slides should include image placeholders where they help explain concepts or make the slide more engaging
- Use the following format for image placeholders: <!-- IMAGE_PLACEHOLDER:detailed description for image generation:brief description -->
- Make prompts detailed and specific for better image generation
- Example: <!-- IMAGE_PLACEHOLDER:A professional business meeting with diverse team members discussing charts and graphs on a large screen:Team collaboration meeting -->

AVAILABLE CSS CLASSES FROM TEMPLATE:
- .slide (base slide class)
- .first-slide (for first/title slide)
- .last-slide (for last/conclusion slide)
- .slide-title (for main slide titles)
- .slide-subtitle (for subtitles)
- .content-block (for content container)
- .content-title (for content section titles)
- .points-list (for unordered lists)
- .diagram (for diagram containers)
- .diagram-title (for diagram titles)
- .diagram-content (for diagram content)
- .circle, .rectangle, .line (for diagram elements)
- .image-placeholder (for image placeholders)
- .slide-number (for slide number indicator)
- .thank-you (for thank you message)

Generate ONLY the slide sections based on SLIDES CONTENT. Do not include <!DOCTYPE html>, <html>, <head>, <style>, or <body> tags. Do not include any explanations or markdown formatting.`;

  try {
    const stream = runAgentForSlides(prompt, "html_slides", language);
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
      exampleHtml = "",
      templateHtml = "",
      language = "en",
    } = body;

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Presentation topic is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get session ID from cookie
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const actionStartTime = Date.now();
    const actionId = generateUUID();

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
              })}\n\n`,
            ),
          );

          // Stream the HTML content
          const htmlStream = generateSlidesHTMLStream(
            topic,
            audience || "",
            duration || "10",
            slidesContent || "",
            exampleHtml || "",
            templateHtml || "",
            language,
          );

          let chunkCount = 0;
          for await (const chunk of htmlStream) {
            fullContent += chunk;
            chunkCount++;

            // Send chunk immediately
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ chunk })}\n\n`,
              ),
            );

            // Add small delay to prevent overwhelming the client
            if (chunkCount % 10 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
          }

          console.log(
            `Streamed ${chunkCount} chunks, total length: ${fullContent.length} chars`,
          );

          // Ensure we have a valid template
          let finalHtml = fullContent; // Default to just the slides
          
          if (templateHtml && templateHtml.includes("<!-- Replace me with Slides html-->")) {
            // Use the template if it has the right placeholder
            finalHtml = templateHtml.replace(
              "<!-- Replace me with Slides html-->",
              fullContent,
            );
          } else if (templateHtml) {
            // Try to find any placeholder in the template
            const placeholderMatch = templateHtml.match(/<!--\s*SLIDES\s*CONTENT\s*-->/i) || 
                                    templateHtml.match(/<!--\s*INSERT\s*SLIDES\s*HERE\s*-->/i) ||
                                    templateHtml.match(/<!--\s*REPLACE\s*ME\s*-->/i);
            
            if (placeholderMatch) {
              finalHtml = templateHtml.replace(placeholderMatch[0], fullContent);
            } else {
              // If no placeholder found, append slides to template
              finalHtml = templateHtml + "\n" + fullContent;
            }
          }
          
          // Ensure finalHtml is a complete HTML document
          if (!finalHtml.includes("<!DOCTYPE html>") && !finalHtml.includes("<html")) {
            // Wrap in a basic HTML structure
            finalHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presentation Slides</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .slide { background: white; border-radius: 10px; padding: 30px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .first-slide { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .slide-title { font-size: 2em; margin-bottom: 20px; }
        .slide-number { position: absolute; bottom: 10px; right: 10px; font-size: 0.8em; color: #666; }
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }
    </style>
</head>
<body>
${finalHtml}
</body>
</html>`;
          }

          // Calculate processing time and token usage
          const actionDuration = Date.now() - actionStartTime;
          const tokensUsed = Math.floor(fullContent.length / 4);

          // Update session with this action if session exists
          if (sessionId) {
            // Get current session to calculate total tokens
            const currentSession = await sessionStore.getSession(sessionId);
            const currentTotalTokens =
              currentSession?.metadata?.totalTokensUsed || 0;

            sessionStore.updateSession(sessionId, {
              action: {
                id: actionId,
                type: "generate_slides_html_stream",
                timestamp: new Date(),
                endpoint: "/api/generate-slides",
                data: { topic, audience, duration },
                result: { success: true, contentLength: finalHtml.length },
                tokensUsed,
                duration: actionDuration,
              },
              metadata: {
                lastPresentationTopic: topic,
                lastGeneratedAt: new Date().toISOString(),
                totalTokensUsed: currentTotalTokens + tokensUsed,
              },
            });
          }

          // Send the final HTML content in chunks to avoid JSON parsing issues
          // Split the HTML into manageable chunks
          const chunkSize = 10000; // 10KB chunks
          for (let i = 0; i < finalHtml.length; i += chunkSize) {
            const chunk = finalHtml.substring(i, i + chunkSize);
            const chunkEvent = {
              type: "content_chunk",
              chunk: chunk,
              isFinal: i + chunkSize >= finalHtml.length,
              totalChunks: Math.ceil(finalHtml.length / chunkSize),
              currentChunk: Math.floor(i / chunkSize) + 1
            };
            
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify(chunkEvent)}\n\n`,
              ),
            );
            
            // Small delay to prevent overwhelming the client
            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          // Define empty placeholders array since extractImagePlaceholders function was removed
          const placeholders = [];

          // Send final completion event
          const finalEvent = {
            type: "final_completion",
            done: true,
            contentLength: finalHtml.length,
            tokensUsed,
            duration: actionDuration,
            sessionId,
            actionId,
            imagePlaceholders: placeholders.length,
            message: "Presentation slides generated successfully. Use /api/generate-images to generate images for placeholders."
          };
          
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify(finalEvent)}\n\n`,
            ),
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
                id: generateUUID(),
                type: "generate_slides_html_stream_error",
                timestamp: new Date(),
                endpoint: "/api/generate-slides",
                data: {},
                result: { error: errorMessage },
                duration: 0,
              },
            });
          }

          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to generate slides HTML",
              })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in generate-slides:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate slides HTML stream" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}