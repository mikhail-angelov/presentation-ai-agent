import "dotenv/config";
import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const config = {
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  deepseekBaseUrl: "https://api.deepseek.com",
  agentName: "Prez AI Agent",
  agentDescription: "AI agent with thinking critic and planning capabilities",
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
};

// Initialize DeepSeek LLM using ChatDeepSeek (DeepSeek is OpenAI-compatible)
console.log("Initializing DeepSeek Reasoning LLM with API key...");
const llm = new ChatDeepSeek(deepSeekConfig);
if (!llm) {
  console.error("❌ Failed to initialize DeepSeek Reasoning LLM");
  process.exit(1);
}

console.log(`🚀 ${config.agentName} initializing...`);
console.log(`📝 Description: ${config.agentDescription}`);

// Thinking Critic Tools
const thinkingCriticTools = [
  new DynamicStructuredTool({
    name: "thinking",
    description:
      "Analyze and critique a thought process for logical flaws, biases, and improvements",
    schema: z.object({
      thought_process: z.string().describe("The thinking process to critique"),
      context: z
        .string()
        .optional()
        .describe("Additional context for the critique"),
    }),
    func: async ({ thought_process, context }) => {
      const prompt = `As a thinking critic, analyze this thought process for logical consistency, biases, and potential improvements:

Thought Process: ${thought_process}
${context ? `Context: ${context}` : ""}

Provide a structured critique with:
1. Logical flaws identified
2. Cognitive biases detected  
3. Alternative perspectives
4. Specific improvements suggested
5. Confidence level in the original thinking`;

      const response = await llm.invoke([
        new SystemMessage(
          "You are a critical thinking expert. Analyze thought processes rigorously but constructively."
        ),
        new HumanMessage(prompt),
      ]);

      return JSON.stringify(
        {
          critique: response.content,
          timestamp: new Date().toISOString(),
          tool_used: "thinking",
        },
        null,
        2
      );
    },
  }),
  new DynamicStructuredTool({
    name: "planing",
    description:
      "Generate step-by-step advice for improving thinking or decision making",
    schema: z.object({
      problem: z.string().describe("The problem or decision needing advice"),
      current_approach: z
        .string()
        .optional()
        .describe("Current approach being taken"),
    }),
    func: async ({ problem, current_approach }) => {
      const prompt = `Generate step-by-step advice for this problem:

Problem: ${problem}
${current_approach ? `Current Approach: ${current_approach}` : ""}

Provide actionable advice steps that:
1. Break down the problem systematically
2. Suggest concrete actions
3. Include checkpoints for evaluation
4. Consider potential pitfalls
5. Offer alternative strategies`;

      const response = await llm.invoke([
        new SystemMessage(
          "You are an expert advisor who provides clear, actionable, step-by-step guidance."
        ),
        new HumanMessage(prompt),
      ]);

      return JSON.stringify(
        {
          advice_steps: response.content,
          generated_at: new Date().toISOString(),
          tool_used: "planing",
        },
        null,
        2
      );
    },
  }),
];

// Planning Tools (with simulated user approval)
let currentPlan: any = null;
let planApprovalStatus = "none";

const planningTools = [
  new DynamicStructuredTool({
    name: "create_plan",
    description:
      "Create or update a detailed plan with milestones and dependencies",
    schema: z.object({
      objective: z.string().describe("The main objective of the plan"),
      constraints: z.string().optional().describe("Constraints or limitations"),
      timeline: z.string().optional().describe("Desired timeline or deadline"),
    }),
    func: async ({ objective, constraints, timeline }) => {
      const prompt = `Create a detailed plan for this objective:

Objective: ${objective}
${constraints ? `Constraints: ${constraints}` : ""}
${timeline ? `Timeline: ${timeline}` : ""}

Create a comprehensive plan with:
1. Clear milestones and deliverables
2. Dependencies between tasks
3. Resource requirements
4. Risk assessment
5. Success criteria
6. Timeline with estimates`;

      const response = await llm.invoke([
        new SystemMessage(
          "You are an expert planner who creates detailed, actionable plans with clear milestones."
        ),
        new HumanMessage(prompt),
      ]);

      currentPlan = {
        objective,
        constraints,
        timeline,
        plan_details: response.content,
        created_at: new Date().toISOString(),
        requires_approval: true,
      };
      planApprovalStatus = "pending_review";

      return JSON.stringify(
        {
          plan: currentPlan,
          message:
            "Plan created successfully. Requires user approval before execution.",
          approval_required: true,
          tool_used: "create_plan",
        },
        null,
        2
      );
    },
  }),
  new DynamicStructuredTool({
    name: "request_plan_approval",
    description:
      "Request user approval for the current plan (simulates user interaction)",
    schema: z.object({
      changes_requested: z
        .string()
        .optional()
        .describe("Any changes requested by the user"),
    }),
    func: async ({ changes_requested }) => {
      if (!currentPlan) {
        return JSON.stringify({
          error: "No plan exists to approve. Create a plan first.",
        });
      }

      if (changes_requested) {
        // Update plan based on requested changes
        const updatePrompt = `Update the existing plan based on these requested changes:

Original Plan Objective: ${currentPlan.objective}
Requested Changes: ${changes_requested}

Provide an updated plan that incorporates the requested changes while maintaining coherence.`;

        const updateResponse = await llm.invoke([
          new SystemMessage(
            "You are a planner who incorporates feedback and updates plans accordingly."
          ),
          new HumanMessage(updatePrompt),
        ]);

        currentPlan.plan_details = updateResponse.content;
        currentPlan.updated_at = new Date().toISOString();
        currentPlan.changes_requested = changes_requested;
      }

      // Simulate user approval process
      console.log("\n⚠️  PLAN APPROVAL REQUIRED ⚠️");
      console.log("Plan requires user approval before execution.");
      console.log("Objective:", currentPlan.objective);
      console.log("Simulating user approval...");

      // Simulate approval delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      planApprovalStatus = "approved";
      currentPlan.approved_at = new Date().toISOString();
      currentPlan.approved_by = "user";

      return JSON.stringify(
        {
          status: "approved",
          plan: currentPlan,
          message: "Plan approved successfully. Ready for execution.",
          timestamp: new Date().toISOString(),
          tool_used: "request_plan_approval",
        },
        null,
        2
      );
    },
  }),
  new DynamicStructuredTool({
    name: "check_plan_status",
    description: "Check the current plan status and approval state",
    schema: z.object({}),
    func: async () => {
      return JSON.stringify(
        {
          current_plan: currentPlan,
          approval_status: planApprovalStatus,
          last_updated: new Date().toISOString(),
          tool_used: "check_plan_status",
        },
        null,
        2
      );
    },
  }),
];

// Combine all tools
const allTools = [...thinkingCriticTools, ...planningTools];

// Enhanced agent implementation with continuous processing and concatenation
async function runAgent(input: string): Promise<string> {
  console.log("\n🤖 Agent analyzing request with reasoning...");
  
  // Track all responses for concatenation
  const allResponses: string[] = [];
  let currentInput = input;
  let iteration = 0;
  const maxIterations = 3; // Limit to prevent infinite loops
  
  // System message for reasoning agent
  const systemMessage = new SystemMessage(`You are ${config.agentName}, an advanced reasoning AI assistant with thinking critic and planning capabilities.

Your capabilities:
1. CRITICAL THINKING: Analyze thought processes for logical flaws, biases, and improvements
2. PLANNING: Create detailed plans with milestones, dependencies, and risk assessment
3. ADVICE: Provide step-by-step guidance for complex problems
4. REASONING: Break down complex problems into manageable steps
5. SYNTHESIS: Combine multiple perspectives into coherent solutions

Reasoning Process:
1. First, analyze the user's request to understand the core need
2. Break down complex requests into logical components
3. Process each component systematically
4. Synthesize insights from all components
5. Provide comprehensive, actionable responses

Always think step-by-step and provide well-reasoned, comprehensive responses.`);

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

export { runAgent };
