import { NextRequest } from "next/server";
import { generateImage } from "@/app/lib/agent/yandexML";

// Helper function to extract image placeholders from HTML
function extractImagePlaceholders(htmlContent: string): Array<{
  fullMatch: string;
  prompt: string;
  description: string;
  type: string;
}> {
  const placeholders = [];

  // Format 1: Comment placeholders
  const commentPlaceholderRegex = /<!-- IMAGE_PLACEHOLDER:(.+?):(.+?)-->/g;
  let match;

  while ((match = commentPlaceholderRegex.exec(htmlContent)) !== null) {
    placeholders.push({
      fullMatch: match[0],
      prompt: match[1].trim(),
      description: match[2].trim(),
      type: "comment",
    });
  }

  // Format 2: Div placeholders with data-prompt attribute
  const divWithDataPromptRegex =
    /<div\s+class="image-placeholder"\s+data-prompt="([^"]+)"[^>]*>([^<]*)<\/div>/gi;
  let divDataMatch;

  while ((divDataMatch = divWithDataPromptRegex.exec(htmlContent)) !== null) {
    const prompt = divDataMatch[1].trim();
    const innerText = divDataMatch[2].trim();
    
    // Extract description from innerText (e.g., "Image: Team collaboration" -> "Team collaboration")
    let description = innerText;
    if (innerText.startsWith("Image:")) {
      description = innerText.substring(6).trim();
    }

    placeholders.push({
      fullMatch: divDataMatch[0],
      prompt: prompt,
      description: description || prompt,
      type: "div-data-prompt",
    });
  }

  // Format 3: Div placeholders without data-prompt (old format, fallback)
  const divPlaceholderRegex =
    /<div\s+class="image-placeholder"(?!\s+data-prompt)[^>]*>([^<]+)<\/div>/gi;
  let divMatch;

  while ((divMatch = divPlaceholderRegex.exec(htmlContent)) !== null) {
    const fullText = divMatch[1].trim();
    let prompt = fullText;
    let description = fullText;

    // Check if it has a colon separator
    const colonIndex = fullText.indexOf(":");
    if (colonIndex > -1) {
      prompt = fullText.substring(0, colonIndex).trim();
      description = fullText.substring(colonIndex + 1).trim();
    }

    placeholders.push({
      fullMatch: divMatch[0],
      prompt: prompt,
      description: description,
      type: "div",
    });
  }

  return placeholders;
}

// Helper function to replace placeholders with images
function replacePlaceholdersWithImages(
  htmlContent: string,
  placeholders: Array<{ fullMatch: string; description: string }>,
  imageResults: Array<{ base64: string | null; error?: string }>
): string {
  let processedContent = htmlContent;
  
  for (let i = 0; i < placeholders.length; i++) {
    const placeholder = placeholders[i];
    const imageResult = imageResults[i];
    
    if (imageResult.base64) {
      // Create img tag with base64 data
      const imgTag = `<img src="data:image/jpeg;base64,${imageResult.base64}" alt="${placeholder.description}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">`;
      processedContent = processedContent.replace(placeholder.fullMatch, imgTag);
    } else {
      // Replace with a fallback placeholder
      const fallbackImg = `<div class="image-placeholder" style="background: #f0f0f0; padding: 40px; text-align: center; border-radius: 8px; margin: 10px 0;">
            <p style="color: #666;">Image: ${placeholder.description}</p>
            <p style="color: #999; font-size: 12px;">(Failed to generate image${imageResult.error ? `: ${imageResult.error}` : ''})</p>
          </div>`;
      processedContent = processedContent.replace(placeholder.fullMatch, fallbackImg);
    }
  }
  
  return processedContent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { htmlContent } = body;

    if (!htmlContent) {
      return new Response(
        JSON.stringify({ error: "HTML content is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Extract image placeholders from HTML
    const placeholders = extractImagePlaceholders(htmlContent);
    
    console.log(`🖼️ Found ${placeholders.length} image placeholders to generate`);

    if (placeholders.length === 0) {
      // No images to generate, return original content
      return new Response(
        JSON.stringify({
          success: true,
          htmlContent,
          imagesGenerated: 0,
          message: "No image placeholders found in HTML",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Generate images for each placeholder
    const imageResults = [];
    let imagesGenerated = 0;
    
    for (let i = 0; i < placeholders.length; i++) {
      const placeholder = placeholders[i];
      console.log(`   Generating image ${i + 1}/${placeholders.length}: "${placeholder.prompt}"`);
      
      try {
        const imageBase64 = await generateImage(placeholder.prompt, false);
        
        if (imageBase64) {
          imagesGenerated++;
          console.log(`   ✅ Image ${i + 1} generated (${imageBase64.length} chars)`);
          imageResults.push({ base64: imageBase64 });
        } else {
          console.log(`   ❌ Image ${i + 1} failed to generate`);
          imageResults.push({ base64: null, error: "No image returned from generator" });
        }
      } catch (error) {
        console.error(`   ❌ Error generating image ${i + 1}:`, error);
        imageResults.push({ 
          base64: null, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    // Replace placeholders with generated images
    const processedHtml = replacePlaceholdersWithImages(htmlContent, placeholders, imageResults);

    return new Response(
      JSON.stringify({
        success: true,
        htmlContent: processedHtml,
        imagesGenerated,
        totalPlaceholders: placeholders.length,
        placeholders: placeholders.map(p => ({
          prompt: p.prompt,
          description: p.description,
          type: p.type,
        })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in generate-images:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate images",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}