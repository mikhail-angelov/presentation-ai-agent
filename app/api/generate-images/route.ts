import { NextRequest } from "next/server";
import { generateImage } from "@/app/lib/agent/yandexML";
import { extractImagePlaceholders } from "@/app/lib/agent/deepseekAgentForSlides";

// Helper function to replace a specific placeholder with an image
function replaceSpecificPlaceholder(
  htmlContent: string,
  placeholder: { fullMatch: string; description: string; prompt: string; type: string },
  imageResult: { base64: string | null; error?: string }
): string {
  let processedContent = htmlContent;
  
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
  
  return processedContent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { htmlContent, placeholderIndex, placeholder } = body;

    if (!htmlContent) {
      return new Response(
        JSON.stringify({ error: "HTML content is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Extract all placeholders to get the full match
    const allPlaceholders = extractImagePlaceholders(htmlContent);
    
    console.log(`🖼️ Found ${allPlaceholders.length} image placeholders in HTML`);

    let targetPlaceholder: { fullMatch: string; prompt: string; description: string; type: string } | null = null;
    let placeholderToGenerate = placeholder;

    // Determine which placeholder to generate
    if (placeholderIndex !== undefined && placeholderIndex >= 0) {
      // Use placeholder by index
      if (placeholderIndex < allPlaceholders.length) {
        targetPlaceholder = allPlaceholders[placeholderIndex];
        console.log(`🎯 Generating placeholder at index ${placeholderIndex}: "${targetPlaceholder.prompt}"`);
      } else {
        return new Response(
          JSON.stringify({ 
            error: `Placeholder index ${placeholderIndex} out of bounds. Only ${allPlaceholders.length} placeholders found.`,
            success: false
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    } else if (placeholder && placeholder.prompt) {
      // Use provided placeholder object
      // Find the matching placeholder in HTML
      const matchingPlaceholder = allPlaceholders.find(p => 
        p.prompt === placeholder.prompt || 
        p.description === placeholder.description
      );
      
      if (matchingPlaceholder) {
        targetPlaceholder = matchingPlaceholder;
        console.log(`🎯 Generating provided placeholder: "${placeholder.prompt}"`);
      } else {
        // If no exact match, create a synthetic placeholder
        targetPlaceholder = {
          fullMatch: `<div class="image-placeholder" data-prompt="${placeholder.prompt}">Image: ${placeholder.description}</div>`,
          prompt: placeholder.prompt,
          description: placeholder.description,
          type: placeholder.type || "provided"
        };
        console.log(`🎯 Creating new placeholder for: "${placeholder.prompt}"`);
      }
    } else {
      // Legacy mode: generate all placeholders
      console.log(`🔄 Legacy mode: generating all ${allPlaceholders.length} placeholders`);
      
      if (allPlaceholders.length === 0) {
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

      // Generate images for each placeholder (legacy behavior)
      const imageResults = [];
      let imagesGenerated = 0;
      
      for (let i = 0; i < allPlaceholders.length; i++) {
        const placeholder = allPlaceholders[i];
        console.log(`   Generating image ${i + 1}/${allPlaceholders.length}: "${placeholder.prompt}"`);
        
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

      // Replace all placeholders with generated images
      let processedHtml = htmlContent;
      for (let i = 0; i < allPlaceholders.length; i++) {
        processedHtml = replaceSpecificPlaceholder(processedHtml, allPlaceholders[i], imageResults[i]);
      }

      return new Response(
        JSON.stringify({
          success: true,
          htmlContent: processedHtml,
          imagesGenerated,
          totalPlaceholders: allPlaceholders.length,
          placeholders: allPlaceholders.map(p => ({
            prompt: p.prompt,
            description: p.description,
            type: p.type,
          })),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Generate single image for the target placeholder
    if (!targetPlaceholder) {
      return new Response(
        JSON.stringify({ 
          error: "Could not determine which placeholder to generate",
          success: false
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`   Generating single image: "${targetPlaceholder.prompt}"`);
    
    let imageResult: { base64: string | null; error?: string } = { base64: null };
    
    try {
      const imageBase64 = await generateImage(targetPlaceholder.prompt, false);
      
      if (imageBase64) {
        console.log(`   ✅ Image generated (${imageBase64.length} chars)`);
        imageResult = { base64: imageBase64 };
      } else {
        console.log(`   ❌ Image failed to generate`);
        imageResult = { base64: null, error: "No image returned from generator" };
      }
    } catch (error) {
      console.error(`   ❌ Error generating image:`, error);
      imageResult = { 
        base64: null, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }

    // Replace the specific placeholder with generated image
    const processedHtml = replaceSpecificPlaceholder(htmlContent, targetPlaceholder, imageResult);

    return new Response(
      JSON.stringify({
        success: true,
        htmlContent: processedHtml,
        imagesGenerated: imageResult.base64 ? 1 : 0,
        totalPlaceholders: allPlaceholders.length,
        placeholderGenerated: {
          index: placeholderIndex,
          prompt: targetPlaceholder.prompt,
          description: targetPlaceholder.description,
          type: targetPlaceholder.type,
          success: !!imageResult.base64,
          error: imageResult.error
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in generate-images:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate images",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
