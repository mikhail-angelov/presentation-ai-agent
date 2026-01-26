import "dotenv/config";
import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getSystemPrompt } from "./prompts";
import { generateImage } from "./yandexML";

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

// Tool definitions for the agent
const tools = [
  {
    name: "generate_image",
    description: "Generate an image using AI based on a text prompt",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Detailed description of the image to generate"
        }
      },
      required: ["prompt"]
    },
    execute: async (args: { prompt: string }) => {
      console.log(`🖼️ Generating image with prompt: ${args.prompt}`);
      try {
        const imageBase64 = await generateImage(args.prompt);
        console.log(`✅ Image generated successfully (${imageBase64.length} chars)`);
        return imageBase64;
      } catch (error) {
        console.error(`❌ Error generating image:`, error);
        throw error;
      }
    }
  }
];

// Enhanced agent implementation with tool support
async function runAgentWithTools(
  input: string,
  stepType: string = "html_slides",
  language: string = "en",
): Promise<string> {
  console.log(
    `\n🤖 Agent with tools analyzing request for step: ${stepType}, language: ${language}...`,
  );

  // Get appropriate system prompt using the helper function
  const systemPrompt = getSystemPrompt(stepType, language);
  const systemMessage = new SystemMessage(systemPrompt);
  
  // Initial messages
  const messages: (SystemMessage | HumanMessage)[] = [
    systemMessage,
    new HumanMessage(input),
  ];

  try {
    // For now, we'll use a simple approach: generate images first, then create HTML
    // In a more sophisticated implementation, we would use proper function calling
    // But for simplicity, we'll extract image prompts and generate them
    
    // Extract image prompts from the input (simplified approach)
    // This is a placeholder - in a real implementation, we would use the LLM to decide when to call tools
    
    // For html_slides step, we'll generate images based on the topic
    if (stepType === "html_slides") {
      // Extract topic from input (simplified)
      const topicMatch = input.match(/PRESENTATION TOPIC:\s*(.+)/i);
      const topic = topicMatch ? topicMatch[1] : "presentation";
      
      // Generate main image for first slide
      const mainImagePrompt = `Professional presentation slide image about: ${topic}. Clean, modern design suitable for a business presentation.`;
      
      console.log(`🖼️ Generating main image for topic: ${topic}`);
      let mainImageBase64 = "";
      try {
        mainImageBase64 = await generateImage(mainImagePrompt);
        console.log(`✅ Main image generated (${mainImageBase64.length} chars)`);
      } catch (error) {
        console.error(`❌ Error generating main image:`, error);
        // Continue without image if generation fails
      }
      
      // Add image data to the input
      const enhancedInput = input + `\n\nMAIN PRESENTATION IMAGE (base64): ${mainImageBase64 ? "data:image/jpeg;base64," + mainImageBase64.substring(0, 100) + "..." : "NO_IMAGE_AVAILABLE"}`;
      
      // Update the human message with enhanced input
      messages[1] = new HumanMessage(enhancedInput);
    }

    // Use streaming API and collect chunks
    const stream = await llm.stream(messages);
    let fullContent = "";

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
          fullContent += content;
        }
      }
    }

    console.log(`📊 Total response length: ${fullContent.length} chars`);
    return fullContent;
  } catch (error) {
    console.error(`❌ Error in runAgentWithTools:`, error);
    throw error;
  }
}

// Streaming agent implementation with tool support
async function* runAgentStreamWithTools(
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
  
  // Initial messages
  const messages: (SystemMessage | HumanMessage)[] = [
    systemMessage,
    new HumanMessage(input),
  ];

  try {
    // For html_slides step, generate images first
    let mainImageBase64 = "";
    if (stepType === "html_slides") {
      // Extract topic from input
      const topicMatch = input.match(/PRESENTATION TOPIC:\s*(.+)/i);
      const topic = topicMatch ? topicMatch[1] : "presentation";
      
      // Generate main image for first slide
      const mainImagePrompt = `Professional presentation slide image about: ${topic}. Clean, modern design suitable for a business presentation.`;
      
      console.log(`🖼️ Generating main image for topic: ${topic}`);
      try {
        mainImageBase64 = await generateImage(mainImagePrompt);
        console.log(`✅ Main image generated (${mainImageBase64.length} chars)`);
      } catch (error) {
        console.error(`❌ Error generating main image:`, error);
        // Continue without image
      }
      
      // Add image data to the input
      const enhancedInput = input + `\n\nMAIN PRESENTATION IMAGE (base64): ${mainImageBase64 ? "data:image/jpeg;base64," + mainImageBase64 : "NO_IMAGE_AVAILABLE"}`;
      
      // Update the human message with enhanced input
      messages[1] = new HumanMessage(enhancedInput);
    }

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

export { runAgentWithTools, runAgentStreamWithTools };