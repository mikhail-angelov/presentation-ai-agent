import { NextRequest } from "next/server";
import { generateImage } from "@/app/lib/agent/yandexML";
import { extractImagePlaceholders } from "@/app/lib/agent/deepseekAgentForSlides";

// Helper function to replace a specific placeholder with an image
function replaceSpecificPlaceholder(
  htmlContent: string,
  placeholder: { 
    fullMatch: string; 
    description: string; 
    prompt: string; 
    type: string;
    isBackground?: boolean;
    targetElement?: string;
  },
  imageResult: { base64: string | null; error?: string }
): string {
  let processedContent = htmlContent;
  
  if (imageResult.base64) {
    // Check if this is a background image
    const isBackground = placeholder.isBackground || 
                         placeholder.type.includes('background') ||
                         placeholder.description.toLowerCase().includes('background') ||
                         placeholder.prompt.toLowerCase().includes('background');
    
    if (isBackground) {
      // Handle background image replacement
      let replacement = '';
      
      switch (placeholder.type) {
        case 'background-comment':
          // For <!-- BACKGROUND_IMAGE_PLACEHOLDER:... --> format
          // This is a standalone comment that should be replaced with a style attribute
          // We need to find the element that contains this comment and add the style to it
          
          // First, find the element that contains this comment
          const elementStart = htmlContent.lastIndexOf('<', htmlContent.indexOf(placeholder.fullMatch));
          const elementEnd = htmlContent.indexOf('>', htmlContent.indexOf(placeholder.fullMatch));
          
          if (elementStart !== -1 && elementEnd !== -1) {
            const element = htmlContent.substring(elementStart, elementEnd + 1);
            
            // Check if element already has a style attribute
            if (element.includes('style="')) {
              // Add background image to existing style
              replacement = element.replace(
                /style="([^"]*)"/,
                (match, existingStyle) => {
                  // Remove the comment from the style
                  const cleanStyle = existingStyle.replace(placeholder.fullMatch, '').trim();
                  const newStyle = cleanStyle ? 
                    `${cleanStyle}; background-image: url('data:image/jpeg;base64,${imageResult.base64}'); background-size: cover; background-position: center; background-repeat: no-repeat;` :
                    `background-image: url('data:image/jpeg;base64,${imageResult.base64}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
                  return `style="${newStyle}"`;
                }
              );
            } else {
              // Add new style attribute
              replacement = element.replace('>', ` style="background-image: url('data:image/jpeg;base64,${imageResult.base64}'); background-size: cover; background-position: center; background-repeat: no-repeat;">`);
            }
          } else {
            // Fallback: just replace the comment with style attribute
            replacement = `style="background-image: url('data:image/jpeg;base64,${imageResult.base64}'); background-size: cover; background-position: center; background-repeat: no-repeat;"`;
          }
          break;
          
        case 'style-background':
          // For style="<!-- BACKGROUND_IMAGE_PLACEHOLDER:... -->" format
          // The placeholder.fullMatch might be just the style attribute or might include the closing quote
          // We need to be more careful about the replacement
          
          // Check if placeholder.fullMatch ends with a quote
          let styleAttribute = placeholder.fullMatch;
          if (styleAttribute.endsWith('"') && styleAttribute.startsWith('style="')) {
            // It's the full style attribute with quotes, replace it directly
            replacement = `style="background-image: url('data:image/jpeg;base64,${imageResult.base64}'); background-size: cover; background-position: center; background-repeat: no-repeat;"`;
          } else if (styleAttribute.startsWith('style="')) {
            // It starts with style=" but doesn't end with quote
            // This means the regex didn't capture the closing quote
            // We need to replace from style=" to the next quote
            // For safety, we'll use a different approach
            replacement = `style="background-image: url('data:image/jpeg;base64,${imageResult.base64}'); background-size: cover; background-position: center; background-repeat: no-repeat;"`;
          } else {
            // Fallback
            replacement = `style="background-image: url('data:image/jpeg;base64,${imageResult.base64}'); background-size: cover; background-position: center; background-repeat: no-repeat;"`;
          }
          break;
          
        case 'data-background':
          // Replace data-background-image attribute with style attribute
          replacement = placeholder.fullMatch
            .replace(`data-background-image="${placeholder.prompt}"`, '')
            .replace('>', ` style="background-image: url('data:image/jpeg;base64,${imageResult.base64}'); background-size: cover; background-position: center; background-repeat: no-repeat;">`);
          break;
          
        default:
          // For div placeholders that should be backgrounds
          if (placeholder.type.includes('div') && isBackground) {
            // Replace div with a container that has background image
            replacement = `<div style="background-image: url('data:image/jpeg;base64,${imageResult.base64}'); background-size: cover; background-position: center; background-repeat: no-repeat; width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: -1;"></div>`;
          } else {
            // Default to regular image tag
            replacement = `<img src="data:image/jpeg;base64,${imageResult.base64}" alt="${placeholder.description}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">`;
          }
      }
      
      processedContent = processedContent.replace(placeholder.fullMatch, replacement);
    } else {
      // Regular image placeholder
      const imgTag = `<img src="data:image/jpeg;base64,${imageResult.base64}" alt="${placeholder.description}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">`;
      processedContent = processedContent.replace(placeholder.fullMatch, imgTag);
    }
  } else {
    // Failed to generate image - use fallback
    const isBackground = placeholder.isBackground || placeholder.type.includes('background');
    
    if (isBackground) {
      // Fallback for background images
      const fallbackStyle = `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px;`;
      const fallbackDiv = `<div style="${fallbackStyle}">
            <p style="color: white; font-size: 1.2rem; margin-bottom: 10px;">Background Image: ${placeholder.description}</p>
            <p style="color: rgba(255,255,255,0.8); font-size: 12px;">(Failed to generate image${imageResult.error ? `: ${imageResult.error}` : ''})</p>
          </div>`;
      processedContent = processedContent.replace(placeholder.fullMatch, fallbackDiv);
    } else {
      // Fallback for regular images
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
