import "dotenv/config";
import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getSystemPrompt } from "./prompts";

const config = {
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  deepseekBaseUrl: "https://api.deepseek.com",
};

// Validate configuration
if (!config.deepseekApiKey) {
  console.error("Error: DEEPSEEK_API_KEY is not set in .env file");
  console.error("Please add your DeepSeek API key to the .env file");
  console.error("You can get one from: https://platform.deepseek.com/api_keys");
  process.exit(1);
}

// Build configuration for DeepSeek client - Using reasoning model (R1)
const deepSeekConfig = {
  apiKey: config.deepseekApiKey,
  model: "deepseek-reasoner", // Using reasoning model for better processing
  configuration: {
    baseURL: config.deepseekBaseUrl,
  },
  temperature: 0.7,
  maxTokens: 8000, // Increased for complete HTML generation
  reasoningEffort: "high", // Enable reasoning effort
  streaming: true, // Enable streaming
};

// Initialize DeepSeek LLM using ChatDeepSeek (DeepSeek is OpenAI-compatible)
console.log("Initializing DeepSeek Reasoning LLM with API key...");
const llm = new ChatDeepSeek(deepSeekConfig);
if (!llm) {
  console.error("❌ Failed to initialize DeepSeek Reasoning LLM");
  process.exit(1);
}

console.log(`🚀 initializing...`);


// Streaming agent implementation with tool support
async function* runAgentForSlides(
  input: string,
  stepType: string = "html_slides",
  language: string = "en",
): AsyncGenerator<string> {
  console.log(
    `\n🤖 Streaming agent with tools for step: ${stepType}, language: ${language}...`,
  );

  // Get appropriate system prompt using the helper function
  const systemPrompt = getSystemPrompt(stepType, language);
  const systemMessage = new SystemMessage(systemPrompt);
  console.log('-----',systemPrompt)
  // Initial messages
  const messages: (SystemMessage | HumanMessage)[] = [
    systemMessage,
    new HumanMessage(input),
  ];

  try {
    // Buffer to collect all content for post-processing
    let bufferedContent = "";
    
    // Use streaming API
    const stream = await llm.stream(messages);
    let totalChunks = 0;
    let totalContentLength = 0;

    for await (const chunk of stream) {
      if (chunk.content) {
        const content =
          typeof chunk.content === "string"
            ? chunk.content
            : Array.isArray(chunk.content)
              ? chunk.content
                  .map((c) => (typeof c === "string" ? c : JSON.stringify(c)))
                  .join(" ")
              : JSON.stringify(chunk.content);

        if (content.trim()) {
          totalChunks++;
          totalContentLength += content.length;
          bufferedContent += content;
          
          // Yield content as it comes (with placeholders)
          yield content;
        }
      }
    }

    console.log(`✅ Streaming completed for ${stepType}: ${totalChunks} chunks, ${totalContentLength} chars`);
  
  } catch (error) {
    console.error(`❌ Error in streaming agent with tools:`, error);
    yield `Error: ${error instanceof Error ? error.message : "Failed to generate content"}`;
  }
}

// Helper function to extract image placeholders from HTML
function extractImagePlaceholders(htmlContent: string): Array<{
  fullMatch: string;
  prompt: string;
  description: string;
  type: string;
  isBackground?: boolean;
  targetElement?: string;
}> {
  const placeholders = [];

  // Format 2: Background image placeholders (special format)
  const backgroundPlaceholderRegex = /<!--\s*BACKGROUND_IMAGE_PLACEHOLDER:([^:]+):([^>]+)-->/g;
  let bgMatch;

  while ((bgMatch = backgroundPlaceholderRegex.exec(htmlContent)) !== null) {
    placeholders.push({
      fullMatch: bgMatch[0],
      prompt: bgMatch[1].trim(),
      description: bgMatch[2].trim(),
      type: "background-comment",
      isBackground: true,
    });
  }

  // Format 5: Style attribute placeholders (for background images)
  // Match style="<!-- BACKGROUND_IMAGE_PLACEHOLDER:prompt:description -->" 
  // The ? after [^"]* makes it non-greedy to avoid consuming the closing quote
  // Use [^>]* for description to match everything up to -->
  const stylePlaceholderRegex = /style="[^"]*?<!--\s*BACKGROUND_IMAGE_PLACEHOLDER:([^:]+):([^>]+)-->\s*"/g;
  let styleMatch;

  while ((styleMatch = stylePlaceholderRegex.exec(htmlContent)) !== null) {
    placeholders.push({
      fullMatch: styleMatch[0],
      prompt: styleMatch[1].trim(),
      description: styleMatch[2].trim(),
      type: "style-background",
      isBackground: true,
    });
  }

  // Format 6: Data attributes for background images
  const dataBackgroundRegex = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*\s+data-background-image="([^"]+)"[^>]*>/g;
  let dataBgMatch;

  while ((dataBgMatch = dataBackgroundRegex.exec(htmlContent)) !== null) {
    const element = dataBgMatch[1];
    const prompt = dataBgMatch[2].trim();
    
    placeholders.push({
      fullMatch: dataBgMatch[0],
      prompt: prompt,
      description: `Background image for ${element}`,
      type: "data-background",
      isBackground: true,
      targetElement: element,
    });
  }

  // Format 3: Div placeholders with data-prompt attribute
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

    // Check if it's a background placeholder by looking for background-related keywords
    const isBackground = innerText.toLowerCase().includes('background') || 
                         prompt.toLowerCase().includes('background');

    placeholders.push({
      fullMatch: divDataMatch[0],
      prompt: prompt,
      description: description || prompt,
      type: "div-data-prompt",
      isBackground: isBackground,
    });
  }

  // Format 4: Div placeholders without data-prompt (old format, fallback)
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

    // Check if it's a background placeholder
    const isBackground = fullText.toLowerCase().includes('background') || 
                         prompt.toLowerCase().includes('background');

    placeholders.push({
      fullMatch: divMatch[0],
      prompt: prompt,
      description: description,
      type: "div",
      isBackground: isBackground,
    });
  }

  

  // Format 1: Comment placeholders (regular images)
  const commentPlaceholderRegex = /<!-- IMAGE_PLACEHOLDER:(.+?):(.+?)-->/g;
  let match;

  while ((match = commentPlaceholderRegex.exec(htmlContent)) !== null) {
    placeholders.push({
      fullMatch: match[0],
      prompt: match[1].trim(),
      description: match[2].trim(),
      type: "comment",
      isBackground: false,
    });
  }

  return placeholders;
}

export { runAgentForSlides, extractImagePlaceholders };