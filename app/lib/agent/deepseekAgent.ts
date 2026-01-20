import "dotenv/config";
import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

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
  maxTokens: 4000, // Increased for reasoning
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

// System prompts for different steps and languages
const SYSTEM_PROMPTS = {
  outline: {
    en: `You are a presentation expert. Develop a comprehensive presentation outline with these details:

Generate a detailed, practical presentation outline that includes:
1. Title and engaging introduction
2. Structured framework with time allocations
3. Content development for each key point
4. Visual design suggestions
5. Audience engagement strategies
6. Delivery techniques
7. Q&A preparation
8. Clear call to action

Format in markdown with clear headings and bullet points. Think step-by-step and provide well-reasoned, comprehensive responses.`,
    ru: `Вы эксперт по созданию презентаций. Разработайте комплексную структуру презентации с учетом следующих деталей:

Создайте подробную, практичную структуру презентации, которая включает:
1. Заголовок и увлекательное введение
2. Структурированную основу с распределением времени
3. Разработку содержания для каждого ключевого пункта
4. Предложения по визуальному оформлению
5. Стратегии вовлечения аудитории
6. Техники подачи материала
7. Подготовку к вопросам и ответам
8. Четкий призыв к действию

Форматируйте в markdown с четкими заголовками и маркированными списками. Думайте шаг за шагом и предоставляйте хорошо обоснованные, комплексные ответы.`
  },
  speech: {
    en: `You are a professional speech writer. Create a spoken presentation script based on the provided outline.

Create a natural, engaging spoken presentation script that:
1. Has a conversational tone suitable for the target audience
2. Includes speaker notes and delivery suggestions
3. Incorporates rhetorical devices (questions, pauses, emphasis)
4. Provides timing guidance
5. Includes audience interaction points
6. Has clear transitions between sections
7. Ends with a memorable conclusion

Format as a speaker's script with clear indications for pacing, emphasis, and audience engagement. Think step-by-step and provide well-reasoned, comprehensive responses.`,
    ru: `Вы профессиональный писатель речей. Создайте устный сценарий презентации на основе предоставленной структуры.

Создайте естественный, увлекательный устный сценарий презентации, который:
1. Имеет разговорный тон, подходящий для целевой аудитории
2. Включает заметки для выступающего и предложения по подаче
3. Использует риторические приемы (вопросы, паузы, акценты)
4. Предоставляет рекомендации по времени
5. Включает точки взаимодействия с аудиторией
6. Имеет четкие переходы между разделами
7. Заканчивается запоминающимся заключением

Форматируйте как сценарий выступающего с четкими указаниями по темпу, акцентам и вовлечению аудитории. Думайте шаг за шагом и предоставляйте хорошо обоснованные, комплексные ответы.`
  },
  slides: {
    en: `You are a presentation design expert. Create slide content based on the provided speech script.

Create comprehensive slide content that:
1. Breaks the speech into logical slides (approximately 1 slide per minute)
2. Provides concise bullet points for each slide (not full sentences)
3. Suggests visual elements (charts, images, diagrams) where appropriate
4. Includes slide titles that summarize key messages
5. Provides speaker notes for each slide
6. Follows good presentation design principles (contrast, repetition, alignment, proximity)
7. Creates a visual story flow

Format as markdown with clear slide separators and visual suggestions. Think step-by-step and provide well-reasoned, comprehensive responses.`,
    ru: `Вы эксперт по дизайну презентаций. Создайте содержание слайдов на основе предоставленного сценария речи.

Создайте комплексное содержание слайдов, которое:
1. Разбивает речь на логические слайды (примерно 1 слайд в минуту)
2. Предоставляет краткие маркированные пункты для каждого слайда (не полные предложения)
3. Предлагает визуальные элементы (графики, изображения, диаграммы) там, где это уместно
4. Включает заголовки слайдов, которые суммируют ключевые сообщения
5. Предоставляет заметки для выступающего для каждого слайда
6. Следует хорошим принципам дизайна презентаций (контраст, повторение, выравнивание, близость)
7. Создает визуальный поток повествования

Форматируйте в markdown с четкими разделителями слайдов и визуальными предложениями. Думайте шаг за шагом и предоставляйте хорошо обоснованные, комплексные ответы.`
  }
};

// Enhanced agent implementation with continuous processing and concatenation
async function runAgent(input: string, stepType: string = "outline", language: string = "en"): Promise<string> {
  console.log(`\n🤖 Agent analyzing request for step: ${stepType}, language: ${language}...`);
  
  // Track all responses for concatenation
  const allResponses: string[] = [];
  let currentInput = input;
  let iteration = 0;
  const maxIterations = 3; // Limit to prevent infinite loops
  
  // Get appropriate system prompt
  const stepKey = stepType as keyof typeof SYSTEM_PROMPTS;
  const languageKey = language as keyof typeof SYSTEM_PROMPTS.outline;
  const systemPrompt = SYSTEM_PROMPTS[stepKey]?.[languageKey] || SYSTEM_PROMPTS.outline.en;
  
  const systemMessage = new SystemMessage(systemPrompt);

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n🔍 Reasoning iteration ${iteration}/${maxIterations}`);
    
    try {
      // Create messages for this iteration
      const messages: (SystemMessage | HumanMessage)[] = [systemMessage];
      
      // Add previous responses as context if available
      if (allResponses.length > 0) {
        const contextSummary = allResponses.slice(-2).join("\n\n");
        messages.push(
          new HumanMessage(`Previous reasoning context:\n${contextSummary}\n\nContinue processing: ${currentInput}`)
        );
      } else {
        messages.push(new HumanMessage(currentInput));
      }
      
      // Get response from reasoning model
      const response = await llm.invoke(messages);
      const responseContent = typeof response.content === 'string' 
        ? response.content 
        : Array.isArray(response.content)
        ? response.content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join(' ')
        : JSON.stringify(response.content);
      
      // Store response
      allResponses.push(responseContent);
      console.log(`📝 Response ${iteration} length: ${responseContent.length} chars`);
      
      // Check if we should continue processing
      // Look for indicators that more processing is needed
      const needsMoreProcessing = 
        responseContent.includes("Let me think") ||
        responseContent.includes("I need to consider") ||
        responseContent.includes("Further analysis") ||
        responseContent.includes("Additionally") ||
        responseContent.length > 1500; // Long responses might need breaking down
      
      if (!needsMoreProcessing || iteration >= maxIterations) {
        // Concatenate all responses
        const finalResponse = allResponses.join("\n\n---\n\n");
        console.log(`✅ Final response concatenated from ${allResponses.length} reasoning steps`);
        console.log(`📊 Total response length: ${finalResponse.length} chars`);
        return finalResponse;
      }
      
      // Prepare for next iteration
      currentInput = `Based on the previous analysis, provide additional insights or address any remaining aspects: ${responseContent.substring(responseContent.length - 500)}`;
      
    } catch (error) {
      console.error(`❌ Error in reasoning iteration ${iteration}:`, error);
      
      // If we have some responses, return what we have
      if (allResponses.length > 0) {
        const partialResponse = allResponses.join("\n\n---\n\n");
        console.log(`⚠️ Returning partial response after error (${allResponses.length} steps)`);
        return partialResponse;
      }
      
      // Fallback to simple response
      console.log("⚠️ Falling back to simple response");
      const fallbackResponse = await llm.invoke([
        systemMessage,
        new HumanMessage(input),
      ]);
      const fallbackContent = typeof fallbackResponse.content === 'string'
        ? fallbackResponse.content
        : Array.isArray(fallbackResponse.content)
        ? fallbackResponse.content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join(' ')
        : JSON.stringify(fallbackResponse.content);
      return fallbackContent;
    }
  }
  
  // Concatenate all responses if we reached max iterations
  const finalResponse = allResponses.join("\n\n---\n\n");
  console.log(`🔄 Reached max iterations (${maxIterations}), returning concatenated response`);
  console.log(`📊 Total response length: ${finalResponse.length} chars`);
  return finalResponse;
}

// Streaming agent implementation for real-time feedback
async function* runAgentStream(input: string, stepType: string = "outline", language: string = "en"): AsyncGenerator<string> {
  console.log(`\n🤖 Streaming agent for step: ${stepType}, language: ${language}...`);
  
  // Get appropriate system prompt
  const stepKey = stepType as keyof typeof SYSTEM_PROMPTS;
  const languageKey = language as keyof typeof SYSTEM_PROMPTS.outline;
  const systemPrompt = SYSTEM_PROMPTS[stepKey]?.[languageKey] || SYSTEM_PROMPTS.outline.en;
  
  const systemMessage = new SystemMessage(systemPrompt);
  const messages: (SystemMessage | HumanMessage)[] = [systemMessage, new HumanMessage(input)];
  
  try {
    // Use streaming API
    const stream = await llm.stream(messages);
    
    for await (const chunk of stream) {
      if (chunk.content) {
        const content = typeof chunk.content === 'string' 
          ? chunk.content 
          : Array.isArray(chunk.content)
          ? chunk.content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join(' ')
          : JSON.stringify(chunk.content);
        
        if (content.trim()) {
          yield content;
        }
      }
    }
    
    console.log(`✅ Streaming completed for ${stepType}`);
  } catch (error) {
    console.error(`❌ Error in streaming agent:`, error);
    yield `Error: ${error instanceof Error ? error.message : 'Failed to generate content'}`;
  }
}

export { runAgent, runAgentStream };
