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

// Enhanced agent implementation with continuous processing and concatenation
async function runAgent(
  input: string,
  stepType: string = "outline",
  language: string = "en",
): Promise<string> {
  console.log(
    `\n🤖 Agent analyzing request for step: ${stepType}, language: ${language}...`,
  );

  // Get appropriate system prompt using the helper function
  const systemPrompt = getSystemPrompt(stepType, language);
  const systemMessage = new SystemMessage(systemPrompt);
  const messages: (SystemMessage | HumanMessage)[] = [
    systemMessage,
    new HumanMessage(input),
  ];

  try {
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
    console.error(`❌ Error in runAgent:`, error);
    throw error;
  }
}

// Streaming agent implementation for real-time feedback
async function* runAgentStream(
  input: string,
  stepType: string = "outline",
  language: string = "en",
): AsyncGenerator<string> {
  console.log(
    `\n🤖 Streaming agent for step: ${stepType}, language: ${language}...`,
  );

  // Get appropriate system prompt using the helper function
  const systemPrompt = getSystemPrompt(stepType, language);
  const systemMessage = new SystemMessage(systemPrompt);
  const messages: (SystemMessage | HumanMessage)[] = [
    systemMessage,
    new HumanMessage(input),
  ];

  try {
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
    console.error(`❌ Error in streaming agent:`, error);
    yield `Error: ${error instanceof Error ? error.message : "Failed to generate content"}`;
  }
}

export { runAgent, runAgentStream };
